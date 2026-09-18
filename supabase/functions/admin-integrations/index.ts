// Admin Integrations: connection status, test probes, write-only secrets.
// Auth: custom admin bearer; Owner-only for secret writes.
// Deploy: supabase functions deploy admin-integrations --project-ref semsjyrqjnumpvanibip
// Issue: #63

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import {
  requireAdminSession,
  requireOwnerRole,
} from "../_shared/admin-session.ts";
import { log } from "../_shared/logger.ts";
import { writeAdminAudit } from "../_shared/audit.ts";
import { resolveRequestContext } from "../_shared/request-context.ts";
import {
  AISecretStore,
  encryptSecret,
  assertSecretStoreConfigured,
} from "../_shared/ai-secret-store.ts";
import {
  INTEGRATION_IDS,
  INTEGRATION_META,
  buildStatusItem,
  isIntegrationId,
  secretRefFor,
  type IntegrationId,
  type IntegrationStatusItem,
} from "../_shared/integrations-status.ts";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-integrations");
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("validation_error", "Invalid JSON body", 400);
  }
}

type HealthRow = {
  integration_id: string;
  status: string;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  last_checked_at: string | null;
  details: Record<string, unknown> | null;
};

async function loadHealthMap(
  db: ReturnType<typeof createServiceClient>,
): Promise<Map<string, HealthRow>> {
  const { data, error } = await db.from("integration_health").select("*");
  if (error) {
    throw new AppError("internal_error", error.message, 500);
  }
  const map = new Map<string, HealthRow>();
  for (const row of data ?? []) {
    map.set(row.integration_id as string, row as HealthRow);
  }
  return map;
}

async function loadConfig(
  db: ReturnType<typeof createServiceClient>,
  id: IntegrationId,
): Promise<Record<string, unknown>> {
  const { data } = await db
    .from("integration_configs")
    .select("config")
    .eq("integration_id", id)
    .maybeSingle();
  const cfg = data?.config;
  return cfg && typeof cfg === "object" ? (cfg as Record<string, unknown>) : {};
}

async function isIntegrationSecretConfigured(
  db: ReturnType<typeof createServiceClient>,
  id: IntegrationId,
): Promise<boolean> {
  const ref = secretRefFor(id);
  const { data } = await db
    .from("integration_secrets")
    .select("secret_ref")
    .eq("secret_ref", ref)
    .maybeSingle();
  return Boolean(data);
}

async function evaluateSupabase(
  db: ReturnType<typeof createServiceClient>,
  health: HealthRow | undefined,
): Promise<IntegrationStatusItem> {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const configured: string[] = [];
  if (url) configured.push("SUPABASE_URL");
  if (key) configured.push("SUPABASE_SERVICE_ROLE_KEY");

  let probeOk: boolean | null = null;
  let probeError: string | null = null;
  if (url && key) {
    const { error } = await db.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
    if (error) {
      probeOk = false;
      probeError = error.message;
    } else {
      probeOk = true;
    }
  }

  return buildStatusItem({
    id: "supabase",
    configuredKeys: configured,
    secretConfigured: Boolean(key),
    lastSuccessAt: health?.last_success_at,
    lastErrorAt: health?.last_error_at,
    lastErrorMessage: health?.last_error_message ?? probeError,
    lastCheckedAt: health?.last_checked_at,
    probeOk,
    probeError,
  });
}

async function evaluateRevenueCat(
  db: ReturnType<typeof createServiceClient>,
  health: HealthRow | undefined,
): Promise<IntegrationStatusItem> {
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
  const configured: string[] = [];
  if (webhookSecret) configured.push("REVENUECAT_WEBHOOK_SECRET");

  let probeOk: boolean | null = null;
  let probeError: string | null = null;

  if (webhookSecret) {
    // Presence of webhook secret = configured; recent events are soft signal.
    const { data, error } = await db
      .from("purchase_events")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      probeOk = false;
      probeError = error.message;
    } else if (data && data.length > 0) {
      probeOk = true;
    } else {
      // Secret set but no events yet — still connected (ready to receive).
      probeOk = true;
    }
  }

  return buildStatusItem({
    id: "revenuecat",
    configuredKeys: configured,
    secretConfigured: Boolean(webhookSecret),
    lastSuccessAt: health?.last_success_at,
    lastErrorAt: health?.last_error_at,
    lastErrorMessage: health?.last_error_message ?? probeError,
    lastCheckedAt: health?.last_checked_at,
    probeOk,
    probeError,
  });
}

async function evaluateAppStoreConnect(
  db: ReturnType<typeof createServiceClient>,
  health: HealthRow | undefined,
): Promise<IntegrationStatusItem> {
  const cfg = await loadConfig(db, "app_store_connect");
  const secretConfigured = await isIntegrationSecretConfigured(db, "app_store_connect");
  const configured: string[] = [];
  if (typeof cfg.issuerId === "string" && cfg.issuerId.trim()) {
    configured.push("issuerId");
  }
  if (typeof cfg.keyId === "string" && cfg.keyId.trim()) {
    configured.push("keyId");
  }
  if (secretConfigured) configured.push("privateKey");

  let probeOk: boolean | null = null;
  let probeError: string | null = null;
  if (configured.length === 3) {
    // Config complete; live ASC HTTP probe lands with #59 analytics sync.
    probeOk = true;
  }

  return buildStatusItem({
    id: "app_store_connect",
    configuredKeys: configured,
    secretConfigured,
    lastSuccessAt: health?.last_success_at,
    lastErrorAt: health?.last_error_at,
    lastErrorMessage: health?.last_error_message ?? probeError,
    lastCheckedAt: health?.last_checked_at,
    probeOk,
    probeError,
  });
}

async function evaluateAiGateway(
  db: ReturnType<typeof createServiceClient>,
  health: HealthRow | undefined,
): Promise<IntegrationStatusItem> {
  const secrets = new AISecretStore(db);
  const { data: providers, error } = await db
    .from("ai_providers")
    .select("id, enabled, status, secret_ref, last_health_check_at")
    .eq("enabled", true);
  if (error) {
    throw new AppError("internal_error", error.message, 500);
  }

  const configured: string[] = [];
  let secretConfigured = false;
  let anyHealthy = false;
  let anyUnhealthy = false;
  let lastSuccess: string | null = health?.last_success_at ?? null;

  for (const row of providers ?? []) {
    configured.push("enabledProvider");
    const hasSecret = await secrets.isConfigured(
      (row as Record<string, unknown>).secret_ref as string | null,
    );
    if (hasSecret) {
      secretConfigured = true;
      configured.push("providerSecret");
    }
    const st = String((row as Record<string, unknown>).status ?? "");
    if (st === "healthy") anyHealthy = true;
    if (st === "unhealthy") anyUnhealthy = true;
    const checkAt = (row as Record<string, unknown>).last_health_check_at as
      | string
      | null;
    if (checkAt && (!lastSuccess || checkAt > lastSuccess)) {
      lastSuccess = checkAt;
    }
  }

  // Dedupe configured keys
  const uniqueConfigured = [...new Set(configured)];

  let probeOk: boolean | null = null;
  let probeError: string | null = null;
  if (uniqueConfigured.includes("enabledProvider") && secretConfigured) {
    if (anyUnhealthy && !anyHealthy) {
      probeOk = false;
      probeError = "All enabled AI providers report unhealthy";
    } else {
      probeOk = true;
    }
  }

  return buildStatusItem({
    id: "ai_gateway",
    configuredKeys: uniqueConfigured,
    secretConfigured,
    lastSuccessAt: lastSuccess,
    lastErrorAt: health?.last_error_at,
    lastErrorMessage: health?.last_error_message ?? probeError,
    lastCheckedAt: health?.last_checked_at,
    probeOk,
    probeError,
  });
}

function evaluateGooglePlay(
  health: HealthRow | undefined,
): IntegrationStatusItem {
  return buildStatusItem({
    id: "google_play",
    configuredKeys: [],
    secretConfigured: false,
    lastSuccessAt: null,
    lastErrorAt: health?.last_error_at ?? null,
    lastErrorMessage: null,
    lastCheckedAt: health?.last_checked_at ?? null,
    statusOverride: "future_reserved",
  });
}

async function evaluateOne(
  db: ReturnType<typeof createServiceClient>,
  id: IntegrationId,
  healthMap: Map<string, HealthRow>,
): Promise<IntegrationStatusItem> {
  const health = healthMap.get(id);
  switch (id) {
    case "supabase":
      return evaluateSupabase(db, health);
    case "revenuecat":
      return evaluateRevenueCat(db, health);
    case "app_store_connect":
      return evaluateAppStoreConnect(db, health);
    case "ai_gateway":
      return evaluateAiGateway(db, health);
    case "google_play":
      return evaluateGooglePlay(health);
  }
}

async function persistHealth(
  db: ReturnType<typeof createServiceClient>,
  item: IntegrationStatusItem,
  details: Record<string, unknown> = {},
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from("integration_health").upsert(
    {
      integration_id: item.id,
      status: item.status,
      last_success_at: item.lastSuccessAt,
      last_error_at: item.lastErrorAt,
      last_error_message: item.lastErrorMessage,
      last_checked_at: now,
      details,
      updated_at: now,
    },
    { onConflict: "integration_id" },
  );
  if (error) {
    log("warn", "integration_health_persist_failed", {
      id: item.id,
      message: error.message,
    });
  }
}

async function runTest(
  db: ReturnType<typeof createServiceClient>,
  id: IntegrationId,
): Promise<{ item: IntegrationStatusItem; ok: boolean; message: string }> {
  if (id === "google_play") {
    throw new AppError(
      "validation_error",
      "Google Play is Future Reserved — test connection is not available",
      400,
    );
  }

  const healthMap = await loadHealthMap(db);
  let item = await evaluateOne(db, id, healthMap);
  const now = new Date().toISOString();

  if (item.status === "not_configured") {
    item = {
      ...item,
      lastCheckedAt: now,
      lastErrorAt: now,
      lastErrorMessage: "Integration is not fully configured",
    };
    await persistHealth(db, item, { probe: "skipped_not_configured" });
    return {
      item,
      ok: false,
      message: "Not configured — complete required settings before testing",
    };
  }

  // Re-run live probe for testable integrations
  if (id === "supabase") {
    const { error } = await db.from("profiles").select("id", {
      head: true,
      count: "exact",
    }).limit(1);
    if (error) {
      item = {
        ...item,
        status: "degraded",
        lastErrorAt: now,
        lastErrorMessage: error.message,
        lastCheckedAt: now,
      };
      await persistHealth(db, item, { probe: "fail" });
      return { item, ok: false, message: error.message };
    }
    item = {
      ...item,
      status: "connected",
      lastSuccessAt: now,
      lastErrorMessage: null,
      lastCheckedAt: now,
    };
    await persistHealth(db, item, { probe: "ok" });
    return { item, ok: true, message: "Supabase service role query succeeded" };
  }

  if (id === "revenuecat") {
    const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
    if (!secret) {
      item = {
        ...item,
        status: "not_configured",
        lastErrorAt: now,
        lastErrorMessage: "REVENUECAT_WEBHOOK_SECRET not set",
        lastCheckedAt: now,
      };
      await persistHealth(db, item, { probe: "missing_env" });
      return { item, ok: false, message: "Webhook secret not configured in Edge env" };
    }
    item = {
      ...item,
      status: "connected",
      lastSuccessAt: now,
      lastErrorMessage: null,
      lastCheckedAt: now,
    };
    await persistHealth(db, item, { probe: "env_ok" });
    return {
      item,
      ok: true,
      message: "RevenueCat webhook secret is configured (env); plaintext never returned",
    };
  }

  if (id === "app_store_connect") {
    const secretOk = await isIntegrationSecretConfigured(db, id);
    const cfg = await loadConfig(db, id);
    if (
      !secretOk ||
      typeof cfg.issuerId !== "string" ||
      !cfg.issuerId.trim() ||
      typeof cfg.keyId !== "string" ||
      !cfg.keyId.trim()
    ) {
      item = {
        ...item,
        status: "not_configured",
        lastErrorAt: now,
        lastErrorMessage: "ASC issuerId / keyId / privateKey incomplete",
        lastCheckedAt: now,
      };
      await persistHealth(db, item, { probe: "incomplete" });
      return { item, ok: false, message: "App Store Connect config incomplete" };
    }
    // Decrypt check only — proves secret store works without returning key.
    const ref = secretRefFor(id);
    const { data, error } = await db
      .from("integration_secrets")
      .select("ciphertext, nonce")
      .eq("secret_ref", ref)
      .maybeSingle();
    if (error || !data) {
      item = {
        ...item,
        status: "degraded",
        lastErrorAt: now,
        lastErrorMessage: error?.message ?? "Secret row missing",
        lastCheckedAt: now,
      };
      await persistHealth(db, item, { probe: "secret_missing" });
      return { item, ok: false, message: "ASC private key not readable from secret store" };
    }
    try {
      const { decryptSecret } = await import("../_shared/ai-secret-store.ts");
      const plain = await decryptSecret(
        data.ciphertext as string,
        data.nonce as string,
      );
      if (!plain.trim()) throw new Error("empty key");
      // Discard plaintext immediately — do not log or return.
    } catch (err) {
      const message = err instanceof Error ? err.message : "decrypt_failed";
      item = {
        ...item,
        status: "degraded",
        lastErrorAt: now,
        lastErrorMessage: message,
        lastCheckedAt: now,
      };
      await persistHealth(db, item, { probe: "decrypt_fail" });
      return { item, ok: false, message: "Failed to decrypt ASC private key" };
    }
    item = {
      ...item,
      status: "connected",
      lastSuccessAt: now,
      lastErrorMessage: null,
      lastCheckedAt: now,
    };
    await persistHealth(db, item, { probe: "secret_ok" });
    return {
      item,
      ok: true,
      message:
        "ASC credentials present and decryptable. Live Analytics API probe arrives with #59.",
    };
  }

  if (id === "ai_gateway") {
    const { data: providers } = await db
      .from("ai_providers")
      .select("id, name, enabled, status, secret_ref")
      .eq("enabled", true)
      .limit(5);
    const secrets = new AISecretStore(db);
    let found = false;
    for (const p of providers ?? []) {
      const ok = await secrets.isConfigured(p.secret_ref as string | null);
      if (ok) {
        found = true;
        break;
      }
    }
    if (!found) {
      item = {
        ...item,
        status: "not_configured",
        lastErrorAt: now,
        lastErrorMessage: "No enabled AI provider with secret",
        lastCheckedAt: now,
      };
      await persistHealth(db, item, { probe: "no_provider" });
      return {
        item,
        ok: false,
        message:
          "Configure a provider + secret under Settings → AI Platform, then retest",
      };
    }
    item = {
      ...item,
      status: "connected",
      lastSuccessAt: now,
      lastErrorMessage: null,
      lastCheckedAt: now,
    };
    await persistHealth(db, item, { probe: "provider_ok" });
    return {
      item,
      ok: true,
      message:
        "AI Gateway has at least one enabled provider with a configured secret",
    };
  }

  throw new AppError("validation_error", `Unsupported integration: ${id}`, 400);
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  const ctx = resolveRequestContext(req);

  try {
    const session = await requireAdminSession(req);
    const parts = routeParts(req);
    const method = req.method.toUpperCase();
    const db = createServiceClient();

    // GET /admin-integrations — list all
    if (method === "GET" && parts.length === 0) {
      const healthMap = await loadHealthMap(db);
      const items: IntegrationStatusItem[] = [];
      for (const id of INTEGRATION_IDS) {
        items.push(await evaluateOne(db, id, healthMap));
      }
      return json(
        {
          integrations: items,
          checkedAt: new Date().toISOString(),
        },
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    const idRaw = (parts[0] ?? "").toLowerCase();
    if (!isIntegrationId(idRaw)) {
      throw new AppError("not_found", `Unknown integration: ${idRaw}`, 404);
    }
    const id = idRaw;
    const action = (parts[1] ?? "").toLowerCase();

    // GET /admin-integrations/{id}
    if (method === "GET" && !action) {
      const healthMap = await loadHealthMap(db);
      const item = await evaluateOne(db, id, healthMap);
      return json(item, 200, publicCorsHeaders, ctx);
    }

    // POST /admin-integrations/{id}/test
    if (method === "POST" && action === "test") {
      if (!INTEGRATION_META[id].testSupported) {
        throw new AppError(
          "validation_error",
          "Test connection is not supported for this integration",
          400,
        );
      }
      const result = await runTest(db, id);
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "integration.test",
        objectType: "integration",
        objectId: id,
        after: {
          status: result.item.status,
          ok: result.ok,
          // never include secrets
        },
        ctx,
        req,
      });
      return json(
        {
          ok: result.ok,
          message: result.message,
          integration: result.item,
        },
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    // PUT /admin-integrations/{id}/secret — write-only (Owner)
    if (method === "PUT" && action === "secret") {
      requireOwnerRole(session.role);
      if (!INTEGRATION_META[id].secretWriteSupported) {
        throw new AppError(
          "validation_error",
          "Secret write is not supported for this integration (use env secrets or AI Platform)",
          400,
        );
      }
      assertSecretStoreConfigured();
      const body = await readJson(req);
      const apiKey = String(body.apiKey ?? body.privateKey ?? body.secret ?? "")
        .trim();
      if (!apiKey) {
        throw new AppError("validation_error", "Secret value is required", 400);
      }

      // Optional non-secret config fields (ASC)
      const issuerId =
        typeof body.issuerId === "string" ? body.issuerId.trim() : undefined;
      const keyId =
        typeof body.keyId === "string" ? body.keyId.trim() : undefined;
      if (issuerId !== undefined || keyId !== undefined) {
        const existing = await loadConfig(db, id);
        const next = {
          ...existing,
          ...(issuerId !== undefined ? { issuerId } : {}),
          ...(keyId !== undefined ? { keyId } : {}),
        };
        const { error: cfgErr } = await db.from("integration_configs").upsert(
          {
            integration_id: id,
            config: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "integration_id" },
        );
        if (cfgErr) {
          throw new AppError("internal_error", cfgErr.message, 500);
        }
      }

      const ref = secretRefFor(id);
      const sealed = await encryptSecret(apiKey);
      const now = new Date().toISOString();
      const { error } = await db.from("integration_secrets").upsert(
        {
          secret_ref: ref,
          integration_id: id,
          ciphertext: sealed.ciphertext,
          nonce: sealed.nonce,
          key_version: sealed.keyVersion,
          updated_at: now,
        },
        { onConflict: "secret_ref" },
      );
      if (error) {
        throw new AppError("internal_error", error.message, 500);
      }

      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "integration.config_update",
        objectType: "integration",
        objectId: id,
        after: {
          secretConfigured: true,
          issuerIdUpdated: issuerId !== undefined,
          keyIdUpdated: keyId !== undefined,
        },
        ctx,
        req,
      });

      log("info", "integration_secret_updated", { id }, ctx);

      const healthMap = await loadHealthMap(db);
      const item = await evaluateOne(db, id, healthMap);
      return json(
        {
          ok: true,
          secretConfigured: true,
          integration: item,
        },
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    // PUT /admin-integrations/{id}/config — non-secret fields (Owner)
    if (method === "PUT" && action === "config") {
      requireOwnerRole(session.role);
      if (id === "google_play") {
        throw new AppError(
          "validation_error",
          "Google Play is Future Reserved",
          400,
        );
      }
      if (id !== "app_store_connect") {
        throw new AppError(
          "validation_error",
          "Config updates are only supported for App Store Connect in this release",
          400,
        );
      }
      const body = await readJson(req);
      const existing = await loadConfig(db, id);
      const next = { ...existing };
      if (typeof body.issuerId === "string") {
        next.issuerId = body.issuerId.trim();
      }
      if (typeof body.keyId === "string") {
        next.keyId = body.keyId.trim();
      }
      const { error } = await db.from("integration_configs").upsert(
        {
          integration_id: id,
          config: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "integration_id" },
      );
      if (error) throw new AppError("internal_error", error.message, 500);

      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "integration.config_update",
        objectType: "integration",
        objectId: id,
        before: existing,
        after: next,
        ctx,
        req,
      });

      const healthMap = await loadHealthMap(db);
      const item = await evaluateOne(db, id, healthMap);
      return json({ ok: true, integration: item }, 200, publicCorsHeaders, ctx);
    }

    throw new AppError("not_found", "Unknown admin-integrations route", 404);
  } catch (err) {
    return errorResponse(err, publicCorsHeaders, ctx);
  }
});
