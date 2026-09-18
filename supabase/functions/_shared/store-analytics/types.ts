/**
 * Store analytics / financial domain types (Issue #59).
 * Analytics and Financial are separate — never merge into one final revenue field.
 */

export type StorePlatform = "ios" | "android";
export type StoreId = "app_store" | "google_play";
export type StoreProviderId = "apple_app_store" | "google_play";

export type StoreIntegrationStatus =
  | "not_configured"
  | "configured"
  | "degraded"
  | "error"
  | "future_reserved";

export type StoreSyncJobType =
  | "store_analytics_sync"
  | "financial_report_sync";

export type StoreSyncRunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped_not_configured"
  | "skipped_reserved";

export type AnalyticsMetricKey =
  | "first_time_downloads"
  | "redownloads"
  | "total_downloads"
  | "units"
  | "product_page_views"
  | "impressions"
  | "paying_users"
  | "purchases"
  | "sessions"
  | "installs"
  | "deletions"
  | "other";

export type AnalyticsDataStatus =
  | "available"
  | "insufficient"
  | "not_returned"
  | "not_configured";

export type AnalyticsProviderSource =
  | "app_store_connect_analytics"
  | "sales_and_trends"
  | "google_play_console"
  | "manual";

export type FinancialProviderSource =
  | "apple_financial_reports"
  | "google_play_financial_reports"
  | "manual";

export type FinancialReportStatus =
  | "preliminary"
  | "final"
  | "adjusted"
  | "unavailable";

/** Normalized analytics point. metricValue null = Apple omitted / insufficient — never invent 0. */
export type StoreAnalyticsPoint = {
  metricDate: string; // YYYY-MM-DD
  platform: StorePlatform;
  store: StoreId;
  territory: string | null;
  acquisitionSource: string | null;
  metricKey: AnalyticsMetricKey;
  metricValue: number | null;
  dataStatus: AnalyticsDataStatus;
  providerSource: AnalyticsProviderSource;
  estimated: boolean;
  dimensions?: Record<string, unknown>;
};

export type FinancialReportRow = {
  platform: StorePlatform;
  store: StoreId;
  fiscalPeriod: string;
  reportDate: string | null;
  territory: string | null;
  currency: string | null;
  productId: string | null;
  units: number | null;
  grossAmount: number | null;
  developerProceeds: number | null;
  taxes: number | null;
  adjustments: number | null;
  exchangeRate: number | null;
  reportStatus: FinancialReportStatus;
  providerSource: FinancialProviderSource;
  providerRowKey: string;
  dimensions?: Record<string, unknown>;
};

export type DateRange = {
  start: string; // YYYY-MM-DD
  end: string;
};

export type ProviderFetchResult<T> = {
  status:
    | "ok"
    | "not_configured"
    | "future_reserved"
    | "error";
  rows: T[];
  errorCode?: string;
  errorMessage?: string;
  cursor?: string | null;
  metadata?: Record<string, unknown>;
};

export type AppleCredentials = {
  issuerId: string;
  keyId: string;
  privateKeyPem: string;
  vendorNumber?: string | null;
  appAppleId?: string | null;
};

export type StoreIntegrationPublic = {
  provider: StoreProviderId;
  displayName: string;
  platform: StorePlatform;
  store: StoreId;
  status: StoreIntegrationStatus;
  secretConfigured: boolean;
  issuerIdConfigured: boolean;
  keyIdConfigured: boolean;
  vendorNumberConfigured: boolean;
  appAppleIdConfigured: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  metadata: Record<string, unknown>;
};
