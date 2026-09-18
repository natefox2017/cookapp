/**
 * Apple App Store Connect analytics + financial providers (Issue #59).
 * When Owner keys are missing → not_configured (no fake series).
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type {
  FinancialReportProvider,
  StoreAnalyticsProvider,
} from "./provider.ts";
import { createAscJwt } from "./asc-jwt.ts";
import { resolveAppleCredentials } from "./secret-store.ts";
import type {
  DateRange,
  FinancialReportRow,
  ProviderFetchResult,
  StoreAnalyticsPoint,
} from "./types.ts";

const ASC_API = "https://api.appstoreconnect.apple.com";

export type AscHttpClient = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

function defaultHttp(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, init);
}

function monthsInRange(range: DateRange): string[] {
  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const months: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= endMonth) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

/** Parse Apple financial TSV (tab-separated). Missing numeric cells → null, never 0 invent. */
export function parseAppleFinancialTsv(
  tsv: string,
  fiscalPeriod: string,
): FinancialReportRow[] {
  const lines = tsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name.toLowerCase());

  const territoryIdx = idx("country or region") >= 0
    ? idx("country or region")
    : idx("country_code") >= 0
    ? idx("country_code")
    : idx("territory");
  const currencyIdx = idx("currency of proceeds") >= 0
    ? idx("currency of proceeds")
    : idx("customer currency") >= 0
    ? idx("customer currency")
    : idx("currency");
  const unitsIdx = idx("quantity") >= 0 ? idx("quantity") : idx("units");
  const grossIdx = idx("extended partner share") >= 0
    ? idx("extended partner share")
    : idx("partner share") >= 0
    ? idx("partner share")
    : idx("gross amount");
  const proceedsIdx = idx("developer proceeds") >= 0
    ? idx("developer proceeds")
    : idx("proceeds");
  const productIdx = idx("sku") >= 0
    ? idx("sku")
    : idx("apple identifier") >= 0
    ? idx("apple identifier")
    : idx("product");
  const exchangeIdx = idx("exchange rate");
  const taxIdx = idx("taxes");

  const rows: FinancialReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const territory = territoryIdx >= 0 ? (cols[territoryIdx]?.trim() || null) : null;
    const currency = currencyIdx >= 0 ? (cols[currencyIdx]?.trim() || null) : null;
    const productId = productIdx >= 0 ? (cols[productIdx]?.trim() || null) : null;

    const parseNum = (index: number): number | null => {
      if (index < 0) return null;
      const raw = cols[index]?.trim();
      if (raw === undefined || raw === "") return null;
      const n = Number(raw.replace(/,/g, ""));
      return Number.isFinite(n) ? n : null;
    };

    const unitsRaw = parseNum(unitsIdx);
    const units = unitsRaw === null ? null : Math.trunc(unitsRaw);
    const grossAmount = parseNum(grossIdx);
    const developerProceeds = parseNum(proceedsIdx);
    const taxes = parseNum(taxIdx);
    const exchangeRate = parseNum(exchangeIdx);

    const providerRowKey = [
      "apple_financial",
      fiscalPeriod,
      territory ?? "",
      currency ?? "",
      productId ?? "",
      String(i),
    ].join("|");

    rows.push({
      platform: "ios",
      store: "app_store",
      fiscalPeriod,
      reportDate: `${fiscalPeriod}-01`,
      territory,
      currency,
      productId,
      units,
      grossAmount,
      developerProceeds,
      taxes,
      adjustments: null,
      exchangeRate,
      reportStatus: "final",
      providerSource: "apple_financial_reports",
      providerRowKey,
      dimensions: { line: i },
    });
  }
  return rows;
}

/** Map Analytics report TSV-ish rows when Apple returns segment content. */
export function parseAppleAnalyticsDownloadRows(
  text: string,
  metricDateFallback: string,
): StoreAnalyticsPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  const col = (names: string[]) => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const dateIdx = col(["date", "day", "processing date"]);
  const territoryIdx = col(["territory", "country or region", "country"]);
  const sourceIdx = col(["source", "source type", "download source", "page type"]);
  const firstIdx = col(["first-time downloads", "first time downloads", "first_time_downloads"]);
  const reIdx = col(["redownloads", "re-downloads"]);
  const totalIdx = col(["total downloads", "downloads", "units"]);

  const points: StoreAnalyticsPoint[] = [];

  const pushMetric = (
    row: string[],
    metricKey: StoreAnalyticsPoint["metricKey"],
    valueIdx: number,
    date: string,
  ) => {
    if (valueIdx < 0) return;
    const raw = row[valueIdx]?.trim();
    // Empty / privacy → null, never coerce to 0
    if (raw === undefined || raw === "" || raw === "-" || raw.toLowerCase() === "null") {
      points.push({
        metricDate: date,
        platform: "ios",
        store: "app_store",
        territory: territoryIdx >= 0 ? (row[territoryIdx]?.trim() || null) : null,
        acquisitionSource: sourceIdx >= 0 ? (row[sourceIdx]?.trim() || null) : null,
        metricKey,
        metricValue: null,
        dataStatus: "not_returned",
        providerSource: "app_store_connect_analytics",
        estimated: true,
      });
      return;
    }
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n)) {
      points.push({
        metricDate: date,
        platform: "ios",
        store: "app_store",
        territory: territoryIdx >= 0 ? (row[territoryIdx]?.trim() || null) : null,
        acquisitionSource: sourceIdx >= 0 ? (row[sourceIdx]?.trim() || null) : null,
        metricKey,
        metricValue: null,
        dataStatus: "insufficient",
        providerSource: "app_store_connect_analytics",
        estimated: true,
      });
      return;
    }
    points.push({
      metricDate: date,
      platform: "ios",
      store: "app_store",
      territory: territoryIdx >= 0 ? (row[territoryIdx]?.trim() || null) : null,
      acquisitionSource: sourceIdx >= 0 ? (row[sourceIdx]?.trim() || null) : null,
      metricKey,
      metricValue: n,
      dataStatus: "available",
      providerSource: "app_store_connect_analytics",
      estimated: true,
    });
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delim);
    const date = dateIdx >= 0 && row[dateIdx]?.trim()
      ? row[dateIdx].trim().slice(0, 10)
      : metricDateFallback;
    pushMetric(row, "first_time_downloads", firstIdx, date);
    pushMetric(row, "redownloads", reIdx, date);
    pushMetric(row, "total_downloads", totalIdx, date);
  }
  return points;
}

export class AppleAppStoreAnalyticsProvider implements StoreAnalyticsProvider {
  readonly providerId = "apple_app_store" as const;

  constructor(
    private readonly db: SupabaseClient,
    private readonly http: AscHttpClient = defaultHttp,
  ) {}

  async getConnectionStatus() {
    const resolved = await resolveAppleCredentials(this.db);
    if (!resolved.configured) {
      return {
        configured: false,
        status: "not_configured" as const,
        detail: "ASC_ISSUER_ID / ASC_KEY_ID / ASC_PRIVATE_KEY_P8 (or Admin secret) not set",
      };
    }
    return { configured: true, status: "configured" as const, detail: resolved.source };
  }

  async fetchDailyAnalytics(
    range: DateRange,
  ): Promise<ProviderFetchResult<StoreAnalyticsPoint>> {
    const resolved = await resolveAppleCredentials(this.db);
    if (!resolved.configured || !resolved.credentials) {
      return {
        status: "not_configured",
        rows: [],
        errorCode: "not_configured",
        errorMessage: "App Store Connect API not configured",
        metadata: { provider: this.providerId },
      };
    }

    const { issuerId, keyId, privateKeyPem, appAppleId } = resolved.credentials;
    if (!appAppleId) {
      return {
        status: "not_configured",
        rows: [],
        errorCode: "not_configured",
        errorMessage: "ASC_APP_APPLE_ID (or integration app_apple_id) required for analytics",
        metadata: { missing: "app_apple_id" },
      };
    }

    try {
      const token = await createAscJwt({ issuerId, keyId, privateKeyPem });
      // Request / list analytics report requests for the app.
      const listUrl =
        `${ASC_API}/v1/apps/${encodeURIComponent(appAppleId)}/analyticsReportRequests`;
      const listRes = await this.http(listUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (listRes.status === 401 || listRes.status === 403) {
        return {
          status: "error",
          rows: [],
          errorCode: "asc_unauthorized",
          errorMessage: `ASC analytics unauthorized (${listRes.status})`,
        };
      }

      if (!listRes.ok) {
        const body = await listRes.text();
        // No ONGOING request yet — do not invent zeros; return empty with metadata.
        if (listRes.status === 404) {
          return {
            status: "ok",
            rows: [],
            metadata: {
              note: "No analytics report requests found; configure ONGOING request in ASC",
              range,
              httpStatus: listRes.status,
            },
          };
        }
        return {
          status: "error",
          rows: [],
          errorCode: "asc_analytics_http_error",
          errorMessage: `ASC analytics HTTP ${listRes.status}: ${body.slice(0, 400)}`,
        };
      }

      const payload = await listRes.json() as {
        data?: Array<{ id: string; attributes?: Record<string, unknown> }>;
      };
      const requestIds = (payload.data ?? []).map((d) => d.id).filter(Boolean);
      if (requestIds.length === 0) {
        return {
          status: "ok",
          rows: [],
          metadata: {
            note: "ASC returned no analyticsReportRequests; missing data ≠ 0",
            range,
          },
        };
      }

      // Fetch report instances for the first request; download segments when URLs present.
      const points: StoreAnalyticsPoint[] = [];
      for (const requestId of requestIds.slice(0, 3)) {
        const reportsUrl =
          `${ASC_API}/v1/analyticsReportRequests/${encodeURIComponent(requestId)}/reports`;
        const reportsRes = await this.http(reportsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!reportsRes.ok) continue;
        const reportsJson = await reportsRes.json() as {
          data?: Array<{ id: string }>;
        };
        for (const report of (reportsJson.data ?? []).slice(0, 5)) {
          const instancesUrl =
            `${ASC_API}/v1/analyticsReports/${encodeURIComponent(report.id)}/instances`;
          const instancesRes = await this.http(instancesUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          if (!instancesRes.ok) continue;
          const instancesJson = await instancesRes.json() as {
            data?: Array<{
              id: string;
              attributes?: { processingDate?: string };
            }>;
          };
          for (const instance of (instancesJson.data ?? []).slice(0, 10)) {
            const processingDate =
              instance.attributes?.processingDate?.slice(0, 10) ?? range.end;
            if (processingDate < range.start || processingDate > range.end) {
              continue;
            }
            const segmentsUrl =
              `${ASC_API}/v1/analyticsReportInstances/${encodeURIComponent(instance.id)}/segments`;
            const segmentsRes = await this.http(segmentsUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            });
            if (!segmentsRes.ok) continue;
            const segmentsJson = await segmentsRes.json() as {
              data?: Array<{
                attributes?: { url?: string };
              }>;
            };
            for (const segment of segmentsJson.data ?? []) {
              const url = segment.attributes?.url;
              if (!url) continue;
              const fileRes = await this.http(url);
              if (!fileRes.ok) continue;
              const text = await fileRes.text();
              points.push(
                ...parseAppleAnalyticsDownloadRows(text, processingDate),
              );
            }
          }
        }
      }

      return {
        status: "ok",
        rows: points,
        metadata: {
          range,
          requestCount: requestIds.length,
          points: points.length,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown_error";
      return {
        status: "error",
        rows: [],
        errorCode: "asc_analytics_exception",
        errorMessage: message,
      };
    }
  }
}

export class AppleAppStoreFinancialProvider implements FinancialReportProvider {
  readonly providerId = "apple_app_store" as const;

  constructor(
    private readonly db: SupabaseClient,
    private readonly http: AscHttpClient = defaultHttp,
  ) {}

  async getConnectionStatus() {
    const resolved = await resolveAppleCredentials(this.db);
    if (!resolved.configured) {
      return {
        configured: false,
        status: "not_configured" as const,
        detail: "App Store Connect API not configured",
      };
    }
    if (!resolved.credentials?.vendorNumber) {
      return {
        configured: false,
        status: "not_configured" as const,
        detail: "ASC_VENDOR_NUMBER required for financial reports",
      };
    }
    return { configured: true, status: "configured" as const, detail: resolved.source };
  }

  async fetchFinancialReports(
    range: DateRange,
  ): Promise<ProviderFetchResult<FinancialReportRow>> {
    const resolved = await resolveAppleCredentials(this.db);
    if (!resolved.configured || !resolved.credentials) {
      return {
        status: "not_configured",
        rows: [],
        errorCode: "not_configured",
        errorMessage: "App Store Connect API not configured",
      };
    }
    const { issuerId, keyId, privateKeyPem, vendorNumber } = resolved.credentials;
    if (!vendorNumber) {
      return {
        status: "not_configured",
        rows: [],
        errorCode: "not_configured",
        errorMessage: "ASC_VENDOR_NUMBER not configured",
      };
    }

    try {
      const token = await createAscJwt({ issuerId, keyId, privateKeyPem });
      const rows: FinancialReportRow[] = [];
      const months = monthsInRange(range);
      const errors: string[] = [];

      for (const fiscalPeriod of months) {
        // Z1 = worldwide consolidated region code commonly used for FINANCIAL reports.
        const url = new URL(`${ASC_API}/v1/financeReports`);
        url.searchParams.append("filter[vendorNumber]", vendorNumber);
        url.searchParams.append("filter[reportType]", "FINANCIAL");
        url.searchParams.append("filter[regionCode]", "Z1");
        url.searchParams.append("filter[reportDate]", fiscalPeriod);

        const res = await this.http(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/a-gzip, application/json",
          },
        });

        if (res.status === 404) {
          // No report for that fiscal month — omit rows; do not invent zeros.
          continue;
        }
        if (res.status === 401 || res.status === 403) {
          return {
            status: "error",
            rows: [],
            errorCode: "asc_unauthorized",
            errorMessage: `ASC finance unauthorized (${res.status})`,
          };
        }
        if (!res.ok) {
          const body = await res.text();
          errors.push(`${fiscalPeriod}: HTTP ${res.status} ${body.slice(0, 200)}`);
          continue;
        }

        const contentType = res.headers.get("content-type") ?? "";
        let text = "";
        if (contentType.includes("gzip") || contentType.includes("a-gzip")) {
          const buf = new Uint8Array(await res.arrayBuffer());
          try {
            const ds = new DecompressionStream("gzip");
            const stream = new Blob([buf]).stream().pipeThrough(ds);
            text = await new Response(stream).text();
          } catch {
            text = new TextDecoder().decode(buf);
          }
        } else {
          text = await res.text();
        }

        rows.push(...parseAppleFinancialTsv(text, fiscalPeriod));
      }

      if (rows.length === 0 && errors.length > 0) {
        return {
          status: "error",
          rows: [],
          errorCode: "asc_finance_http_error",
          errorMessage: errors.join("; ").slice(0, 800),
        };
      }

      return {
        status: "ok",
        rows,
        metadata: {
          months,
          rowCount: rows.length,
          skippedErrors: errors.length,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown_error";
      return {
        status: "error",
        rows: [],
        errorCode: "asc_finance_exception",
        errorMessage: message,
      };
    }
  }
}
