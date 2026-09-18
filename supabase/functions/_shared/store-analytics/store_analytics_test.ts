/**
 * Unit tests for store analytics / financial sync (Issue #59).
 * Run: deno test --allow-env supabase/functions/_shared/store-analytics/
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "jsr:@std/assert@1";
import { createAscJwt } from "./asc-jwt.ts";
import {
  parseAppleAnalyticsDownloadRows,
  parseAppleFinancialTsv,
  AppleAppStoreAnalyticsProvider,
  AppleAppStoreFinancialProvider,
} from "./apple-provider.ts";
import {
  GooglePlayAnalyticsProvider,
  GooglePlayFinancialProvider,
} from "./google-provider.ts";

Deno.test("parseAppleFinancialTsv preserves nulls — never invents zeros", () => {
  const tsv = [
    "Country or Region\tCurrency of Proceeds\tQuantity\tDeveloper Proceeds\tSKU",
    "US\tUSD\t12\t84.00\tpro.monthly",
    "JP\tJPY\t\t\tpro.yearly",
  ].join("\n");
  const rows = parseAppleFinancialTsv(tsv, "2026-03");
  assertEquals(rows.length, 2);
  assertEquals(rows[0].units, 12);
  assertEquals(rows[0].developerProceeds, 84);
  assertEquals(rows[0].providerSource, "apple_financial_reports");
  assertEquals(rows[0].platform, "ios");
  // Missing cells stay null — not 0
  assertEquals(rows[1].units, null);
  assertEquals(rows[1].developerProceeds, null);
  assertEquals(rows[1].grossAmount, null);
});

Deno.test("parseAppleAnalyticsDownloadRows marks privacy gaps as not_returned null", () => {
  const csv = [
    "Date,Territory,Source,First-Time Downloads,Redownloads,Total Downloads",
    "2026-03-01,US,App Store search,10,2,12",
    "2026-03-01,ZZ,App Store search,-,,",
  ].join("\n");
  const points = parseAppleAnalyticsDownloadRows(csv, "2026-03-01");
  const available = points.filter((p) => p.dataStatus === "available");
  const missing = points.filter((p) => p.dataStatus === "not_returned");
  assertEquals(available.length >= 3, true);
  assertEquals(available.every((p) => p.metricValue !== null), true);
  assertEquals(missing.length >= 1, true);
  assertEquals(missing.every((p) => p.metricValue === null), true);
  assertEquals(points.every((p) => p.providerSource === "app_store_connect_analytics"), true);
});

Deno.test("Google Play analytics provider is future_reserved with empty rows", async () => {
  const provider = new GooglePlayAnalyticsProvider();
  const status = await provider.getConnectionStatus();
  assertEquals(status.status, "future_reserved");
  const result = await provider.fetchDailyAnalytics({
    start: "2026-01-01",
    end: "2026-01-31",
  });
  assertEquals(result.status, "future_reserved");
  assertEquals(result.rows, []);
});

Deno.test("Google Play financial provider is future_reserved with empty rows", async () => {
  const provider = new GooglePlayFinancialProvider();
  const status = await provider.getConnectionStatus();
  assertEquals(status.status, "future_reserved");
  const result = await provider.fetchFinancialReports({
    start: "2026-01-01",
    end: "2026-01-31",
  });
  assertEquals(result.status, "future_reserved");
  assertEquals(result.rows, []);
});

Deno.test("Apple analytics not_configured when credentials missing", async () => {
  // Empty stub client — resolveAppleCredentials will see no DB + no env
  const prev = {
    issuer: Deno.env.get("ASC_ISSUER_ID"),
    key: Deno.env.get("ASC_KEY_ID"),
    pem: Deno.env.get("ASC_PRIVATE_KEY_P8"),
  };
  Deno.env.delete("ASC_ISSUER_ID");
  Deno.env.delete("ASC_KEY_ID");
  Deno.env.delete("ASC_PRIVATE_KEY_P8");

  const db = {
    from(_table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: null, error: null }),
              };
            },
          };
        },
      };
    },
  } as unknown as import("jsr:@supabase/supabase-js@2").SupabaseClient;

  const provider = new AppleAppStoreAnalyticsProvider(db);
  const status = await provider.getConnectionStatus();
  assertEquals(status.configured, false);
  assertEquals(status.status, "not_configured");
  const result = await provider.fetchDailyAnalytics({
    start: "2026-03-01",
    end: "2026-03-07",
  });
  assertEquals(result.status, "not_configured");
  assertEquals(result.rows, []);

  if (prev.issuer) Deno.env.set("ASC_ISSUER_ID", prev.issuer);
  if (prev.key) Deno.env.set("ASC_KEY_ID", prev.key);
  if (prev.pem) Deno.env.set("ASC_PRIVATE_KEY_P8", prev.pem);
});

Deno.test("Apple financial not_configured without vendor number", async () => {
  const prev = {
    issuer: Deno.env.get("ASC_ISSUER_ID"),
    key: Deno.env.get("ASC_KEY_ID"),
    pem: Deno.env.get("ASC_PRIVATE_KEY_P8"),
    vendor: Deno.env.get("ASC_VENDOR_NUMBER"),
  };
  Deno.env.set("ASC_ISSUER_ID", "issuer-test");
  Deno.env.set("ASC_KEY_ID", "key-test");
  // Minimal invalid PEM will fail JWT later; for vendor gate we delete vendor only.
  // Use a clearly empty vendor.
  Deno.env.delete("ASC_VENDOR_NUMBER");
  // Provide a throwaway PEM — connection status checks vendor after configured check.
  // We need credentials to look "configured" for JWT path; vendor gate is separate.
  Deno.env.set(
    "ASC_PRIVATE_KEY_P8",
    "-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==\n-----END PRIVATE KEY-----",
  );

  const db = {
    from(_table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: null, error: null }),
              };
            },
          };
        },
      };
    },
  } as unknown as import("jsr:@supabase/supabase-js@2").SupabaseClient;

  const provider = new AppleAppStoreFinancialProvider(db);
  const status = await provider.getConnectionStatus();
  assertEquals(status.configured, false);
  assertEquals(status.status, "not_configured");

  const result = await provider.fetchFinancialReports({
    start: "2026-01-01",
    end: "2026-01-31",
  });
  assertEquals(result.status, "not_configured");
  assertEquals(result.rows, []);

  for (const [k, v] of Object.entries({
    ASC_ISSUER_ID: prev.issuer,
    ASC_KEY_ID: prev.key,
    ASC_PRIVATE_KEY_P8: prev.pem,
    ASC_VENDOR_NUMBER: prev.vendor,
  })) {
    if (v === undefined) Deno.env.delete(k);
    else Deno.env.set(k, v);
  }
});

Deno.test("createAscJwt produces three-part ES256 token with aud claim", async () => {
  // Generate an ephemeral P-256 key and export PKCS8 PEM for signing.
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  );
  let binary = "";
  for (const b of pkcs8) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  const pem =
    `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;

  const jwt = await createAscJwt({
    issuerId: "issuer-123",
    keyId: "KEYID123",
    privateKeyPem: pem,
    nowSeconds: 1_700_000_000,
    ttlSeconds: 600,
  });
  const parts = jwt.split(".");
  assertEquals(parts.length, 3);
  const payloadJson = JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      ),
    ),
  );
  assertEquals(payloadJson.iss, "issuer-123");
  assertEquals(payloadJson.aud, "appstoreconnect-v1");
  assertEquals(payloadJson.exp - payloadJson.iat, 600);
  assertExists(parts[2]);
});

Deno.test("createAscJwt rejects empty PEM", async () => {
  await assertRejects(
    () =>
      createAscJwt({
        issuerId: "x",
        keyId: "y",
        privateKeyPem: "-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----",
      }),
  );
});

Deno.test("Apple analytics with mock HTTP returns parsed points without inventing zeros", async () => {
  Deno.env.set("ASC_ISSUER_ID", "issuer");
  Deno.env.set("ASC_KEY_ID", "kid");
  Deno.env.set("ASC_APP_APPLE_ID", "1234567890");
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  );
  let binary = "";
  for (const b of pkcs8) binary += String.fromCharCode(b);
  Deno.env.set(
    "ASC_PRIVATE_KEY_P8",
    `-----BEGIN PRIVATE KEY-----\n${btoa(binary)}\n-----END PRIVATE KEY-----`,
  );

  const db = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: null, error: null }),
              };
            },
          };
        },
      };
    },
  } as unknown as import("jsr:@supabase/supabase-js@2").SupabaseClient;

  const http = async (url: string) => {
    if (url.includes("/analyticsReportRequests") && !url.includes("/reports")) {
      return new Response(JSON.stringify({ data: [{ id: "req1" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/reports") && !url.includes("/instances")) {
      return new Response(JSON.stringify({ data: [{ id: "rep1" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/instances") && !url.includes("/segments")) {
      return new Response(
        JSON.stringify({
          data: [{
            id: "inst1",
            attributes: { processingDate: "2026-03-05" },
          }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("/segments")) {
      return new Response(
        JSON.stringify({
          data: [{ attributes: { url: "https://example.test/segment.csv" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("example.test/segment.csv")) {
      const body = [
        "Date,Territory,Source,First-Time Downloads,Redownloads,Total Downloads",
        "2026-03-05,US,Search,5,,",
      ].join("\n");
      return new Response(body, { status: 200 });
    }
    return new Response("not found", { status: 404 });
  };

  const provider = new AppleAppStoreAnalyticsProvider(db, http);
  const result = await provider.fetchDailyAnalytics({
    start: "2026-03-01",
    end: "2026-03-10",
  });
  assertEquals(result.status, "ok");
  assertEquals(result.rows.length >= 1, true);
  const first = result.rows.find((r) => r.metricKey === "first_time_downloads");
  assertEquals(first?.metricValue, 5);
  const re = result.rows.find((r) => r.metricKey === "redownloads");
  assertEquals(re?.metricValue, null);
  assertEquals(re?.dataStatus, "not_returned");

  Deno.env.delete("ASC_ISSUER_ID");
  Deno.env.delete("ASC_KEY_ID");
  Deno.env.delete("ASC_PRIVATE_KEY_P8");
  Deno.env.delete("ASC_APP_APPLE_ID");
});
