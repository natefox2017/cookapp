/**
 * Integrations health / status probes (Issue #60).
 * Not Configured is allowed. Fake "Operational" is forbidden.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type {
  IntegrationKey,
  IntegrationStatus,
} from "./types.ts";

export type IntegrationProbeResult = {
  key: IntegrationKey;
  label: string;
  status: IntegrationStatus;
  configComplete: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  checkedAt: string;
  details: Record<string, unknown>;
};

function envPresent(name: string): boolean {
  const v = Deno.env.get(name);
  return Boolean(v && v.trim().length > 0);
}

async function latestPurchaseEventAt(
  db: SupabaseClient,
): Promise<string | null> {
  const { data } = await db
    .from("purchase_events")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? String(data.created_at) : null;
}

async function latestSuccessfulJobAt(
  db: SupabaseClient,
  jobType: string,
): Promise<string | null> {
  const { data } = await db
    .from("operational_jobs")
    .select("completed_at")
    .eq("job_type", jobType)
    .eq("status", "succeeded")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.completed_at ? String(data.completed_at) : null;
}

async function latestFailedJob(
  db: SupabaseClient,
  jobType: string,
): Promise<{ at: string | null; code: string | null; message: string | null }> {
  const { data } = await db
    .from("operational_jobs")
    .select("completed_at, error_code, error_message")
    .eq("job_type", jobType)
    .eq("status", "failed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { at: null, code: null, message: null };
  return {
    at: data.completed_at ? String(data.completed_at) : null,
    code: data.error_code ? String(data.error_code) : null,
    message: data.error_message ? String(data.error_message) : null,
  };
}

export async function probeSupabase(
  db: SupabaseClient,
): Promise<IntegrationProbeResult> {
  const checkedAt = new Date().toISOString();
  const urlOk = envPresent("SUPABASE_URL") || envPresent("COOKAPP_SUPABASE_URL");
  const serviceOk = envPresent("SUPABASE_SERVICE_ROLE_KEY");
  const configComplete = urlOk && serviceOk;

  if (!configComplete) {
    return {
      key: "supabase",
      label: "Supabase",
      status: "not_configured",
      configComplete: false,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      checkedAt,
      details: { urlConfigured: urlOk, serviceRoleConfigured: serviceOk },
    };
  }

  const { error } = await db.from("profiles").select("id", {
    count: "exact",
    head: true,
  });

  if (error) {
    return {
      key: "supabase",
      label: "Supabase",
      status: "degraded",
      configComplete: true,
      lastSuccessAt: null,
      lastErrorAt: checkedAt,
      lastErrorCode: "probe_failed",
      lastErrorMessage: error.message,
      checkedAt,
      details: { urlConfigured: true, serviceRoleConfigured: true },
    };
  }

  return {
    key: "supabase",
    label: "Supabase",
    status: "connected",
    configComplete: true,
    lastSuccessAt: checkedAt,
    lastErrorAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checkedAt,
    details: { urlConfigured: true, serviceRoleConfigured: true },
  };
}

export async function probeRevenueCat(
  db: SupabaseClient,
): Promise<IntegrationProbeResult> {
  const checkedAt = new Date().toISOString();
  const secretOk = envPresent("REVENUECAT_WEBHOOK_SECRET");
  const lastEvent = await latestPurchaseEventAt(db);
  const failed = await latestFailedJob(db, "revenuecat_health_check");

  if (!secretOk) {
    return {
      key: "revenuecat",
      label: "RevenueCat",
      status: "not_configured",
      configComplete: false,
      lastSuccessAt: lastEvent,
      lastErrorAt: failed.at,
      lastErrorCode: failed.code,
      lastErrorMessage: failed.message,
      checkedAt,
      details: {
        webhookSecretConfigured: false,
        lastPurchaseEventAt: lastEvent,
        note: "Webhook secret missing — Not Configured (not Operational)",
      },
    };
  }

  // Secret present + recent events ⇒ connected. No events yet ⇒ unknown (not fake healthy).
  if (lastEvent) {
    return {
      key: "revenuecat",
      label: "RevenueCat",
      status: "connected",
      configComplete: true,
      lastSuccessAt: lastEvent,
      lastErrorAt: failed.at,
      lastErrorCode: failed.code,
      lastErrorMessage: failed.message,
      checkedAt,
      details: {
        webhookSecretConfigured: true,
        lastPurchaseEventAt: lastEvent,
      },
    };
  }

  return {
    key: "revenuecat",
    label: "RevenueCat",
    status: "unknown",
    configComplete: true,
    lastSuccessAt: null,
    lastErrorAt: failed.at,
    lastErrorCode: failed.code,
    lastErrorMessage: failed.message,
    checkedAt,
    details: {
      webhookSecretConfigured: true,
      lastPurchaseEventAt: null,
      note: "Configured but no purchase_events yet — status unknown, not Operational",
    },
  };
}

export async function probeAppStoreConnect(
  db: SupabaseClient,
): Promise<IntegrationProbeResult> {
  const checkedAt = new Date().toISOString();

  // Prefer #59 store_integrations row when present.
  const { data: integration } = await db
    .from("store_integrations")
    .select(
      "status, issuer_id, key_id, secret_ref, last_success_at, last_error_at, last_error, vendor_number, app_apple_id",
    )
    .eq("provider", "apple_app_store")
    .maybeSingle();

  const keyId = Boolean(integration?.key_id) ||
    envPresent("ASC_KEY_ID") ||
    envPresent("APP_STORE_CONNECT_KEY_ID");
  const issuer = Boolean(integration?.issuer_id) ||
    envPresent("ASC_ISSUER_ID") ||
    envPresent("APP_STORE_CONNECT_ISSUER_ID");
  const privateKey = Boolean(integration?.secret_ref) ||
    envPresent("ASC_PRIVATE_KEY") ||
    envPresent("ASC_PRIVATE_KEY_P8") ||
    envPresent("APP_STORE_CONNECT_PRIVATE_KEY");
  const configComplete = keyId && issuer && privateKey;

  const lastSync =
    (await latestSuccessfulJobAt(db, "store_analytics_sync")) ??
    (await latestSuccessfulJobAt(db, "asc_analytics_sync")) ??
    (integration?.last_success_at
      ? String(integration.last_success_at)
      : null);
  const failed = await latestFailedJob(db, "store_analytics_sync");

  if (integration?.status === "future_reserved") {
    return {
      key: "app_store_connect",
      label: "App Store Connect",
      status: "future_reserved",
      configComplete: false,
      lastSuccessAt: lastSync,
      lastErrorAt: failed.at,
      lastErrorCode: failed.code,
      lastErrorMessage: failed.message,
      checkedAt,
      details: { note: "Unexpected future_reserved on Apple integration" },
    };
  }

  if (!configComplete || integration?.status === "not_configured") {
    return {
      key: "app_store_connect",
      label: "App Store Connect",
      status: "not_configured",
      configComplete: false,
      lastSuccessAt: lastSync,
      lastErrorAt: integration?.last_error_at
        ? String(integration.last_error_at)
        : failed.at,
      lastErrorCode: failed.code,
      lastErrorMessage: integration?.last_error
        ? String(integration.last_error)
        : failed.message,
      checkedAt,
      details: {
        keyIdConfigured: keyId,
        issuerConfigured: issuer,
        privateKeyConfigured: privateKey,
        storeIntegrationsStatus: integration?.status ?? "missing_row",
        note: "ASC Not Configured — no fake analytics series",
      },
    };
  }

  if (
    integration?.status === "degraded" ||
    integration?.status === "error" ||
    (failed.at && (!lastSync || Date.parse(failed.at) > Date.parse(lastSync)))
  ) {
    return {
      key: "app_store_connect",
      label: "App Store Connect",
      status: "degraded",
      configComplete: true,
      lastSuccessAt: lastSync,
      lastErrorAt: integration?.last_error_at
        ? String(integration.last_error_at)
        : failed.at,
      lastErrorCode: failed.code,
      lastErrorMessage: integration?.last_error
        ? String(integration.last_error)
        : failed.message,
      checkedAt,
      details: { keysConfigured: true, storeIntegrationsStatus: integration?.status },
    };
  }

  if (lastSync || integration?.status === "configured") {
    return {
      key: "app_store_connect",
      label: "App Store Connect",
      status: lastSync ? "connected" : "unknown",
      configComplete: true,
      lastSuccessAt: lastSync,
      lastErrorAt: failed.at,
      lastErrorCode: failed.code,
      lastErrorMessage: failed.message,
      checkedAt,
      details: {
        keysConfigured: true,
        storeIntegrationsStatus: integration?.status ?? null,
      },
    };
  }

  return {
    key: "app_store_connect",
    label: "App Store Connect",
    status: "unknown",
    configComplete: true,
    lastSuccessAt: null,
    lastErrorAt: failed.at,
    lastErrorCode: failed.code,
    lastErrorMessage: failed.message,
    checkedAt,
    details: {
      keysConfigured: true,
      note: "Keys present but no successful sync yet",
    },
  };
}

export async function probeAiGateway(
  db: SupabaseClient,
): Promise<IntegrationProbeResult> {
  const checkedAt = new Date().toISOString();
  const masterKey = envPresent("COOKAPP_AI_MASTER_KEY");
  const { data: providers, error } = await db
    .from("ai_providers")
    .select("id, enabled, status, secret_ref, last_health_check_at")
    .eq("enabled", true);

  if (error) {
    return {
      key: "ai_gateway",
      label: "AI Gateway",
      status: masterKey ? "degraded" : "not_configured",
      configComplete: false,
      lastSuccessAt: null,
      lastErrorAt: checkedAt,
      lastErrorCode: "probe_failed",
      lastErrorMessage: error.message,
      checkedAt,
      details: { masterKeyConfigured: masterKey },
    };
  }

  const list = providers ?? [];
  const withSecret = list.filter((p) => Boolean(p.secret_ref));
  const configComplete = masterKey && withSecret.length > 0;

  if (!configComplete) {
    return {
      key: "ai_gateway",
      label: "AI Gateway",
      status: "not_configured",
      configComplete: false,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      checkedAt,
      details: {
        masterKeyConfigured: masterKey,
        enabledProviders: list.length,
        providersWithSecret: withSecret.length,
      },
    };
  }

  const healthy = list.filter((p) => p.status === "healthy");
  const unhealthy = list.filter((p) =>
    p.status === "unhealthy" || p.status === "degraded"
  );
  const lastHealth = list
    .map((p) => p.last_health_check_at as string | null)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  if (unhealthy.length > 0 && healthy.length === 0) {
    return {
      key: "ai_gateway",
      label: "AI Gateway",
      status: "degraded",
      configComplete: true,
      lastSuccessAt: lastHealth,
      lastErrorAt: checkedAt,
      lastErrorCode: "provider_unhealthy",
      lastErrorMessage: `${unhealthy.length} provider(s) unhealthy/degraded`,
      checkedAt,
      details: {
        enabledProviders: list.length,
        healthy: healthy.length,
        unhealthy: unhealthy.length,
      },
    };
  }

  if (healthy.length > 0) {
    return {
      key: "ai_gateway",
      label: "AI Gateway",
      status: "connected",
      configComplete: true,
      lastSuccessAt: lastHealth,
      lastErrorAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      checkedAt,
      details: {
        enabledProviders: list.length,
        healthy: healthy.length,
        unknown: list.length - healthy.length - unhealthy.length,
      },
    };
  }

  return {
    key: "ai_gateway",
    label: "AI Gateway",
    status: "unknown",
    configComplete: true,
    lastSuccessAt: lastHealth,
    lastErrorAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checkedAt,
    details: {
      enabledProviders: list.length,
      note: "Providers configured but never health-checked — unknown, not Operational",
    },
  };
}

export function probeGooglePlay(): IntegrationProbeResult {
  const checkedAt = new Date().toISOString();
  return {
    key: "google_play",
    label: "Google Play",
    status: "future_reserved",
    configComplete: false,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checkedAt,
    details: {
      note: "Android Future Reserved — no credentials, jobs, or fake zeros",
    },
  };
}

export async function probeAllIntegrations(
  db: SupabaseClient,
): Promise<IntegrationProbeResult[]> {
  const [supabase, revenuecat, asc, ai] = await Promise.all([
    probeSupabase(db),
    probeRevenueCat(db),
    probeAppStoreConnect(db),
    probeAiGateway(db),
  ]);
  return [supabase, revenuecat, asc, ai, probeGooglePlay()];
}

export async function persistIntegrationStatus(
  db: SupabaseClient,
  result: IntegrationProbeResult,
): Promise<void> {
  await db.from("integration_connection_status").upsert(
    {
      integration_key: result.key,
      status: result.status,
      config_complete: result.configComplete,
      last_success_at: result.lastSuccessAt,
      last_error_at: result.lastErrorAt,
      last_error_code: result.lastErrorCode,
      last_error_message: result.lastErrorMessage,
      checked_at: result.checkedAt,
      details: result.details,
    },
    { onConflict: "integration_key" },
  );
}

export function toAdminIntegration(result: IntegrationProbeResult) {
  return {
    key: result.key,
    label: result.label,
    status: result.status,
    configComplete: result.configComplete,
    lastSuccessAt: result.lastSuccessAt,
    lastErrorAt: result.lastErrorAt,
    lastErrorCode: result.lastErrorCode,
    lastErrorMessage: result.lastErrorMessage,
    checkedAt: result.checkedAt,
    details: result.details,
  };
}
