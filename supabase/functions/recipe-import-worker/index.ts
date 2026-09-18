// Async Import Queue worker (Issue #56).
// Backend: Supabase Queues (pgmq). Calls shared runImportPipeline from #55.
// Auth: Authorization Bearer <RECIPE_IMPORT_WORKER_SECRET> (server/cron only).
// Deploy: supabase functions deploy recipe-import-worker --project-ref semsjyrqjnumpvanibip

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient, requireEnv } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";
import {
  resolveRequestContext,
  requestIdHeaders,
} from "../_shared/request-context.ts";
import {
  createImportQueue,
  loadImportQueueRuntimeConfig,
} from "../_shared/recipe-import/queue.ts";
import { runWorkerTick } from "../_shared/recipe-import/worker.ts";

const JOB_TYPE = "recipe_import_worker";

function requireWorkerSecret(req: Request): void {
  const expected = Deno.env.get("RECIPE_IMPORT_WORKER_SECRET");
  if (!expected) {
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    throw new AppError(
      "server_misconfigured",
      "RECIPE_IMPORT_WORKER_SECRET is not configured",
      500,
    );
  }
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${expected}`) {
    throw new AppError("unauthorized", "Invalid worker credentials", 401);
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  const ctx = resolveRequestContext(req);
  const headers = {
    ...publicCorsHeaders,
    ...requestIdHeaders(ctx),
  };

  try {
    if (req.method !== "POST") {
      throw new AppError("method_not_allowed", "POST required", 405);
    }

    requireWorkerSecret(req);

    let recoverStale = true;
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => ({})) as {
        recoverStale?: unknown;
      };
      if (body.recoverStale === false) recoverStale = false;
    }

    const admin = createServiceClient();
    const queue = createImportQueue(admin);
    const config = await loadImportQueueRuntimeConfig(admin);

    log("info", "recipe_import_worker_start", {
      job_type: JOB_TYPE,
      concurrency: config.concurrency,
      vt_sec: config.visibilityTimeoutSec,
      max_attempts: config.maxAttempts,
    }, ctx);

    const result = await runWorkerTick(admin, queue, config, ctx, {
      recoverStale,
    });

    log("info", "recipe_import_worker_done", {
      job_type: JOB_TYPE,
      ...result,
      results: undefined,
      sample: result.results.slice(0, 10),
    }, ctx);

    return json({ ok: true, job_type: JOB_TYPE, config, ...result }, 200, headers, ctx);
  } catch (err) {
    return errorResponse(err, headers, ctx);
  }
});
