// Cron/ops worker for App Store analytics + financial sync (Issue #59).
// Auth: Authorization Bearer <STORE_SYNC_WORKER_SECRET>
// Deploy: supabase functions deploy store-sync-worker --project-ref semsjyrqjnumpvanibip

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
  runAnalyticsSync,
  runFinancialSync,
} from "../_shared/store-analytics/mod.ts";

const JOB_TYPE = "store_sync_worker";

function requireWorkerSecret(req: Request): void {
  const expected = Deno.env.get("STORE_SYNC_WORKER_SECRET");
  if (!expected) {
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    throw new AppError(
      "server_misconfigured",
      "STORE_SYNC_WORKER_SECRET is not configured",
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

    const body = req.headers.get("content-type")?.includes("application/json")
      ? await req.json().catch(() => ({})) as Record<string, unknown>
      : {};

    const syncAnalytics = body.analytics !== false;
    const syncFinancial = body.financial !== false;
    // Google Play is never auto-synced.
    const provider = "apple_app_store" as const;

    const admin = createServiceClient();
    const results = [];

    if (syncAnalytics) {
      results.push(
        await runAnalyticsSync(admin, {
          provider,
          triggeredBy: "worker",
          ctx,
        }),
      );
    }
    if (syncFinancial) {
      results.push(
        await runFinancialSync(admin, {
          provider,
          triggeredBy: "worker",
          ctx,
        }),
      );
    }

    log("info", "store_sync_worker_done", {
      job_type: JOB_TYPE,
      results: results.map((r) => ({
        runId: r.runId,
        jobType: r.jobType,
        status: r.status,
        rowsUpserted: r.rowsUpserted,
      })),
    }, ctx);

    return json({ ok: true, job_type: JOB_TYPE, results }, 200, headers, ctx);
  } catch (err) {
    return errorResponse(err, headers, ctx);
  }
});
