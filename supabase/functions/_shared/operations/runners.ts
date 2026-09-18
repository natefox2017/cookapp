/**
 * Manual / retry runners for operational job types (Issue #60).
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { AppError } from "../errors.ts";
import { log } from "../logger.ts";
import { recordMonitorEvent } from "../monitor.ts";
import type { RequestContext } from "../request-context.ts";
import {
  cleanupExpiredImportArtifacts,
  createSupabaseMediaStorageProvider,
  JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS,
} from "../media-storage/mod.ts";
import {
  createOperationalJob,
  markJobFinished,
  markJobRunning,
  providerForJobType,
  updateOperationalJob,
  canonicalJobType,
} from "./jobs.ts";
import {
  persistIntegrationStatus,
  probeAiGateway,
  probeAppStoreConnect,
  probeRevenueCat,
} from "./integrations.ts";
import type { ManualRunJobType } from "./types.ts";
import {
  runAnalyticsSync,
  runFinancialSync,
} from "../store-analytics/mod.ts";

export type RunJobResult = {
  jobId: string;
  jobType: string;
  status: string;
  result: Record<string, unknown>;
};

async function startJob(
  db: SupabaseClient,
  jobType: ManualRunJobType | string,
  opts: {
    trigger?: "manual" | "retry";
    createdBy?: string | null;
    parentJobId?: string | null;
    ctx?: Partial<RequestContext>;
    metadata?: Record<string, unknown>;
  },
) {
  const job = await createOperationalJob(db, {
    jobType,
    provider: providerForJobType(jobType),
    status: "running",
    trigger: opts.trigger ?? "manual",
    createdBy: opts.createdBy,
    parentJobId: opts.parentJobId,
    ctx: opts.ctx,
    metadata: opts.metadata ?? {},
  });
  return job;
}

export async function runManualJob(
  db: SupabaseClient,
  jobType: ManualRunJobType,
  opts: {
    trigger?: "manual" | "retry";
    createdBy?: string | null;
    parentJobId?: string | null;
    ctx?: Partial<RequestContext>;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<RunJobResult> {
  const trigger = opts.trigger ?? "manual";

  if (jobType === "google_play_sync") {
    const job = await createOperationalJob(db, {
      jobType,
      provider: "google_play",
      status: "future_reserved",
      trigger,
      createdBy: opts.createdBy,
      parentJobId: opts.parentJobId,
      ctx: opts.ctx,
      metadata: {
        note: "Google Play Future Reserved — manual run refused",
      },
    });
    await markJobFinished(db, job.id, {
      status: "future_reserved",
      errorCode: "FUTURE_RESERVED",
      errorMessage: "Google Play sync is not implemented",
      metadata: { refused: true },
    });
    return {
      jobId: job.id,
      jobType,
      status: "future_reserved",
      result: { refused: true, reason: "future_reserved" },
    };
  }

  const canonical = canonicalJobType(jobType) as ManualRunJobType;

  if (
    canonical === "store_analytics_sync" ||
    canonical === "financial_report_sync" ||
    jobType === "asc_analytics_sync" ||
    jobType === "asc_financial_sync"
  ) {
    const syncJobType = canonical === "financial_report_sync" ||
        jobType === "asc_financial_sync"
      ? "financial_report_sync"
      : "store_analytics_sync";
    const probe = await probeAppStoreConnect(db);
    const job = await startJob(db, syncJobType, opts);
    if (probe.status === "not_configured") {
      await markJobFinished(db, job.id, {
        status: "not_configured",
        errorCode: "NOT_CONFIGURED",
        errorMessage: "App Store Connect keys are not configured",
        metadata: { probe: probe.details },
      });
      await persistIntegrationStatus(db, probe);
      return {
        jobId: job.id,
        jobType: syncJobType,
        status: "not_configured",
        result: { status: "not_configured", details: probe.details },
      };
    }

    try {
      const syncResult = syncJobType === "financial_report_sync"
        ? await runFinancialSync(db, {
          provider: "apple_app_store",
          triggeredBy: "manual",
          actorAdminId: opts.createdBy,
          ctx: opts.ctx,
        })
        : await runAnalyticsSync(db, {
          provider: "apple_app_store",
          triggeredBy: "manual",
          actorAdminId: opts.createdBy,
          ctx: opts.ctx,
        });

      await markJobFinished(db, job.id, {
        status: syncResult.status === "succeeded"
          ? "succeeded"
          : syncResult.status === "skipped_not_configured"
          ? "not_configured"
          : syncResult.status === "skipped_reserved"
          ? "future_reserved"
          : "failed",
        rowsAffected: syncResult.rowsUpserted,
        errorCode: syncResult.errorCode,
        errorMessage: syncResult.errorMessage,
        metadata: {
          storeSyncRunId: syncResult.runId,
          ...(syncResult.metadata ?? {}),
        },
      });
      await persistIntegrationStatus(db, await probeAppStoreConnect(db));
      const mappedStatus = syncResult.status === "succeeded"
        ? "succeeded"
        : syncResult.status === "skipped_not_configured"
        ? "not_configured"
        : syncResult.status === "skipped_reserved"
        ? "future_reserved"
        : "failed";
      return {
        jobId: job.id,
        jobType: syncJobType,
        status: mappedStatus,
        result: { ...syncResult },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "sync_failed";
      await markJobFinished(db, job.id, {
        status: "failed",
        errorCode: "SYNC_FAILED",
        errorMessage: message,
      });
      recordMonitorEvent({
        kind: "sync_failure",
        source: "app_store_connect",
        reason: message,
        code: "SYNC_FAILED",
        ctx: opts.ctx,
      });
      throw err;
    }
  }

  if (jobType === "revenuecat_health_check") {
    const job = await startJob(db, jobType, opts);
    const probe = await probeRevenueCat(db);
    await persistIntegrationStatus(db, probe);
    const ok = probe.status === "connected" || probe.status === "unknown";
    await markJobFinished(db, job.id, {
      status: probe.status === "not_configured"
        ? "not_configured"
        : probe.status === "degraded"
        ? "failed"
        : "succeeded",
      metadata: { probe: toSafeProbe(probe) },
      errorCode: probe.status === "not_configured"
        ? "NOT_CONFIGURED"
        : probe.status === "degraded"
        ? probe.lastErrorCode
        : null,
      errorMessage: probe.status === "not_configured"
        ? "RevenueCat webhook secret not configured"
        : probe.lastErrorMessage,
    });
    return {
      jobId: job.id,
      jobType,
      status: ok
        ? (probe.status === "not_configured" ? "not_configured" : "succeeded")
        : probe.status === "not_configured"
        ? "not_configured"
        : "failed",
      result: { integration: toSafeProbe(probe) },
    };
  }

  if (jobType === "ai_gateway_health_check") {
    const job = await startJob(db, jobType, opts);
    const probe = await probeAiGateway(db);
    await persistIntegrationStatus(db, probe);
    await markJobFinished(db, job.id, {
      status: probe.status === "not_configured"
        ? "not_configured"
        : probe.status === "degraded"
        ? "failed"
        : probe.status === "connected"
        ? "succeeded"
        : "succeeded",
      metadata: { probe: toSafeProbe(probe) },
      errorCode: probe.status === "degraded" ? probe.lastErrorCode : null,
      errorMessage: probe.status === "degraded" ? probe.lastErrorMessage : null,
    });
    return {
      jobId: job.id,
      jobType,
      status: probe.status === "degraded" ? "failed" : probe.status === "not_configured"
        ? "not_configured"
        : "succeeded",
      result: { integration: toSafeProbe(probe) },
    };
  }

  if (jobType === "storage_cleanup_import_artifacts") {
    const job = await startJob(db, jobType, opts);
    try {
      const provider = createSupabaseMediaStorageProvider(db);
      const result = await cleanupExpiredImportArtifacts(db, provider, {
        limit: 200,
      });
      await markJobFinished(db, job.id, {
        status: result.failed > 0 && result.deleted === 0 ? "failed" : "succeeded",
        rowsAffected: result.deleted,
        itemsTotal: result.scanned,
        itemsFailed: result.failed,
        metadata: {
          job_type: JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS,
          errors: result.errors.slice(0, 20),
        },
        errorCode: result.failed > 0 ? "PARTIAL_FAILURE" : null,
        errorMessage: result.failed > 0
          ? `${result.failed} object(s) failed to delete`
          : null,
      });
      return {
        jobId: job.id,
        jobType,
        status: result.failed > 0 && result.deleted === 0 ? "failed" : "succeeded",
        result: { ...result },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "cleanup_failed";
      await markJobFinished(db, job.id, {
        status: "failed",
        errorCode: "CLEANUP_FAILED",
        errorMessage: message,
      });
      recordMonitorEvent({
        kind: "job_failure",
        source: "storage_cleanup",
        reason: message,
        code: "CLEANUP_FAILED",
        ctx: opts.ctx,
      });
      throw err;
    }
  }

  if (jobType === "recipe_import_worker") {
    const job = await startJob(db, jobType, opts);
    const workerSecret = Deno.env.get("RECIPE_IMPORT_WORKER_SECRET");
    const base = Deno.env.get("SUPABASE_URL") ??
      Deno.env.get("COOKAPP_SUPABASE_URL");
    if (!workerSecret || !base) {
      await markJobFinished(db, job.id, {
        status: "not_configured",
        errorCode: "NOT_CONFIGURED",
        errorMessage: "RECIPE_IMPORT_WORKER_SECRET or SUPABASE_URL missing",
      });
      return {
        jobId: job.id,
        jobType,
        status: "not_configured",
        result: { status: "not_configured" },
      };
    }
    try {
      const res = await fetch(`${base}/functions/v1/recipe-import-worker`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${workerSecret}`,
          "Content-Type": "application/json",
          ...(opts.ctx?.requestId
            ? { "X-Request-Id": opts.ctx.requestId }
            : {}),
          ...(opts.ctx?.correlationId
            ? { "X-Correlation-Id": opts.ctx.correlationId }
            : {}),
          "X-Job-Id": job.id,
        },
        body: JSON.stringify({ recoverStale: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        await markJobFinished(db, job.id, {
          status: "failed",
          errorCode: "WORKER_HTTP_ERROR",
          errorMessage: `Worker returned ${res.status}`,
          metadata: { body },
        });
        return {
          jobId: job.id,
          jobType,
          status: "failed",
          result: { httpStatus: res.status, body },
        };
      }
      await markJobFinished(db, job.id, {
        status: "succeeded",
        rowsAffected: Number(
          (body as { processed?: number }).processed ?? 0,
        ),
        metadata: { worker: body },
      });
      return {
        jobId: job.id,
        jobType,
        status: "succeeded",
        result: body as Record<string, unknown>,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "worker_invoke_failed";
      await markJobFinished(db, job.id, {
        status: "failed",
        errorCode: "WORKER_INVOKE_FAILED",
        errorMessage: message,
      });
      throw err;
    }
  }

  throw new AppError("validation_error", `Unsupported job type: ${jobType}`, 400);
}

export async function retryJob(
  db: SupabaseClient,
  jobId: string,
  opts: {
    createdBy?: string | null;
    ctx?: Partial<RequestContext>;
    role: string;
  },
): Promise<RunJobResult> {
  const { data, error } = await db
    .from("operational_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new AppError("internal_error", error.message, 500);
  if (!data) {
    // recipe_import_jobs are retried via admin-recipe-import
    throw new AppError(
      "validation_error",
      "Only operational_jobs rows support retry here; use admin-recipe-import for import jobs",
      400,
    );
  }

  if (!["failed", "not_configured"].includes(String(data.status))) {
    throw new AppError(
      "validation_error",
      `Job status ${data.status} cannot be retried`,
      400,
    );
  }

  const jobType = String(data.job_type) as ManualRunJobType;
  const retryCount = Number(data.retry_count ?? 0) + 1;
  if (retryCount > Number(data.max_retries ?? 3)) {
    throw new AppError("validation_error", "Max retries exceeded", 400);
  }

  await updateOperationalJob(db, jobId, { retry_count: retryCount });

  log("info", "operational_job_retry", {
    job_id: jobId,
    job_type: jobType,
    retry_count: retryCount,
    actor_role: opts.role,
  }, opts.ctx);

  return runManualJob(db, jobType, {
    trigger: "retry",
    createdBy: opts.createdBy,
    parentJobId: jobId,
    ctx: opts.ctx,
    metadata: { retriedFrom: jobId, retryCount },
  });
}

function toSafeProbe(probe: {
  key: string;
  status: string;
  configComplete: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  checkedAt: string;
  details: Record<string, unknown>;
}) {
  return {
    key: probe.key,
    status: probe.status,
    configComplete: probe.configComplete,
    lastSuccessAt: probe.lastSuccessAt,
    lastErrorAt: probe.lastErrorAt,
    lastErrorCode: probe.lastErrorCode,
    lastErrorMessage: probe.lastErrorMessage,
    checkedAt: probe.checkedAt,
    details: probe.details,
  };
}

/** Ensure markJobRunning is referenced for future cron paths. */
export { markJobRunning };
