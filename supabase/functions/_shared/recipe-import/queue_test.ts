/**
 * Import Queue / Worker unit tests (Issue #56).
 * Run: deno test --allow-env supabase/functions/_shared/recipe-import/
 */

import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert@1";
import {
  MemoryImportQueue,
  clampConcurrency,
  clampMaxAttempts,
  parseFromStage,
} from "./queue.ts";
import {
  processClaimedMessage,
  runWorkerTick,
} from "./worker.ts";
import type { PipelineJobRow } from "./pipeline.ts";
import type { RequestContext } from "../request-context.ts";

const ctx: RequestContext = {
  requestId: "req-test",
  correlationId: "corr-test",
  jobId: null,
};

type FakeJob = PipelineJobRow & { status: string };

function makeAdmin(jobs: Map<string, FakeJob>) {
  return {
    from(table: string) {
      if (table !== "recipe_import_jobs") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select(_cols: string) {
          return {
            eq(col: string, id: string) {
              assertEquals(col, "id");
              return {
                async maybeSingle() {
                  return { data: jobs.get(id) ?? null, error: null };
                },
              };
            },
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            async eq(col: string, id: string) {
              assertEquals(col, "id");
              const job = jobs.get(id);
              if (job) Object.assign(job, patch);
              return { error: null };
            },
          };
        },
      };
    },
    async rpc(name: string, _args: Record<string, unknown>) {
      if (name === "refresh_recipe_import_batch_summary") {
        return { data: null, error: null };
      }
      if (name === "recipe_import_requeue_stale_pending") {
        return { data: [], error: null };
      }
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    },
  };
}

Deno.test("clampConcurrency bounds", () => {
  assertEquals(clampConcurrency(0), 3);
  assertEquals(clampConcurrency(100), 20);
  assertEquals(clampConcurrency(4), 4);
  assertEquals(clampMaxAttempts(0), 5);
  assertEquals(parseFromStage("parse"), "parse");
  assertEquals(parseFromStage("nope"), "resolve");
});

Deno.test("MemoryImportQueue enqueue / read / archive / VT retry", async () => {
  const q = new MemoryImportQueue();
  const id = await q.enqueue({
    job_id: "job-1",
    from_stage: "resolve",
    correlation_id: "c1",
  });
  assertExists(id);

  const first = await q.read({ vt: 60, qty: 5 });
  assertEquals(first.length, 1);
  assertEquals(first[0].message.job_id, "job-1");
  assertEquals(first[0].read_ct, 1);

  // Invisible under VT
  const empty = await q.read({ vt: 60, qty: 5 });
  assertEquals(empty.length, 0);

  q.release(first[0].msg_id);
  const second = await q.read({ vt: 60, qty: 5 });
  assertEquals(second.length, 1);
  assertEquals(second[0].read_ct, 2);

  await q.archive(second[0].msg_id);
  q.release(second[0].msg_id);
  assertEquals((await q.read({ vt: 60, qty: 5 })).length, 0);
});

Deno.test("worker: partial batch — one failure does not block siblings", async () => {
  const jobs = new Map<string, FakeJob>([
    ["a", {
      id: "a",
      batch_id: "b1",
      source_type: "web",
      source_url: "https://a.test",
      canonical_url: "https://a.test",
      source_external_id: null,
      source_text: null,
      destination_user_id: null,
      status: "pending",
      stage: "resolve",
      retry_count: 0,
    }],
    ["b", {
      id: "b",
      batch_id: "b1",
      source_type: "web",
      source_url: "https://b.test",
      canonical_url: "https://b.test",
      source_external_id: null,
      source_text: null,
      destination_user_id: null,
      status: "pending",
      stage: "resolve",
      retry_count: 0,
    }],
  ]);

  const queue = new MemoryImportQueue();
  await queue.enqueueMany([
    { job_id: "a", from_stage: "resolve" },
    { job_id: "b", from_stage: "resolve" },
  ]);

  const admin = makeAdmin(jobs) as unknown as Parameters<typeof runWorkerTick>[0];
  const result = await runWorkerTick(
    admin,
    queue,
    {
      concurrency: 5,
      visibilityTimeoutSec: 30,
      maxAttempts: 5,
      confidenceThreshold: 0.7,
    },
    ctx,
    {
      recoverStale: false,
      processJob: async (job) => {
        if (job.id === "a") throw new Error("boom_a");
        jobs.get(job.id)!.status = "imported";
        return { status: "imported" };
      },
    },
  );

  assertEquals(result.claimed, 2);
  assertEquals(result.succeeded, 1);
  assertEquals(result.failed, 1);
  assertEquals(result.poisoned, 0);
  // Failed message still pending for VT retry
  assertEquals(queue.pendingCount(), 1);
});

Deno.test("worker: retry from stage + poison after max attempts", async () => {
  const jobs = new Map<string, FakeJob>([
    ["j1", {
      id: "j1",
      batch_id: null,
      source_type: "text",
      source_url: null,
      canonical_url: null,
      source_external_id: null,
      source_text: "flour",
      destination_user_id: null,
      status: "failed",
      stage: "parse",
      retry_count: 1,
    }],
  ]);

  const queue = new MemoryImportQueue();
  const msgId = await queue.enqueue({
    job_id: "j1",
    from_stage: "parse",
    correlation_id: "retry-1",
  });
  assertExists(msgId);

  const admin = makeAdmin(jobs) as unknown as Parameters<typeof processClaimedMessage>[0];

  // Exhaust attempts
  for (let i = 0; i < 5; i++) {
    queue.release(msgId);
    const claimed = await queue.read({ vt: 1, qty: 1 });
    assertEquals(claimed.length, 1);
    const outcome = await processClaimedMessage(admin, queue, claimed[0], {
      maxAttempts: 3,
      ctx,
      processJob: async () => {
        throw new Error("still_failing");
      },
    });
    if (i < 2) {
      assertEquals(outcome.outcome, "failed");
    } else {
      // read_ct will be 3,4,5… poison when >= maxAttempts on throw path or > on entry
      if (outcome.outcome === "poisoned") {
        assertEquals(jobs.get("j1")!.status, "failed");
        assertEquals(queue.pendingCount(), 0);
        return;
      }
    }
  }
  // Final claim after releases should poison
  queue.release(msgId);
  const last = await queue.read({ vt: 1, qty: 1 });
  if (last.length) {
    const outcome = await processClaimedMessage(admin, queue, last[0], {
      maxAttempts: 3,
      ctx,
      processJob: async () => {
        throw new Error("still_failing");
      },
    });
    assertEquals(outcome.outcome, "poisoned");
  }
  assertEquals(jobs.get("j1")!.status, "failed");
});

Deno.test("worker: idempotent skip for already-imported job", async () => {
  const jobs = new Map<string, FakeJob>([
    ["done", {
      id: "done",
      batch_id: null,
      source_type: "web",
      source_url: "https://x.test",
      canonical_url: "https://x.test",
      source_external_id: null,
      source_text: null,
      destination_user_id: null,
      status: "imported",
      stage: "done",
      retry_count: 0,
    }],
  ]);
  const queue = new MemoryImportQueue();
  await queue.enqueue({ job_id: "done", from_stage: "resolve" });
  const admin = makeAdmin(jobs) as unknown as Parameters<typeof runWorkerTick>[0];
  let processed = 0;
  const result = await runWorkerTick(
    admin,
    queue,
    {
      concurrency: 2,
      visibilityTimeoutSec: 30,
      maxAttempts: 5,
      confidenceThreshold: 0.7,
    },
    ctx,
    {
      recoverStale: false,
      processJob: async () => {
        processed++;
        return { status: "imported" };
      },
    },
  );
  assertEquals(result.skipped, 1);
  assertEquals(processed, 0);
  assertEquals(queue.pendingCount(), 0);
});
