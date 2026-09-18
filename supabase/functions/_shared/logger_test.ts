/**
 * Log redaction tests (Issue #57).
 * Run: deno test --allow-env supabase/functions/_shared/logger_test.ts
 */

import {
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import { redactSensitive, redactString, log } from "./logger.ts";
import { resolveRequestContext } from "./request-context.ts";

Deno.test("redactString strips Bearer Authorization tokens", () => {
  const raw = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb";
  const out = redactString(raw);
  assertStringIncludes(out, "[REDACTED]");
  assertEquals(out.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"), false);
});

Deno.test("redactString strips api_key and purchase_token assignments", () => {
  const raw =
    'api_key=sk-abcdefghijklmnopqrstuvwxyz purchase_token=abc123XYZ refresh_token=rt_secret';
  const out = redactString(raw);
  assertEquals(out.includes("sk-abcdefghijklmnopqrstuvwxyz"), false);
  assertEquals(out.includes("abc123XYZ"), false);
  assertEquals(out.includes("rt_secret"), false);
  assertStringIncludes(out, "[REDACTED]");
});

Deno.test("redactSensitive redacts Authorization / API keys / purchase tokens in objects", () => {
  const input = {
    Authorization: "Bearer secret-token-value",
    headers: {
      authorization: "Bearer another-secret",
      "x-request-id": "req-1",
    },
    apiKey: "sk-live-should-hide",
    api_key: "plain-api-key",
    purchase_token: "GPA.1234-purchase",
    purchaseToken: "also-hide",
    password: "admin123",
    nested: {
      client_secret: "super-secret",
      webhook_secret: "hook-secret",
      product_id: "com.natefox.cookapp.pro.monthly",
    },
    safe: "visible",
  };

  const out = redactSensitive(input) as Record<string, unknown>;
  assertEquals(out.Authorization, "[REDACTED]");
  assertEquals(out.apiKey, "[REDACTED]");
  assertEquals(out.api_key, "[REDACTED]");
  assertEquals(out.purchase_token, "[REDACTED]");
  assertEquals(out.purchaseToken, "[REDACTED]");
  assertEquals(out.password, "[REDACTED]");
  assertEquals(out.safe, "visible");

  const headers = out.headers as Record<string, unknown>;
  assertEquals(headers.authorization, "[REDACTED]");
  assertEquals(headers["x-request-id"], "req-1");

  const nested = out.nested as Record<string, unknown>;
  assertEquals(nested.client_secret, "[REDACTED]");
  assertEquals(nested.webhook_secret, "[REDACTED]");
  assertEquals(nested.product_id, "com.natefox.cookapp.pro.monthly");
});

Deno.test("redactSensitive walks arrays", () => {
  const out = redactSensitive([
    { token: "secret", id: 1 },
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb",
  ]) as unknown[];
  assertEquals((out[0] as Record<string, unknown>).token, "[REDACTED]");
  assertEquals((out[0] as Record<string, unknown>).id, 1);
  assertStringIncludes(String(out[1]), "[REDACTED]");
});

Deno.test("log never prints raw Authorization values", () => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    log("info", "test_event", {
      Authorization: "Bearer raw-secret-token",
      api_key: "sk-should-not-appear",
      purchase_token: "purchase-secret",
      ok: true,
    }, { requestId: "rid-1", correlationId: "cid-1" });
  } finally {
    console.log = original;
  }
  assertEquals(lines.length, 1);
  const payload = JSON.parse(lines[0]) as Record<string, unknown>;
  assertEquals(payload.Authorization, "[REDACTED]");
  assertEquals(payload.api_key, "[REDACTED]");
  assertEquals(payload.purchase_token, "[REDACTED]");
  assertEquals(payload.ok, true);
  assertEquals(payload.request_id, "rid-1");
  assertEquals(payload.correlation_id, "cid-1");
  assertEquals(lines[0].includes("raw-secret-token"), false);
  assertEquals(lines[0].includes("sk-should-not-appear"), false);
  assertEquals(lines[0].includes("purchase-secret"), false);
});

Deno.test("resolveRequestContext prefers inbound headers and generates otherwise", () => {
  const withHeaders = resolveRequestContext(
    new Request("https://example.test", {
      headers: {
        "X-Request-Id": "client-req",
        "X-Correlation-Id": "client-corr",
        "X-Job-Id": "job-9",
      },
    }),
  );
  assertEquals(withHeaders.requestId, "client-req");
  assertEquals(withHeaders.correlationId, "client-corr");
  assertEquals(withHeaders.jobId, "job-9");

  const generated = resolveRequestContext(new Request("https://example.test"));
  assertEquals(typeof generated.requestId, "string");
  assertEquals(generated.requestId.length > 0, true);
  assertEquals(generated.correlationId, generated.requestId);
  assertEquals(generated.jobId, null);
});
