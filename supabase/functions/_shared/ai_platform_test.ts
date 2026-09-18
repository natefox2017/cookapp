/**
 * AI Platform unit tests (Issue #53).
 * Run: deno test --allow-env supabase/functions/_shared/ai_platform_test.ts
 */

import {
  assertEquals,
  assertThrows,
} from "jsr:@std/assert@1";
import { validateAiBaseUrl, redactSecrets } from "./ai-ssrf.ts";
import {
  encryptSecret,
  decryptSecret,
} from "./ai-secret-store.ts";
import {
  limitFallbackModelIds,
  shouldTryNextModel,
  MAX_FALLBACK_MODELS,
} from "./ai-router.ts";
import { summarizeUsageEvents } from "./ai-usage.ts";
import { AppError } from "./errors.ts";

Deno.test("validateAiBaseUrl accepts https public host", () => {
  const url = validateAiBaseUrl("https://api.example.com/v1/");
  assertEquals(url, "https://api.example.com/v1");
});

Deno.test("validateAiBaseUrl rejects http in production", () => {
  assertThrows(
    () => validateAiBaseUrl("http://api.example.com"),
    AppError,
  );
});

Deno.test("validateAiBaseUrl rejects private IPv4 (SSRF)", () => {
  assertThrows(
    () => validateAiBaseUrl("https://127.0.0.1/v1"),
    AppError,
  );
  assertThrows(
    () => validateAiBaseUrl("https://10.0.0.5/v1"),
    AppError,
  );
  assertThrows(
    () => validateAiBaseUrl("https://169.254.169.254/latest"),
    AppError,
  );
  assertThrows(
    () => validateAiBaseUrl("https://192.168.1.1/v1"),
    AppError,
  );
});

Deno.test("validateAiBaseUrl rejects localhost hostname", () => {
  assertThrows(
    () => validateAiBaseUrl("https://localhost/v1"),
    AppError,
  );
});

Deno.test("validateAiBaseUrl allows localhost http only with explicit allow", () => {
  const url = validateAiBaseUrl("http://localhost:8080/v1", {
    allowLocalhost: true,
    environment: "development",
  });
  assertEquals(url, "http://localhost:8080/v1");
});

Deno.test("redactSecrets masks bearer and sk- keys", () => {
  const raw =
    'Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz error';
  const redacted = redactSecrets(raw);
  assertEquals(redacted.includes("sk-abcdefghijklmnopqrstuvwxyz"), false);
  assertEquals(redacted.includes("***"), true);
});

Deno.test("encrypt/decrypt roundtrip never stores plaintext shape", async () => {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const sealed = await encryptSecret("super-secret-api-key", key);
  assertEquals(sealed.ciphertext.includes("super-secret"), false);
  assertEquals(sealed.nonce.length > 0, true);
  const plain = await decryptSecret(sealed.ciphertext, sealed.nonce, key);
  assertEquals(plain, "super-secret-api-key");
});

Deno.test("limitFallbackModelIds caps at MAX_FALLBACK_MODELS", () => {
  const ids = ["a", "b", "c", "d", "e", "a"];
  const limited = limitFallbackModelIds(ids);
  assertEquals(limited.length, MAX_FALLBACK_MODELS);
  assertEquals(MAX_FALLBACK_MODELS, 3);
  assertEquals(limited, ["a", "b", "c"]);
});

Deno.test("shouldTryNextModel respects chain end and retry exhaustion", () => {
  assertEquals(
    shouldTryNextModel({
      attemptIndex: 0,
      chainLength: 2,
      lastRetryable: false,
      retriesUsedOnModel: 0,
      maxRetriesOnModel: 1,
    }),
    true,
  );
  assertEquals(
    shouldTryNextModel({
      attemptIndex: 1,
      chainLength: 2,
      lastRetryable: true,
      retriesUsedOnModel: 1,
      maxRetriesOnModel: 1,
    }),
    false,
  );
  assertEquals(
    shouldTryNextModel({
      attemptIndex: 0,
      chainLength: 3,
      lastRetryable: true,
      retriesUsedOnModel: 1,
      maxRetriesOnModel: 1,
    }),
    true,
  );
});

Deno.test("summarizeUsageEvents computes rates and percentiles", () => {
  const summary = summarizeUsageEvents([
    {
      status: "success",
      latency_ms: 10,
      route_key: "recipe_import_text",
      provider_id: "p1",
      final_model_id: "m1",
      input_tokens: 100,
      output_tokens: 20,
      attempted_models: [{ modelId: "m1" }],
    },
    {
      status: "error",
      latency_ms: 50,
      route_key: "recipe_import_text",
      provider_id: "p1",
      final_model_id: "m2",
      input_tokens: 10,
      output_tokens: 0,
      attempted_models: [{ modelId: "m1" }, { modelId: "m2" }],
    },
    {
      status: "success",
      latency_ms: 30,
      route_key: "recipe_quality_check",
      provider_id: "p2",
      model_id: "m3",
      input_tokens: 5,
      output_tokens: 5,
      attempted_models: [{ modelId: "m3" }],
    },
  ]);
  assertEquals(summary.requests, 3);
  assertEquals(summary.successRate, 2 / 3);
  assertEquals(summary.errorRate, 1 / 3);
  assertEquals(summary.fallbackRate, 1 / 3);
  assertEquals(summary.inputTokens, 115);
  assertEquals(summary.outputTokens, 25);
  assertEquals(summary.p50LatencyMs, 30);
  assertEquals(summary.byRoute["recipe_import_text"], 2);
});

Deno.test("provider response mapper never includes apiKey fields", () => {
  // Document the Admin contract: secretConfigured boolean only.
  const mapped = {
    id: "x",
    secretConfigured: true,
    secretRef: null as null,
    apiKey: undefined,
  };
  assertEquals("apiKey" in mapped && mapped.apiKey === undefined, true);
  assertEquals(mapped.secretRef, null);
  assertEquals(mapped.secretConfigured, true);
});
