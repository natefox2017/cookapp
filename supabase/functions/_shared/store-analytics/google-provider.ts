/**
 * Google Play providers — Future Reserved only (Issue #59).
 * No credentials, no sync jobs, no fake Android series.
 */

import type {
  FinancialReportProvider,
  StoreAnalyticsProvider,
} from "./provider.ts";
import type {
  DateRange,
  FinancialReportRow,
  ProviderFetchResult,
  StoreAnalyticsPoint,
} from "./types.ts";

const RESERVED_DETAIL =
  "Google Play is Future Reserved until Android work starts. No credentials, sync, or zero-filled series.";

export class GooglePlayAnalyticsProvider implements StoreAnalyticsProvider {
  readonly providerId = "google_play" as const;

  async getConnectionStatus() {
    return {
      configured: false,
      status: "future_reserved" as const,
      detail: RESERVED_DETAIL,
    };
  }

  async fetchDailyAnalytics(
    _range: DateRange,
  ): Promise<ProviderFetchResult<StoreAnalyticsPoint>> {
    return {
      status: "future_reserved",
      rows: [],
      errorCode: "future_reserved",
      errorMessage: RESERVED_DETAIL,
      metadata: { provider: this.providerId },
    };
  }
}

export class GooglePlayFinancialProvider implements FinancialReportProvider {
  readonly providerId = "google_play" as const;

  async getConnectionStatus() {
    return {
      configured: false,
      status: "future_reserved" as const,
      detail: RESERVED_DETAIL,
    };
  }

  async fetchFinancialReports(
    _range: DateRange,
  ): Promise<ProviderFetchResult<FinancialReportRow>> {
    return {
      status: "future_reserved",
      rows: [],
      errorCode: "future_reserved",
      errorMessage: RESERVED_DETAIL,
      metadata: { provider: this.providerId },
    };
  }
}
