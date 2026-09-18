/** operational_jobs helpers (Issue #60). */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { AppError } from "../errors.ts";
import type { RequestContext } from "../request-context.ts";
import type {
  JobProvider,
  JobTrigger,
  OperationalJobRow,
  OperationalJobStatus,
} from "./types.ts";

export type CreateJobInput = {
  jobType: string;
  provider: JobProvider;
  status?: OperationalJobStatus;
  trigger?: JobTrigger;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  maxRetries?: number;
  parentJobId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  ctx?: Partial<RequestContext>;
};

export function mapOperationalJob(
  row: Record<string, unknown>,
): OperationalJobRow {
  return {
    id: String(row.id),
    job_type: String(row.job_type),
    provider: row.provider as JobProvider,
    status: row.status as OperationalJobStatus,
    trigger: row.trigger as JobTrigger,
    started_at: (row.started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    next_run_at: (row.next_run_at as string | null) ?? null,
    rows_affected: row.rows_affected != null ? Number(row.rows_affected) : null,
    items_total: row.items_total != null ? Number(row.items_total) : null,
    items_failed: row.items_failed != null ? Number(row.items_failed) : null,
    retry_count: Number(row.retry_count ?? 0),
    max_retries: Number(row.max_retries ?? 3),
    error_code: (row.error_code as string | null) ?? null,
    error_message: (row.error_message as string | null) ?? null,
    request_id: (row.request_id as string | null) ?? null,
    correlation_id: (row.correlation_id as string | null) ?? null,
    parent_job_id: (row.parent_job_id as string | null) ?? null,
    related_entity_type: (row.related_entity_type as string | null) ?? null,
    related_entity_id: (row.related_entity_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    source_table: row.source_table != null ? String(row.source_table) : undefined,
  };
}

export function toAdminJob(row: OperationalJobRow) {
  return {
    id: row.id,
    jobType: row.job_type,
    provider: row.provider,
    status: row.status,
    trigger: row.trigger,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    nextRunAt: row.next_run_at,
    rowsAffected: row.rows_affected,
    itemsTotal: row.items_total,
    itemsFailed: row.items_failed,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    requestId: row.request_id,
    correlationId: row.correlation_id,
    parentJobId: row.parent_job_id,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    metadata: row.metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceTable: row.source_table ?? "operational_jobs",
  };
}

export async function createOperationalJob(
  db: SupabaseClient,
  input: CreateJobInput,
): Promise<OperationalJobRow> {
  const now = new Date().toISOString();
  const status = input.status ?? "pending";
  const row = {
    job_type: input.jobType,
    provider: input.provider,
    status,
    trigger: input.trigger ?? "system",
    started_at: status === "running" ? now : null,
    metadata: input.metadata ?? {},
    created_by: input.createdBy ?? null,
    max_retries: input.maxRetries ?? 3,
    parent_job_id: input.parentJobId ?? null,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    request_id: input.ctx?.requestId ?? null,
    correlation_id: input.ctx?.correlationId ?? null,
  };

  const { data, error } = await db
    .from("operational_jobs")
    .insert(row)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError(
      "internal_error",
      error?.message ?? "Failed to create operational job",
      500,
    );
  }
  return mapOperationalJob(data as Record<string, unknown>);
}

export async function updateOperationalJob(
  db: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
): Promise<OperationalJobRow> {
  const { data, error } = await db
    .from("operational_jobs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError(
      "internal_error",
      error?.message ?? "Failed to update operational job",
      500,
    );
  }
  return mapOperationalJob(data as Record<string, unknown>);
}

export async function markJobRunning(
  db: SupabaseClient,
  id: string,
): Promise<OperationalJobRow> {
  return updateOperationalJob(db, id, {
    status: "running",
    started_at: new Date().toISOString(),
    error_code: null,
    error_message: null,
  });
}

export async function markJobFinished(
  db: SupabaseClient,
  id: string,
  result: {
    status: OperationalJobStatus;
    rowsAffected?: number | null;
    itemsTotal?: number | null;
    itemsFailed?: number | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<OperationalJobRow> {
  const patch: Record<string, unknown> = {
    status: result.status,
    completed_at: new Date().toISOString(),
    rows_affected: result.rowsAffected ?? null,
    items_total: result.itemsTotal ?? null,
    items_failed: result.itemsFailed ?? null,
    error_code: result.errorCode ?? null,
    error_message: result.errorMessage ?? null,
  };
  if (result.metadata) patch.metadata = result.metadata;
  return updateOperationalJob(db, id, patch);
}

export type ListJobsParams = {
  jobType?: string | null;
  provider?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
};

export async function listUnifiedJobs(
  db: SupabaseClient,
  params: ListJobsParams = {},
): Promise<{ data: OperationalJobRow[]; total: number }> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = db
    .from("v_operational_jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.jobType) query = query.eq("job_type", params.jobType);
  if (params.provider) query = query.eq("provider", params.provider);
  if (params.status) query = query.eq("status", params.status);

  const { data, error, count } = await query;
  if (error) {
    // Fallback if view missing during partial migrate: operational_jobs only.
    if ((error.message ?? "").toLowerCase().includes("v_operational_jobs")) {
      let fallback = db
        .from("operational_jobs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (params.jobType) fallback = fallback.eq("job_type", params.jobType);
      if (params.provider) fallback = fallback.eq("provider", params.provider);
      if (params.status) fallback = fallback.eq("status", params.status);
      const res = await fallback;
      if (res.error) {
        throw new AppError("internal_error", res.error.message, 500);
      }
      return {
        data: (res.data ?? []).map((r) =>
          mapOperationalJob(r as Record<string, unknown>)
        ),
        total: res.count ?? 0,
      };
    }
    throw new AppError("internal_error", error.message, 500);
  }

  return {
    data: (data ?? []).map((r) =>
      mapOperationalJob(r as Record<string, unknown>)
    ),
    total: count ?? 0,
  };
}

export async function getJobById(
  db: SupabaseClient,
  id: string,
): Promise<OperationalJobRow | null> {
  const { data, error } = await db
    .from("v_operational_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    const { data: row, error: err2 } = await db
      .from("operational_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (err2) throw new AppError("internal_error", err2.message, 500);
    return row ? mapOperationalJob(row as Record<string, unknown>) : null;
  }
  return data ? mapOperationalJob(data as Record<string, unknown>) : null;
}

export function providerForJobType(jobType: string): JobProvider {
  switch (jobType) {
    case "storage_cleanup_import_artifacts":
    case "recipe_import_worker":
    case "recipe_import":
      return "cookapp";
    case "asc_analytics_sync":
    case "asc_financial_sync":
    case "store_analytics_sync":
    case "financial_report_sync":
      return "app_store_connect";
    case "revenuecat_health_check":
      return "revenuecat";
    case "ai_gateway_health_check":
      return "ai_gateway";
    case "google_play_sync":
      return "google_play";
    default:
      return "cookapp";
  }
}

/** Normalize Admin aliases to #59 canonical job types. */
export function canonicalJobType(jobType: string): string {
  if (jobType === "asc_analytics_sync") return "store_analytics_sync";
  if (jobType === "asc_financial_sync") return "financial_report_sync";
  return jobType;
}
