/**
 * Store sync orchestration — records every run in store_sync_runs (Issue #59).
 * Never upserts invented zeros; analytics and financial stay in separate tables.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { RequestContext } from "../request-context.ts";
import {
  AppleAppStoreAnalyticsProvider,
  AppleAppStoreFinancialProvider,
} from "./apple-provider.ts";
import {
  GooglePlayAnalyticsProvider,
  GooglePlayFinancialProvider,
} from "./google-provider.ts";
import type {
  DateRange,
  FinancialReportRow,
  StoreAnalyticsPoint,
  StoreProviderId,
  StoreSyncJobType,
  StoreSyncRunStatus,
} from "./types.ts";

export type SyncTrigger = "manual" | "cron" | "worker";

export type SyncRunResult = {
  runId: string;
  jobType: StoreSyncJobType;
  provider: StoreProviderId;
  status: StoreSyncRunStatus;
  rowsUpserted: number;
  errorCode: string | null;
  errorMessage: string | null;
  metadata?: Record<string, unknown>;
};

function defaultRange(days = 30): DateRange {
  const end = new Date();
  const start = new Date(Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate() - (days - 1),
  ));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

async function insertRun(
  db: SupabaseClient,
  input: {
    jobType: StoreSyncJobType;
    provider: StoreProviderId;
    status: StoreSyncRunStatus;
    triggeredBy: SyncTrigger;
    actorAdminId?: string | null;
    range: DateRange;
    ctx?: Partial<RequestContext>;
    metadata?: Record<string, unknown>;
  },
): Promise<string> {
  const { data, error } = await db
    .from("store_sync_runs")
    .insert({
      job_type: input.jobType,
      provider: input.provider,
      status: input.status,
      triggered_by: input.triggeredBy,
      actor_admin_id: input.actorAdminId ?? null,
      range_start: input.range.start,
      range_end: input.range.end,
      request_id: input.ctx?.requestId ?? null,
      correlation_id: input.ctx?.correlationId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert store_sync_runs");
  }
  return data.id as string;
}

async function finishRun(
  db: SupabaseClient,
  runId: string,
  patch: {
    status: StoreSyncRunStatus;
    rowsUpserted?: number;
    errorCode?: string | null;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .from("store_sync_runs")
    .update({
      status: patch.status,
      rows_upserted: patch.rowsUpserted ?? 0,
      error_code: patch.errorCode ?? null,
      error_message: patch.errorMessage ?? null,
      completed_at: new Date().toISOString(),
      ...(patch.metadata ? { metadata: patch.metadata } : {}),
    })
    .eq("id", runId);
}

async function markIntegration(
  db: SupabaseClient,
  provider: StoreProviderId,
  outcome: "success" | "error" | "not_configured" | "reserved",
  message?: string,
): Promise<void> {
  if (provider === "google_play") {
    await db
      .from("store_integrations")
      .update({
        status: "future_reserved",
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider);
    return;
  }

  const now = new Date().toISOString();
  if (outcome === "success") {
    await db
      .from("store_integrations")
      .update({
        status: "configured",
        last_success_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq("provider", provider);
    return;
  }
  if (outcome === "not_configured") {
    await db
      .from("store_integrations")
      .update({
        status: "not_configured",
        last_error_at: now,
        last_error: message ?? "Not configured",
        updated_at: now,
      })
      .eq("provider", provider);
    return;
  }
  if (outcome === "reserved") return;
  await db
    .from("store_integrations")
    .update({
      status: "error",
      last_error_at: now,
      last_error: message ?? "Sync failed",
      updated_at: now,
    })
    .eq("provider", provider);
}

/** Upsert analytics points. Skips inventing zeros — null values allowed. */
export async function upsertAnalyticsPoints(
  db: SupabaseClient,
  runId: string,
  points: StoreAnalyticsPoint[],
): Promise<number> {
  if (points.length === 0) return 0;
  const rows = points.map((p) => ({
    metric_date: p.metricDate,
    platform: p.platform,
    store: p.store,
    // Empty string (not SQL NULL) so unique grain + upsert conflict keys stay stable
    territory: p.territory ?? "",
    acquisition_source: p.acquisitionSource ?? "",
    metric_key: p.metricKey,
    metric_value: p.metricValue,
    data_status: p.dataStatus,
    provider_source: p.providerSource,
    estimated: p.estimated,
    sync_run_id: runId,
    synced_at: new Date().toISOString(),
    dimensions: p.dimensions ?? {},
    updated_at: new Date().toISOString(),
  }));

  // Chunk to avoid payload limits
  let upserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await db
      .from("store_analytics_daily")
      .upsert(chunk, {
        onConflict:
          "metric_date,platform,store,territory,acquisition_source,metric_key,provider_source",
        count: "exact",
      });
    if (error) throw new Error(error.message);
    upserted += count ?? chunk.length;
  }
  return upserted;
}

export async function upsertFinancialRows(
  db: SupabaseClient,
  runId: string,
  items: FinancialReportRow[],
): Promise<number> {
  if (items.length === 0) return 0;
  const rows = items.map((r) => ({
    platform: r.platform,
    store: r.store,
    fiscal_period: r.fiscalPeriod,
    report_date: r.reportDate,
    territory: r.territory,
    currency: r.currency,
    product_id: r.productId,
    units: r.units,
    gross_amount: r.grossAmount,
    developer_proceeds: r.developerProceeds,
    taxes: r.taxes,
    adjustments: r.adjustments,
    exchange_rate: r.exchangeRate,
    report_status: r.reportStatus,
    provider_source: r.providerSource,
    provider_row_key: r.providerRowKey,
    sync_run_id: runId,
    synced_at: new Date().toISOString(),
    dimensions: r.dimensions ?? {},
    updated_at: new Date().toISOString(),
  }));

  let upserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await db
      .from("financial_report_rows")
      .upsert(chunk, {
        onConflict: "provider_source,provider_row_key",
        count: "exact",
      });
    if (error) throw new Error(error.message);
    upserted += count ?? chunk.length;
  }
  return upserted;
}

export async function runAnalyticsSync(
  db: SupabaseClient,
  options: {
    provider: StoreProviderId;
    range?: DateRange;
    triggeredBy?: SyncTrigger;
    actorAdminId?: string | null;
    ctx?: Partial<RequestContext>;
  },
): Promise<SyncRunResult> {
  const range = options.range ?? defaultRange(30);
  const triggeredBy = options.triggeredBy ?? "manual";
  const provider = options.provider;

  if (provider === "google_play") {
    const runId = await insertRun(db, {
      jobType: "store_analytics_sync",
      provider,
      status: "running",
      triggeredBy,
      actorAdminId: options.actorAdminId,
      range,
      ctx: options.ctx,
    });
    await finishRun(db, runId, {
      status: "skipped_reserved",
      rowsUpserted: 0,
      errorCode: "future_reserved",
      errorMessage:
        "Google Play analytics sync is Future Reserved — no fake Android series",
    });
    await markIntegration(db, provider, "reserved");
    return {
      runId,
      jobType: "store_analytics_sync",
      provider,
      status: "skipped_reserved",
      rowsUpserted: 0,
      errorCode: "future_reserved",
      errorMessage: "Google Play Future Reserved",
    };
  }

  const runId = await insertRun(db, {
    jobType: "store_analytics_sync",
    provider,
    status: "running",
    triggeredBy,
    actorAdminId: options.actorAdminId,
    range,
    ctx: options.ctx,
  });

  const analyticsProvider = new AppleAppStoreAnalyticsProvider(db);
  const result = await analyticsProvider.fetchDailyAnalytics(range);

  if (result.status === "not_configured") {
    await finishRun(db, runId, {
      status: "skipped_not_configured",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "not_configured",
      errorMessage: result.errorMessage ?? "Not configured",
      metadata: result.metadata,
    });
    await markIntegration(db, provider, "not_configured", result.errorMessage);
    return {
      runId,
      jobType: "store_analytics_sync",
      provider,
      status: "skipped_not_configured",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "not_configured",
      errorMessage: result.errorMessage ?? "Not configured",
      metadata: result.metadata,
    };
  }

  if (result.status === "error") {
    await finishRun(db, runId, {
      status: "failed",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "error",
      errorMessage: result.errorMessage ?? "Sync failed",
      metadata: result.metadata,
    });
    await markIntegration(db, provider, "error", result.errorMessage);
    return {
      runId,
      jobType: "store_analytics_sync",
      provider,
      status: "failed",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "error",
      errorMessage: result.errorMessage ?? "Sync failed",
      metadata: result.metadata,
    };
  }

  const rowsUpserted = await upsertAnalyticsPoints(db, runId, result.rows);
  await finishRun(db, runId, {
    status: "succeeded",
    rowsUpserted,
    metadata: result.metadata,
  });
  await markIntegration(db, provider, "success");
  return {
    runId,
    jobType: "store_analytics_sync",
    provider,
    status: "succeeded",
    rowsUpserted,
    errorCode: null,
    errorMessage: null,
    metadata: result.metadata,
  };
}

export async function runFinancialSync(
  db: SupabaseClient,
  options: {
    provider: StoreProviderId;
    range?: DateRange;
    triggeredBy?: SyncTrigger;
    actorAdminId?: string | null;
    ctx?: Partial<RequestContext>;
  },
): Promise<SyncRunResult> {
  const range = options.range ?? defaultRange(90);
  const triggeredBy = options.triggeredBy ?? "manual";
  const provider = options.provider;

  if (provider === "google_play") {
    const runId = await insertRun(db, {
      jobType: "financial_report_sync",
      provider,
      status: "running",
      triggeredBy,
      actorAdminId: options.actorAdminId,
      range,
      ctx: options.ctx,
    });
    await finishRun(db, runId, {
      status: "skipped_reserved",
      rowsUpserted: 0,
      errorCode: "future_reserved",
      errorMessage:
        "Google Play financial sync is Future Reserved — no fake Android proceeds",
    });
    await markIntegration(db, provider, "reserved");
    return {
      runId,
      jobType: "financial_report_sync",
      provider,
      status: "skipped_reserved",
      rowsUpserted: 0,
      errorCode: "future_reserved",
      errorMessage: "Google Play Future Reserved",
    };
  }

  const runId = await insertRun(db, {
    jobType: "financial_report_sync",
    provider,
    status: "running",
    triggeredBy,
    actorAdminId: options.actorAdminId,
    range,
    ctx: options.ctx,
  });

  const financialProvider = new AppleAppStoreFinancialProvider(db);
  const result = await financialProvider.fetchFinancialReports(range);

  if (result.status === "not_configured") {
    await finishRun(db, runId, {
      status: "skipped_not_configured",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "not_configured",
      errorMessage: result.errorMessage ?? "Not configured",
      metadata: result.metadata,
    });
    await markIntegration(db, provider, "not_configured", result.errorMessage);
    return {
      runId,
      jobType: "financial_report_sync",
      provider,
      status: "skipped_not_configured",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "not_configured",
      errorMessage: result.errorMessage ?? "Not configured",
      metadata: result.metadata,
    };
  }

  if (result.status === "error") {
    await finishRun(db, runId, {
      status: "failed",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "error",
      errorMessage: result.errorMessage ?? "Sync failed",
      metadata: result.metadata,
    });
    await markIntegration(db, provider, "error", result.errorMessage);
    return {
      runId,
      jobType: "financial_report_sync",
      provider,
      status: "failed",
      rowsUpserted: 0,
      errorCode: result.errorCode ?? "error",
      errorMessage: result.errorMessage ?? "Sync failed",
      metadata: result.metadata,
    };
  }

  const rowsUpserted = await upsertFinancialRows(db, runId, result.rows);
  await finishRun(db, runId, {
    status: "succeeded",
    rowsUpserted,
    metadata: result.metadata,
  });
  await markIntegration(db, provider, "success");
  return {
    runId,
    jobType: "financial_report_sync",
    provider,
    status: "succeeded",
    rowsUpserted,
    errorCode: null,
    errorMessage: null,
    metadata: result.metadata,
  };
}

export function createAnalyticsProvider(
  db: SupabaseClient,
  provider: StoreProviderId,
) {
  if (provider === "google_play") return new GooglePlayAnalyticsProvider();
  return new AppleAppStoreAnalyticsProvider(db);
}

export function createFinancialProvider(
  db: SupabaseClient,
  provider: StoreProviderId,
) {
  if (provider === "google_play") return new GooglePlayFinancialProvider();
  return new AppleAppStoreFinancialProvider(db);
}
