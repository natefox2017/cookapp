/** Shared types for Admin Operations / Aggregation (#60). */

export type JobProvider =
  | "cookapp"
  | "supabase"
  | "revenuecat"
  | "app_store_connect"
  | "google_play"
  | "ai_gateway";

export type OperationalJobStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "not_configured"
  | "future_reserved";

export type JobTrigger = "manual" | "cron" | "webhook" | "system" | "retry";

export type KpiAvailability =
  | "available"
  | "estimated"
  | "no_data"
  | "not_configured"
  | "schema_pending"
  | "future_reserved";

export type IntegrationKey =
  | "supabase"
  | "revenuecat"
  | "app_store_connect"
  | "ai_gateway"
  | "google_play";

export type IntegrationStatus =
  | "connected"
  | "not_configured"
  | "degraded"
  | "unknown"
  | "future_reserved";

export type KpiMetric = {
  key: string;
  label: string;
  value: number | null;
  unit?: string | null;
  source: string | null;
  freshness: string | null;
  availability: KpiAvailability;
  estimated?: boolean;
  note?: string | null;
  dateRange?: { from: string | null; to: string | null } | null;
};

export type OperationalJobRow = {
  id: string;
  job_type: string;
  provider: JobProvider;
  status: OperationalJobStatus;
  trigger: JobTrigger;
  started_at: string | null;
  completed_at: string | null;
  next_run_at: string | null;
  rows_affected: number | null;
  items_total: number | null;
  items_failed: number | null;
  retry_count: number;
  max_retries: number;
  error_code: string | null;
  error_message: string | null;
  request_id: string | null;
  correlation_id: string | null;
  parent_job_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  source_table?: string;
};

/** Job types that support Admin manual run. */
export const MANUAL_RUN_JOB_TYPES = [
  "storage_cleanup_import_artifacts",
  "store_analytics_sync",
  "financial_report_sync",
  // Aliases kept for OpenAPI / Admin callers during transition
  "asc_analytics_sync",
  "asc_financial_sync",
  "revenuecat_health_check",
  "ai_gateway_health_check",
  "google_play_sync",
  "recipe_import_worker",
] as const;

export type ManualRunJobType = (typeof MANUAL_RUN_JOB_TYPES)[number];

export function isManualRunJobType(value: string): value is ManualRunJobType {
  return (MANUAL_RUN_JOB_TYPES as readonly string[]).includes(value);
}
