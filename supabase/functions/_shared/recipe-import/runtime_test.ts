/**
 * Production runtime wiring for Recipe Import (#53 / #54 / #61).
 * Run: deno test --allow-env supabase/functions/_shared/recipe-import/
 */

import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import { PlatformAIRouter, getAIRouter, StubAIRouter } from "../ai-router.ts";
import { AISecretStore, encryptSecret } from "../ai-secret-store.ts";
import {
  MemoryMediaStorageProvider,
  STORAGE_PROVIDER_SUPABASE,
  createSupabaseMediaStorageProvider,
} from "../media-storage/mod.ts";
import { cleanupExpiredImportArtifacts } from "../media-storage/cleanup.ts";
import { getMediaStorageProvider } from "../media-storage.ts";
import { parseRecipeWithAI } from "./recipe-ai-parser.ts";
import { createImportPipelineRuntime } from "./runtime.ts";
import { normalizeContent } from "./normalizer.ts";
import { runImportPipeline } from "./pipeline.ts";

Deno.test("createImportPipelineRuntime injects PlatformAIRouter + Supabase storage", () => {
  const runtime = createImportPipelineRuntime({} as never);
  assertEquals(runtime.media.providerId, STORAGE_PROVIDER_SUPABASE);
  assertEquals(runtime.router instanceof PlatformAIRouter, true);
  assertEquals(createSupabaseMediaStorageProvider({} as never).providerId, "supabase");
});

Deno.test("production getters fail closed instead of returning stubs", () => {
  try {
    getMediaStorageProvider();
    throw new Error("expected getMediaStorageProvider to throw");
  } catch (err) {
    assertStringIncludes(String(err), "not configured");
  }
  try {
    getAIRouter();
    throw new Error("expected getAIRouter to throw");
  } catch (err) {
    assertStringIncludes(String(err), "not configured");
  }
});

Deno.test("pipeline rejects missing media and stub provider", async () => {
  const job = {
    id: "11111111-1111-4111-8111-111111111111",
    batch_id: null,
    source_type: "text",
    source_url: null,
    canonical_url: null,
    source_external_id: null,
    source_text: "mix flour",
    destination_user_id: null,
    status: "pending" as const,
    stage: "resolve" as const,
    retry_count: 0,
  };
  await assertRejects(
    () => runImportPipeline(job, { admin: {} as never }),
    Error,
    "MediaStorageProvider is required",
  );

  const stub = {
    providerId: "stub",
    upload: async () => {
      throw new Error("nope");
    },
  };
  await assertRejects(
    () =>
      runImportPipeline(job, {
        admin: {} as never,
        media: stub as never,
        router: new StubAIRouter(),
      }),
    Error,
    "test-only",
  );
});

Deno.test("memory provider upload/exists/delete for import artifacts", async () => {
  const media = new MemoryMediaStorageProvider();
  const jobId = "22222222-2222-4222-8222-222222222222";
  const ref = await media.upload({
    bucket: "recipe-import-artifacts",
    objectKey: `${jobId}/caption.txt`,
    body: new TextEncoder().encode("garlic noodles"),
    mimeType: "text/plain",
  });
  assertEquals(ref.storage_provider, "memory");
  assertEquals(await media.exists("recipe-import-artifacts", `${jobId}/caption.txt`), true);
  await media.delete("recipe-import-artifacts", `${jobId}/caption.txt`);
  assertEquals(await media.exists("recipe-import-artifacts", `${jobId}/caption.txt`), false);
});

Deno.test("TTL cleanup deletes objects through MediaStorageProvider", async () => {
  const media = new MemoryMediaStorageProvider();
  const jobId = "33333333-3333-4333-8333-333333333333";
  await media.upload({
    bucket: "recipe-import-artifacts",
    objectKey: `${jobId}/caption.txt`,
    body: new TextEncoder().encode("tmp"),
    mimeType: "text/plain",
  });
  const rows = [{
    id: "obj-1",
    job_id: jobId,
    bucket: "recipe-import-artifacts",
    object_key: `${jobId}/caption.txt`,
    expires_at: "2000-01-01T00:00:00Z",
  }];
  const db = {
    from() {
      const chain: Record<string, unknown> = {
        select() {
          return chain;
        },
        lte() {
          return chain;
        },
        is() {
          return chain;
        },
        order() {
          return chain;
        },
        limit() {
          return chain;
        },
        update() {
          return chain;
        },
        eq() {
          return Promise.resolve({ error: null });
        },
        then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        },
      };
      return chain;
    },
  };
  const result = await cleanupExpiredImportArtifacts(db as never, media);
  assertEquals(result.deleted, 1);
  assertEquals(await media.exists("recipe-import-artifacts", `${jobId}/caption.txt`), false);
});

Deno.test("PlatformAIRouter recipe_import_text records route/provider/model/usage", async () => {
  const masterKey = crypto.getRandomValues(new Uint8Array(32));
  const sealed = await encryptSecret("test-key-not-logged", masterKey);
  const usage: Record<string, unknown>[] = [];
  const state = {
    route: {
      route_key: "recipe_import_text",
      enabled: true,
      primary_model_id: "m1",
      fallback_model_ids: [],
      timeout_ms: 5000,
      max_retries: 0,
      temperature: null,
      max_output_tokens: 64,
      structured_schema_key: "recipe_import_v1",
    },
    models: [
      {
        id: "m1",
        provider_id: "p1",
        display_name: "Import Text",
        upstream_model_id: "recipe-text-1",
        enabled: true,
        cost_input_per_1m: null,
        cost_output_per_1m: null,
        ai_providers: {
          id: "p1",
          base_url: "https://gateway.example.com/v1",
          secret_ref: "ref1",
          enabled: true,
          request_timeout_ms: 5000,
          max_retries: 0,
          environment: "production",
        },
      },
    ],
    secrets: new Map([["ref1", sealed]]),
    health: new Map<string, Record<string, unknown>>(),
    usage,
  };

  const db = {
    from(table: string) {
      const chain: Record<string, unknown> = {
        select() {
          return chain;
        },
        insert(payload: Record<string, unknown>) {
          if (table === "ai_usage_events") usage.push(payload);
          return chain;
        },
        upsert(payload: Record<string, unknown>) {
          if (table === "ai_provider_health") {
            state.health.set(String(payload.provider_id), payload);
          }
          return chain;
        },
        update() {
          return chain;
        },
        eq(col: string, val: unknown) {
          if (table === "ai_secrets" && col === "secret_ref") {
            (chain as { _secretRef?: string })._secretRef = String(val);
          }
          return chain;
        },
        in() {
          return chain;
        },
        maybeSingle: async () => {
          if (table === "ai_routes") return { data: state.route, error: null };
          if (table === "ai_secrets") {
            const row = state.secrets.get((chain as { _secretRef?: string })._secretRef ?? "");
            return row
              ? { data: { ciphertext: row.ciphertext, nonce: row.nonce }, error: null }
              : { data: null, error: null };
          }
          if (table === "ai_provider_health") return { data: null, error: null };
          return { data: null, error: null };
        },
        then(
          resolve: (v: unknown) => unknown,
          reject?: (e: unknown) => unknown,
        ) {
          const run = async () => {
            if (table === "ai_models") return { data: state.models, error: null };
            if (table === "ai_usage_events") return { data: usage.at(-1) ?? null, error: null };
            return { data: null, error: null };
          };
          return run().then(resolve, reject);
        },
      };
      return chain;
    },
  };

  const recipeJson = {
    title: "Skillet eggs",
    ingredients: [{
      raw_text: "eggs",
      quantity: 2,
      unit: null,
      ingredient: "eggs",
      preparation: null,
    }],
    instructions: [{ position: 1, text: "Cook", timer_seconds: null }],
    confidence: { overall: 0.81, per_field: {} },
    evidence: [],
  };

  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(recipeJson) } }],
        usage: { prompt_tokens: 11, completion_tokens: 7 },
      }),
      { status: 200 },
    );

  const router = new PlatformAIRouter(db as never);
  const secretStore = new AISecretStore(db as never, masterKey);
  const result = await router.completeStructured({
    route_key: "recipe_import_text",
    input: { text: "eggs in a skillet" },
    source_job_id: "job-runtime-1",
    schema_key: "recipe_import_v1",
    prompt_version: "recipe_import_prompt_v1",
  }, { fetchImpl, secretStore });

  assertEquals(result.ok, true);
  assertEquals(result.route_key, "recipe_import_text");
  assertEquals(result.provider_id, "p1");
  assertEquals(result.model_id, "m1");
  assertEquals((result.data as { title?: string }).title, "Skillet eggs");
  assertEquals(usage.length >= 1, true);
  assertEquals(usage.at(-1)?.route_key, "recipe_import_text");
  assertEquals(usage.at(-1)?.final_model_id ?? usage.at(-1)?.model_id, "m1");

  const parsed = await parseRecipeWithAI(
    normalizeContent({
      source_type: "text",
      source_url: null,
      canonical_url: null,
      source_external_id: null,
      page_title: null,
      page_text: "eggs in a skillet",
      caption: null,
      transcript: null,
      metadata: {},
      json_ld_recipes: [],
      image_candidates: [],
      fetch_ok: true,
      extract_notes: ["text_paste"],
    }),
    {
      router: {
        completeStructured: (req) =>
          router.completeStructured(req, { fetchImpl, secretStore }),
      },
    },
  );
  assertEquals(parsed.ok, true);
  assertEquals(parsed.route_key, "recipe_import_text");
  assertEquals(parsed.provider_id, "p1");
  assertEquals(parsed.model_id, "m1");
});
