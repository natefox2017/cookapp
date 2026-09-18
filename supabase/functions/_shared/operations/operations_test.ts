/**
 * Unit tests for Operations / Aggregation helpers (Issue #60).
 */
import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert@1";
import {
  clearTableExistsCache,
  futureReservedAndroidGuard,
  isManualRunJobType,
  kpiAvailabilityRules,
  mapOperationalJob,
  providerForJobType,
  probeGooglePlay,
  toAdminJob,
} from "./test_helpers.ts";

Deno.test("manual run job types include ASC / RC / cleanup / refuse Play", () => {
  assertEquals(isManualRunJobType("storage_cleanup_import_artifacts"), true);
  assertEquals(isManualRunJobType("store_analytics_sync"), true);
  assertEquals(isManualRunJobType("financial_report_sync"), true);
  assertEquals(isManualRunJobType("asc_analytics_sync"), true);
  assertEquals(isManualRunJobType("asc_financial_sync"), true);
  assertEquals(isManualRunJobType("revenuecat_health_check"), true);
  assertEquals(isManualRunJobType("ai_gateway_health_check"), true);
  assertEquals(isManualRunJobType("google_play_sync"), true);
  assertEquals(isManualRunJobType("recipe_import_worker"), true);
  assertEquals(isManualRunJobType("not_a_job"), false);
});

Deno.test("provider mapping for job types", () => {
  assertEquals(providerForJobType("store_analytics_sync"), "app_store_connect");
  assertEquals(providerForJobType("financial_report_sync"), "app_store_connect");
  assertEquals(providerForJobType("revenuecat_health_check"), "revenuecat");
  assertEquals(providerForJobType("google_play_sync"), "google_play");
  assertEquals(providerForJobType("ai_gateway_health_check"), "ai_gateway");
  assertEquals(
    providerForJobType("storage_cleanup_import_artifacts"),
    "cookapp",
  );
});

Deno.test("Google Play probe is always future_reserved — never Operational", () => {
  const probe = probeGooglePlay();
  assertEquals(probe.status, "future_reserved");
  assertEquals(probe.configComplete, false);
  assertEquals(probe.key, "google_play");
  // Must not look like a healthy live integration.
  assertEquals(["connected", "degraded", "unknown"].includes(probe.status), false);
});

Deno.test("mapOperationalJob + toAdminJob camelCase", () => {
  const row = mapOperationalJob({
    id: "11111111-1111-1111-1111-111111111111",
    job_type: "revenuecat_health_check",
    provider: "revenuecat",
    status: "succeeded",
    trigger: "manual",
    started_at: "2026-09-18T00:00:00Z",
    completed_at: "2026-09-18T00:00:01Z",
    next_run_at: null,
    rows_affected: 0,
    items_total: null,
    items_failed: null,
    retry_count: 0,
    max_retries: 3,
    error_code: null,
    error_message: null,
    request_id: "req-1",
    correlation_id: "corr-1",
    parent_job_id: null,
    related_entity_type: null,
    related_entity_id: null,
    metadata: { ok: true },
    created_by: null,
    created_at: "2026-09-18T00:00:00Z",
    updated_at: "2026-09-18T00:00:01Z",
    source_table: "operational_jobs",
  });
  const admin = toAdminJob(row);
  assertEquals(admin.jobType, "revenuecat_health_check");
  assertEquals(admin.requestId, "req-1");
  assertEquals(admin.sourceTable, "operational_jobs");
  assertExists(admin.metadata);
});

Deno.test("KPI availability rules: missing Apple ≠ 0; Android future_reserved", () => {
  const rules = kpiAvailabilityRules({
    iosDownloads: null,
    onlySeedRows: true,
    paymentTxPresent: false,
    purchaseEventCount: 0,
  });
  assertEquals(rules.downloadsIos.availability, "no_data");
  assertEquals(rules.downloadsIos.value, null);
  assertEquals(rules.downloadsAndroid.availability, "future_reserved");
  assertEquals(rules.downloadsAndroid.value, null);
  assertEquals(rules.revenueApple.availability, "no_data");
  assertEquals(rules.revenueAndroid.availability, "future_reserved");
});

Deno.test("Android guard strips fake zeros from legacy stats", () => {
  const guarded = futureReservedAndroidGuard({
    revenueApple: 12.5,
    revenueAndroid: 0,
    downloadsIos: 100,
    downloadsAndroid: 0,
    downloadsTotal: 100,
  });
  assertEquals(guarded.revenueAndroid, null);
  assertEquals(guarded.downloadsAndroid, null);
  assertEquals(guarded.revenueApple, 12.5);
  assertEquals(guarded.downloadsIos, 100);
});

Deno.test("table probe cache clear is exported for tests", () => {
  clearTableExistsCache();
});
