// Admin Store Analytics + Financial sync APIs (Issue #59).
// Auth: custom admin bearer; Owner-only for credentials + manual sync triggers.
// Paths under /functions/v1/admin-store-sync/*
// Deploy: supabase functions deploy admin-store-sync --project-ref semsjyrqjnumpvanibip

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import {
  requireAdminSession,
  requireOwnerRole,
} from "../_shared/admin-session.ts";
import { writeAdminAudit } from "../_shared/audit.ts";
import { log } from "../_shared/logger.ts";
import {
  resolveRequestContext,
  requestIdHeaders,
} from "../_shared/request-context.ts";
import {
  newStoreSecretRef,
  resolveAppleCredentials,
  runAnalyticsSync,
  runFinancialSync,
  StoreSecretStore,
} from "../_shared/store-analytics/mod.ts";
import type { StoreProviderId } from "../_shared/store-analytics/types.ts";

function pathAfterFunction(url: URL): string {
  const marker = "/admin-store-sync";
  const idx = url.pathname.indexOf(marker);
  const rest = idx >= 0 ? url.pathname.slice(idx + marker.length) : url.pathname;
  return rest.replace(/\/+$/, "") || "/";
}

function parseProvider(raw: unknown): StoreProviderId {
  if (raw === "google_play" || raw === "apple_app_store") return raw;
  throw new AppError(
    "validation_error",
    "provider must be apple_app_store or google_play",
    400,
  );
}

function parseRange(body: Record<string, unknown> | null, search: URLSearchParams) {
  const start = String(body?.start ?? search.get("start") ?? "").trim();
  const end = String(body?.end ?? search.get("end") ?? "").trim();
  if (start && end) return { start, end };
  return undefined;
}

async function listIntegrations(admin: ReturnType<typeof createServiceClient>) {
  const { data, error } = await admin
    .from("store_integrations")
    .select(
      "provider, display_name, platform, store, status, issuer_id, key_id, vendor_number, app_apple_id, secret_ref, last_success_at, last_error_at, last_error, metadata",
    )
    .order("provider");
  if (error) {
    throw new AppError("internal_error", "Failed to list integrations", 500, {
      message: error.message,
    });
  }

  const store = new StoreSecretStore(admin);
  const envResolved = await resolveAppleCredentials(admin);

  const out = [];
  for (const row of data ?? []) {
    const secretConfigured =
      (await store.isConfigured(row.secret_ref as string | null)) ||
      (row.provider === "apple_app_store" && envResolved.source === "env");
    out.push({
      provider: row.provider,
      displayName: row.display_name,
      platform: row.platform,
      store: row.store,
      status: row.status,
      secretConfigured,
      issuerIdConfigured: Boolean(row.issuer_id) ||
        (row.provider === "apple_app_store" && Boolean(Deno.env.get("ASC_ISSUER_ID"))),
      keyIdConfigured: Boolean(row.key_id) ||
        (row.provider === "apple_app_store" && Boolean(Deno.env.get("ASC_KEY_ID"))),
      vendorNumberConfigured: Boolean(row.vendor_number) ||
        (row.provider === "apple_app_store" &&
          Boolean(Deno.env.get("ASC_VENDOR_NUMBER"))),
      appAppleIdConfigured: Boolean(row.app_apple_id) ||
        (row.provider === "apple_app_store" &&
          Boolean(Deno.env.get("ASC_APP_APPLE_ID"))),
      lastSuccessAt: row.last_success_at,
      lastErrorAt: row.last_error_at,
      lastError: row.last_error,
      metadata: row.metadata ?? {},
    });
  }
  return out;
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
    const session = await requireAdminSession(req);
    const admin = createServiceClient();
    const url = new URL(req.url);
    const path = pathAfterFunction(url);
    const method = req.method.toUpperCase();

    // GET /status — integration connection status (no secrets)
    if (method === "GET" && path === "/status") {
      const integrations = await listIntegrations(admin);
      return json({ integrations }, 200, headers, ctx);
    }

    // GET /runs — list store_sync_runs
    if (method === "GET" && path === "/runs") {
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
        200,
      );
      const provider = url.searchParams.get("provider");
      const jobType = url.searchParams.get("jobType");
      let q = admin
        .from("store_sync_runs")
        .select(
          "id, job_type, provider, status, triggered_by, started_at, completed_at, rows_upserted, error_code, error_message, range_start, range_end, request_id, correlation_id, metadata",
        )
        .order("started_at", { ascending: false })
        .limit(limit);
      if (provider) q = q.eq("provider", provider);
      if (jobType) q = q.eq("job_type", jobType);
      const { data, error } = await q;
      if (error) {
        throw new AppError("internal_error", "Failed to list sync runs", 500, {
          message: error.message,
        });
      }
      return json({
        data: (data ?? []).map((r) => ({
          id: r.id,
          jobType: r.job_type,
          provider: r.provider,
          status: r.status,
          triggeredBy: r.triggered_by,
          startedAt: r.started_at,
          completedAt: r.completed_at,
          rowsUpserted: r.rows_upserted,
          errorCode: r.error_code,
          errorMessage: r.error_message,
          rangeStart: r.range_start,
          rangeEnd: r.range_end,
          requestId: r.request_id,
          correlationId: r.correlation_id,
          metadata: r.metadata,
        })),
      }, 200, headers, ctx);
    }

    // GET /analytics/daily
    if (method === "GET" && path === "/analytics/daily") {
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");
      const platform = url.searchParams.get("platform");
      const store = url.searchParams.get("store");
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit") ?? 500), 1),
        2000,
      );
      let q = admin
        .from("store_analytics_daily")
        .select(
          "id, metric_date, platform, store, territory, acquisition_source, metric_key, metric_value, data_status, provider_source, estimated, sync_run_id, synced_at",
        )
        .order("metric_date", { ascending: false })
        .limit(limit);
      if (start) q = q.gte("metric_date", start);
      if (end) q = q.lte("metric_date", end);
      if (platform) q = q.eq("platform", platform);
      if (store) q = q.eq("store", store);
      const { data, error } = await q;
      if (error) {
        throw new AppError("internal_error", "Failed to query analytics", 500, {
          message: error.message,
        });
      }
      return json({
        data: (data ?? []).map((r) => ({
          id: r.id,
          metricDate: r.metric_date,
          platform: r.platform,
          store: r.store,
          territory: r.territory || null,
          acquisitionSource: r.acquisition_source || null,
          metricKey: r.metric_key,
          // Preserve null — clients must not treat missing as 0
          metricValue: r.metric_value,
          dataStatus: r.data_status,
          providerSource: r.provider_source,
          estimated: r.estimated,
          syncRunId: r.sync_run_id,
          syncedAt: r.synced_at,
        })),
        note:
          "metricValue may be null when Apple omitted data (privacy / insufficient). Do not coerce to 0.",
      }, 200, headers, ctx);
    }

    // GET /financial/rows
    if (method === "GET" && path === "/financial/rows") {
      const fiscalPeriod = url.searchParams.get("fiscalPeriod");
      const store = url.searchParams.get("store");
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit") ?? 500), 1),
        2000,
      );
      let q = admin
        .from("financial_report_rows")
        .select(
          "id, platform, store, fiscal_period, report_date, territory, currency, product_id, units, gross_amount, developer_proceeds, taxes, adjustments, exchange_rate, report_status, provider_source, provider_row_key, sync_run_id, synced_at",
        )
        .order("fiscal_period", { ascending: false })
        .limit(limit);
      if (fiscalPeriod) q = q.eq("fiscal_period", fiscalPeriod);
      if (store) q = q.eq("store", store);
      const { data, error } = await q;
      if (error) {
        throw new AppError("internal_error", "Failed to query financial rows", 500, {
          message: error.message,
        });
      }
      return json({
        data: (data ?? []).map((r) => ({
          id: r.id,
          platform: r.platform,
          store: r.store,
          fiscalPeriod: r.fiscal_period,
          reportDate: r.report_date,
          territory: r.territory,
          currency: r.currency,
          productId: r.product_id,
          units: r.units,
          grossAmount: r.gross_amount,
          developerProceeds: r.developer_proceeds,
          taxes: r.taxes,
          adjustments: r.adjustments,
          exchangeRate: r.exchange_rate,
          reportStatus: r.report_status,
          providerSource: r.provider_source,
          providerRowKey: r.provider_row_key,
          syncRunId: r.sync_run_id,
          syncedAt: r.synced_at,
        })),
        note:
          "Financial rows are separate from store_analytics_daily. Do not merge into one final revenue field.",
      }, 200, headers, ctx);
    }

    // POST /analytics/sync — Owner
    if (method === "POST" && path === "/analytics/sync") {
      requireOwnerRole(session.role);
      const body = req.headers.get("content-type")?.includes("application/json")
        ? await req.json().catch(() => ({})) as Record<string, unknown>
        : {};
      const provider = parseProvider(body.provider ?? "apple_app_store");
      const range = parseRange(body, url.searchParams);
      const result = await runAnalyticsSync(admin, {
        provider,
        range,
        triggeredBy: "manual",
        actorAdminId: session.adminId,
        ctx,
      });
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "store_analytics.sync",
        objectType: "store_sync_run",
        objectId: result.runId,
        after: {
          provider: result.provider,
          status: result.status,
          rowsUpserted: result.rowsUpserted,
        },
        ctx,
        req,
      });
      log("info", "store_analytics_sync", { ...result }, ctx);
      return json(result, 200, headers, ctx);
    }

    // POST /financial/sync — Owner
    if (method === "POST" && path === "/financial/sync") {
      requireOwnerRole(session.role);
      const body = req.headers.get("content-type")?.includes("application/json")
        ? await req.json().catch(() => ({})) as Record<string, unknown>
        : {};
      const provider = parseProvider(body.provider ?? "apple_app_store");
      const range = parseRange(body, url.searchParams);
      const result = await runFinancialSync(admin, {
        provider,
        range,
        triggeredBy: "manual",
        actorAdminId: session.adminId,
        ctx,
      });
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "financial_report.sync",
        objectType: "store_sync_run",
        objectId: result.runId,
        after: {
          provider: result.provider,
          status: result.status,
          rowsUpserted: result.rowsUpserted,
        },
        ctx,
        req,
      });
      log("info", "financial_report_sync", { ...result }, ctx);
      return json(result, 200, headers, ctx);
    }

    // PUT /integrations/apple_app_store/credentials — Owner write-only
    if (
      method === "PUT" &&
      path === "/integrations/apple_app_store/credentials"
    ) {
      requireOwnerRole(session.role);
      const body = await req.json() as Record<string, unknown>;
      const issuerId = String(body.issuerId ?? "").trim();
      const keyId = String(body.keyId ?? "").trim();
      const privateKeyPem = String(body.privateKeyPem ?? "").trim();
      const vendorNumber = body.vendorNumber != null
        ? String(body.vendorNumber).trim()
        : null;
      const appAppleId = body.appAppleId != null
        ? String(body.appAppleId).trim()
        : null;

      if (!issuerId || !keyId || !privateKeyPem) {
        throw new AppError(
          "validation_error",
          "issuerId, keyId, and privateKeyPem are required",
          400,
        );
      }

      const secretRef = newStoreSecretRef("apple_app_store");
      const secrets = new StoreSecretStore(admin);
      await secrets.put(secretRef, privateKeyPem);

      const now = new Date().toISOString();
      const { error } = await admin
        .from("store_integrations")
        .update({
          issuer_id: issuerId,
          key_id: keyId,
          vendor_number: vendorNumber,
          app_apple_id: appAppleId,
          secret_ref: secretRef,
          status: "configured",
          last_error: null,
          updated_at: now,
        })
        .eq("provider", "apple_app_store");
      if (error) {
        throw new AppError("internal_error", "Failed to update integration", 500, {
          message: error.message,
        });
      }

      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "store_integration.credentials_set",
        objectType: "store_integration",
        objectId: "apple_app_store",
        after: {
          issuerIdConfigured: true,
          keyIdConfigured: true,
          secretConfigured: true,
          vendorNumberConfigured: Boolean(vendorNumber),
          appAppleIdConfigured: Boolean(appAppleId),
        },
        ctx,
        req,
      });

      return json({
        provider: "apple_app_store",
        status: "configured",
        secretConfigured: true,
      }, 200, headers, ctx);
    }

    throw new AppError("not_found", `Unknown path: ${path}`, 404);
  } catch (err) {
    return errorResponse(err, headers, ctx);
  }
});
