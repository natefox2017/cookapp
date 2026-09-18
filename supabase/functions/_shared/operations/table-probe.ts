/**
 * Probe whether optional #58/#59 tables exist (Issue #60).
 * Aggregation must not invent rows when schema is pending.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const tableExistsCache = new Map<string, boolean>();

/**
 * Returns true when `public.<table>` is selectable by service_role.
 * Caches per isolate lifetime. On error (missing relation), returns false.
 */
export async function tableExists(
  db: SupabaseClient,
  table: string,
): Promise<boolean> {
  const cached = tableExistsCache.get(table);
  if (cached !== undefined) return cached;

  const { error } = await db.from(table).select("*", { count: "exact", head: true });
  if (!error) {
    tableExistsCache.set(table, true);
    return true;
  }

  const msg = (error.message ?? "").toLowerCase();
  const missing =
    msg.includes("does not exist") ||
    msg.includes("could not find") ||
    msg.includes("schema cache") ||
    error.code === "42P01" ||
    error.code === "PGRST205";

  if (missing) {
    tableExistsCache.set(table, false);
    return false;
  }

  // Other errors: treat as present but unreadable so callers can surface errors.
  tableExistsCache.set(table, true);
  return true;
}

/** Test helper — clear probe cache between cases. */
export function clearTableExistsCache(): void {
  tableExistsCache.clear();
}

export const CONTRACT_TABLES = {
  paymentTransactions: "payment_transactions",
  userCommerceSummary: "user_commerce_summary",
  storeAnalyticsDaily: "store_analytics_daily",
  financialReportRows: "financial_report_rows",
  storeSyncRuns: "store_sync_runs",
} as const;
