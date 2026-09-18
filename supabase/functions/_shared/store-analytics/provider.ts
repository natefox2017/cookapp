/**
 * Store provider interfaces (Issue #59).
 * Admin / DB / reports consume these models only — never Apple/Google raw shapes.
 */

import type {
  DateRange,
  FinancialReportRow,
  ProviderFetchResult,
  StoreAnalyticsPoint,
  StoreProviderId,
} from "./types.ts";

export interface StoreAnalyticsProvider {
  readonly providerId: StoreProviderId;

  /** Connection / configuration status without performing a full sync. */
  getConnectionStatus(): Promise<{
    configured: boolean;
    status: "not_configured" | "configured" | "future_reserved" | "error";
    detail?: string;
  }>;

  /**
   * Fetch analytics points for a date range.
   * Must not invent zeros for missing Apple privacy-threshold data.
   */
  fetchDailyAnalytics(
    range: DateRange,
  ): Promise<ProviderFetchResult<StoreAnalyticsPoint>>;
}

export interface FinancialReportProvider {
  readonly providerId: StoreProviderId;

  getConnectionStatus(): Promise<{
    configured: boolean;
    status: "not_configured" | "configured" | "future_reserved" | "error";
    detail?: string;
  }>;

  /**
   * Fetch financial report rows for reconciliation.
   * Separate from analytics — never treat as the same "final revenue" series.
   */
  fetchFinancialReports(
    range: DateRange,
  ): Promise<ProviderFetchResult<FinancialReportRow>>;
}
