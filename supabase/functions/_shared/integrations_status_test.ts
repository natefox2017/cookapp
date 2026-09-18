/**
 * Unit tests for Admin Integrations status model (#63).
 */
import {
  assertEquals,
  assert,
} from "jsr:@std/assert@1";
import {
  buildStatusItem,
  computeCompleteness,
  deriveStatus,
  INTEGRATION_IDS,
  isIntegrationId,
} from "./integrations-status.ts";

Deno.test("isIntegrationId accepts known ids only", () => {
  assert(isIntegrationId("supabase"));
  assert(isIntegrationId("google_play"));
  assertEquals(isIntegrationId("stripe"), false);
});

Deno.test("computeCompleteness reports missing keys and percent", () => {
  const c = computeCompleteness(
    ["a", "b", "c"],
    ["a", "c", "extra"],
  );
  assertEquals(c.configured, ["a", "c"]);
  assertEquals(c.missing, ["b"]);
  assertEquals(c.percent, 67);
});

Deno.test("google_play is always future_reserved even if keys present", () => {
  const status = deriveStatus({
    id: "google_play",
    completeness: computeCompleteness([], []),
    probeOk: true,
  });
  assertEquals(status, "future_reserved");
});

Deno.test("missing config → not_configured (never fake connected)", () => {
  const item = buildStatusItem({
    id: "revenuecat",
    configuredKeys: [],
    secretConfigured: false,
    probeOk: true,
  });
  assertEquals(item.status, "not_configured");
  assertEquals(item.secretConfigured, false);
});

Deno.test("complete config + failed probe → degraded", () => {
  const item = buildStatusItem({
    id: "supabase",
    configuredKeys: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    secretConfigured: true,
    probeOk: false,
    probeError: "timeout",
  });
  assertEquals(item.status, "degraded");
  assertEquals(item.lastErrorMessage, null);
});

Deno.test("complete config + ok probe → connected", () => {
  const item = buildStatusItem({
    id: "ai_gateway",
    configuredKeys: ["enabledProvider", "providerSecret"],
    secretConfigured: true,
    probeOk: true,
    lastSuccessAt: "2026-09-18T00:00:00.000Z",
  });
  assertEquals(item.status, "connected");
  assertEquals(item.lastSuccessAt, "2026-09-18T00:00:00.000Z");
  assertEquals(item.testSupported, true);
  assertEquals(item.secretWriteSupported, false);
});

Deno.test("ASC supports write-only secret updates", () => {
  const item = buildStatusItem({
    id: "app_store_connect",
    configuredKeys: ["issuerId", "keyId"],
    secretConfigured: false,
  });
  assertEquals(item.status, "not_configured");
  assertEquals(item.secretWriteSupported, true);
  assertEquals(item.configCompleteness.missing.includes("privateKey"), true);
});

Deno.test("google_play reserved completeness is zero (never looks fully configured)", () => {
  const item = buildStatusItem({
    id: "google_play",
    configuredKeys: [],
    secretConfigured: false,
    statusOverride: "future_reserved",
  });
  assertEquals(item.status, "future_reserved");
  assertEquals(item.configCompleteness.percent, 0);
  assertEquals(item.reserved, true);
});

Deno.test("all five integrations are enumerated", () => {
  assertEquals(INTEGRATION_IDS.length, 5);
});
