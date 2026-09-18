/**
 * Worker tick logic for Import Queue (Issue #56).
 * Calls shared runImportPipeline — does not reimplement extraction/AI/import.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { recordMonitorEvent } from "../monitor.ts";
import type { RequestContext } from "../request-context.ts";
import {
  runImportPipeline,
  type PipelineJobRow,
} from "./pipeline.ts";
import type { PipelineStage } from "./types.ts";
import {
  type ClaimedImportMessage,
  type ImportQueue,
  type ImportQueueRuntimeConfig,
  clampConcurrency,
} from "./queue.ts";

export type WorkerTickResult = {
  claimed: number;
  processed: number;
  succeeded: number;
  failed: number;
  poisoned: number;
  skipped: number;
  recovered: number;
  results: Array<{
    job_id: string;
    msg_id: number;
    outcome: "succeeded" | "failed" | "poisoned" | "skipped";
    status?: string;
    error?: string;
  }>;
};

export type ProcessJobFn = (
  job: PipelineJobRow,
  fromStage: PipelineStage,
  ctx: RequestContext,
) => Promise<{ status: string }>;

const TERMINAL_SKIP = new Set(["imported", "rejected", "duplicate"]);

async function loadJob(
  admin: SupabaseClient,
  jobId: string,
): Promise<PipelineJobRow | null> {
  const { data, error } = await admin
    .from("recipe_import_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PipelineJobRow | null) ?? null;
}

async function refreshBatch(
  admin: SupabaseClient,
  batchId: string | null | undefined,
) {
  if (!batchId) return;
  await admin.rpc("refresh_recipe_import_batch_summary", {
    p_batch_id: batchId,
  });
}

async function markPoisonFailed(
  admin: SupabaseClient,
  job: PipelineJobRow,
  readCt: number,
  maxAttempts: number,
) {
  await admin.from("recipe_import_jobs").update({
    status: "failed",
    error_code: "IMPORT_FAILED",
    error_message: `Poison message: exceeded max queue attempts (${readCt}/${maxAttempts})`,
    completed_at: new Date().toISOString(),
  }).eq("id", job.id);
  await refreshBatch(admin, job.batch_id);
}

/**
 * Process one claimed queue message.
 * - Terminal jobs → archive + skip (idempotent)
 * - read_ct > maxAttempts → poison fail + archive
 * - pipeline throws → leave for VT retry (unless poison path)
 * - pipeline completes → archive
 */
export async function processClaimedMessage(
  admin: SupabaseClient,
  queue: ImportQueue,
  claimed: ClaimedImportMessage,
  opts: {
    maxAttempts: number;
    ctx: RequestContext;
    processJob?: ProcessJobFn;
    confidenceThreshold?: number;
  },
): Promise<WorkerTickResult["results"][number]> {
  const { message, msg_id, read_ct } = claimed;
  const jobCtx: RequestContext = {
    requestId: opts.ctx.requestId,
    correlationId: message.correlation_id ?? opts.ctx.correlationId,
    jobId: message.job_id,
  };

  const job = await loadJob(admin, message.job_id);
  if (!job) {
    await queue.archive(msg_id);
    return {
      job_id: message.job_id,
      msg_id,
      outcome: "skipped",
      error: "job_not_found",
    };
  }

  if (TERMINAL_SKIP.has(job.status)) {
    await queue.archive(msg_id);
    return {
      job_id: job.id,
      msg_id,
      outcome: "skipped",
      status: job.status,
    };
  }

  // Another worker may hold this job; leave message for VT retry (do not archive).
  if (job.status === "running") {
    return {
      job_id: job.id,
      msg_id,
      outcome: "skipped",
      status: "running",
    };
  }

  if (read_ct > opts.maxAttempts) {
    await markPoisonFailed(admin, job, read_ct, opts.maxAttempts);
    await queue.archive(msg_id);
    recordMonitorEvent({
      kind: "job_failure",
      source: "recipe-import-worker",
      reason: "poison_max_attempts",
      code: "IMPORT_FAILED",
      fields: { job_id: job.id, read_ct, max_attempts: opts.maxAttempts },
      ctx: jobCtx,
    });
    return {
      job_id: job.id,
      msg_id,
      outcome: "poisoned",
      status: "failed",
    };
  }

  try {
    const processJob = opts.processJob ??
      (async (j, fromStage) => {
        const result = await runImportPipeline(j, {
          admin,
          confidenceThreshold: opts.confidenceThreshold,
        }, { fromStage });
        return { status: result.status };
      });

    const result = await processJob(job, message.from_stage, jobCtx);
    await refreshBatch(admin, job.batch_id);
    await queue.archive(msg_id);
    return {
      job_id: job.id,
      msg_id,
      outcome: "succeeded",
      status: result.status,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    recordMonitorEvent({
      kind: "import_failure",
      source: "recipe-import-worker",
      reason: errMsg,
      code: "pipeline_throw",
      fields: { job_id: job.id, msg_id, read_ct },
      ctx: jobCtx,
    });

    // Leave message for VT retry; poison on next read if over budget.
    if (read_ct >= opts.maxAttempts) {
      await markPoisonFailed(admin, job, read_ct, opts.maxAttempts);
      await queue.archive(msg_id);
      return {
        job_id: job.id,
        msg_id,
        outcome: "poisoned",
        status: "failed",
        error: errMsg,
      };
    }

    return {
      job_id: job.id,
      msg_id,
      outcome: "failed",
      error: errMsg,
    };
  }
}

export async function runWorkerTick(
  admin: SupabaseClient,
  queue: ImportQueue,
  config: ImportQueueRuntimeConfig,
  ctx: RequestContext,
  options: {
    processJob?: ProcessJobFn;
    recoverStale?: boolean;
  } = {},
): Promise<WorkerTickResult> {
  let recovered = 0;
  if (options.recoverStale !== false) {
    const { data, error } = await admin.rpc("recipe_import_requeue_stale_pending", {
      p_limit: clampConcurrency(config.concurrency) * 2,
      p_older_than_seconds: 60,
      p_correlation_id: ctx.correlationId,
    });
    if (!error && Array.isArray(data)) {
      recovered = data.length;
    }
  }

  const qty = clampConcurrency(config.concurrency);
  const claimed = await queue.read({
    vt: config.visibilityTimeoutSec,
    qty,
  });

  const results: WorkerTickResult["results"] = [];
  let succeeded = 0;
  let failed = 0;
  let poisoned = 0;
  let skipped = 0;

  // Bound parallelism to configured concurrency (messages already limited by qty).
  const settled = await Promise.all(
    claimed.map((msg) =>
      processClaimedMessage(admin, queue, msg, {
        maxAttempts: config.maxAttempts,
        ctx,
        processJob: options.processJob,
        confidenceThreshold: config.confidenceThreshold,
      })
    ),
  );

  for (const r of settled) {
    results.push(r);
    if (r.outcome === "succeeded") succeeded++;
    else if (r.outcome === "failed") failed++;
    else if (r.outcome === "poisoned") poisoned++;
    else skipped++;
  }

  return {
    claimed: claimed.length,
    processed: settled.length,
    succeeded,
    failed,
    poisoned,
    skipped,
    recovered,
    results,
  };
}
