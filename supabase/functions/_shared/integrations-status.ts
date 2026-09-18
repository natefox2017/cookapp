/**
 * Integration connection status model (Issue #63 / V2 §11).
 * Pure helpers — no secrets in outputs; production must not fake "connected".
 */

export const INTEGRATION_IDS = [
  "supabase",
  "revenuecat",
  "app_store_connect",
  "ai_gateway",
  "google_play",
] as const;

export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export type IntegrationConnectionStatus =
  | "connected"
  | "not_configured"
  | "degraded"
  | "future_reserved";

export type ConfigCompleteness = {
  required: string[];
  configured: string[];
  missing: string[];
  percent: number;
};

export type IntegrationStatusItem = {
  id: IntegrationId;
  name: string;
  status: IntegrationConnectionStatus;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  lastCheckedAt: string | null;
  configCompleteness: ConfigCompleteness;
  /** True when a server-side secret exists; never includes plaintext. */
  secretConfigured: boolean;
  testSupported: boolean;
  secretWriteSupported: boolean;
  reserved: boolean;
  notes: string | null;
};

export const INTEGRATION_META: Record<
  IntegrationId,
  {
    name: string;
    requiredKeys: string[];
    testSupported: boolean;
    secretWriteSupported: boolean;
    reserved: boolean;
    notes: string | null;
  }
> = {
  supabase: {
    name: "Supabase",
    requiredKeys: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    testSupported: true,
    secretWriteSupported: false,
    reserved: false,
    notes: "Backend project connectivity (service role used only server-side).",
  },
  revenuecat: {
    name: "RevenueCat",
    requiredKeys: ["REVENUECAT_WEBHOOK_SECRET"],
    testSupported: true,
    secretWriteSupported: false,
    reserved: false,
    notes:
      "Webhook secret is set via `supabase secrets` (env). Admin never reads plaintext.",
  },
  app_store_connect: {
    name: "App Store Connect",
    requiredKeys: ["issuerId", "keyId", "privateKey"],
    testSupported: true,
    secretWriteSupported: true,
    reserved: false,
    notes:
      "ASC Analytics/Financial (#59). Configure Issuer ID, Key ID, and write-only .p8 key.",
  },
  ai_gateway: {
    name: "AI Gateway",
    requiredKeys: ["enabledProvider", "providerSecret"],
    testSupported: true,
    secretWriteSupported: false,
    reserved: false,
    notes:
      "Managed under Settings → AI Platform (`admin-ai`). Secrets stay write-only there.",
  },
  google_play: {
    name: "Google Play",
    requiredKeys: [],
    testSupported: false,
    secretWriteSupported: false,
    reserved: true,
    notes: "Future Reserved / Not Connected. Never mock as connected.",
  },
};

export function isIntegrationId(value: string): value is IntegrationId {
  return (INTEGRATION_IDS as readonly string[]).includes(value);
}

export function computeCompleteness(
  required: string[],
  configured: string[],
): ConfigCompleteness {
  const configuredSet = new Set(configured);
  const present = required.filter((k) => configuredSet.has(k));
  const missing = required.filter((k) => !configuredSet.has(k));
  const percent =
    required.length === 0
      ? 100
      : Math.round((present.length / required.length) * 100);
  return {
    required: [...required],
    configured: present,
    missing,
    percent,
  };
}

/**
 * Derive connection status from completeness + optional probe outcome.
 * Google Play is always future_reserved.
 */
export function deriveStatus(input: {
  id: IntegrationId;
  completeness: ConfigCompleteness;
  probeOk?: boolean | null;
  probeError?: string | null;
}): IntegrationConnectionStatus {
  if (input.id === "google_play" || INTEGRATION_META[input.id].reserved) {
    return "future_reserved";
  }
  if (input.completeness.missing.length > 0) {
    return "not_configured";
  }
  if (input.probeOk === false || input.probeError) {
    return "degraded";
  }
  if (input.probeOk === true) {
    return "connected";
  }
  // Config complete but not yet probed — treat as connected only when
  // all required keys present (caller may override with health history).
  return "connected";
}

export function buildStatusItem(input: {
  id: IntegrationId;
  configuredKeys: string[];
  secretConfigured: boolean;
  lastSuccessAt?: string | null;
  lastErrorAt?: string | null;
  lastErrorMessage?: string | null;
  lastCheckedAt?: string | null;
  probeOk?: boolean | null;
  probeError?: string | null;
  statusOverride?: IntegrationConnectionStatus | null;
}): IntegrationStatusItem {
  const meta = INTEGRATION_META[input.id];
  const completeness = computeCompleteness(meta.requiredKeys, input.configuredKeys);
  const status =
    input.statusOverride ??
    deriveStatus({
      id: input.id,
      completeness,
      probeOk: input.probeOk,
      probeError: input.probeError,
    });

  const reservedCompleteness: ConfigCompleteness = meta.reserved
    ? { required: [], configured: [], missing: [], percent: 0 }
    : completeness;

  return {
    id: input.id,
    name: meta.name,
    status,
    lastSuccessAt: input.lastSuccessAt ?? null,
    lastErrorAt: input.lastErrorAt ?? null,
    lastErrorMessage: input.lastErrorMessage ?? null,
    lastCheckedAt: input.lastCheckedAt ?? null,
    configCompleteness: reservedCompleteness,
    secretConfigured: Boolean(input.secretConfigured),
    testSupported: meta.testSupported,
    secretWriteSupported: meta.secretWriteSupported,
    reserved: meta.reserved,
    notes: meta.notes,
  };
}

export function secretRefFor(integrationId: IntegrationId): string {
  return `integration_${integrationId}`;
}
