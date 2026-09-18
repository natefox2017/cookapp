/**
 * AIRouter fallback integration-style unit test with mocked DB + fetch.
 * Run: deno test --allow-env supabase/functions/_shared/ai_router_fallback_test.ts
 */

import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { PlatformAIRouter } from "./ai-router.ts";
import { AISecretStore, encryptSecret } from "./ai-secret-store.ts";
import { AppError } from "./errors.ts";

type Row = Record<string, unknown>;

function mockDb(state: {
  route: Row;
  models: Row[];
  secrets: Map<string, { ciphertext: string; nonce: string }>;
  health: Map<string, Row>;
  usage: Row[];
}) {
  return {
    from(table: string) {
      const api: Record<string, unknown> = {};
      let filters: Array<(row: Row) => boolean> = [];
      let insertPayload: Row | null = null;
      let upsertPayload: Row | null = null;
      let mode: "select" | "insert" | "upsert" | "update" = "select";

      const run = async () => {
        if (table === "ai_routes" && mode === "select") {
          return { data: state.route, error: null };
        }
        if (table === "ai_models" && mode === "select") {
          let rows = state.models;
          for (const f of filters) rows = rows.filter(f);
          return { data: rows, error: null };
        }
        if (table === "ai_secrets" && mode === "select") {
          let ref: string | null = null;
          for (const f of filters) {
            // filters capture eq secret_ref
          }
          // handled via maybeSingle path below
          return { data: null, error: null };
        }
        if (table === "ai_usage_events" && mode === "insert") {
          if (insertPayload) state.usage.push(insertPayload);
          return { data: insertPayload, error: null };
        }
        if (table === "ai_provider_health") {
          if (mode === "upsert" && upsertPayload) {
            state.health.set(String(upsertPayload.provider_id), upsertPayload);
            return { data: upsertPayload, error: null };
          }
          if (mode === "select") {
            return { data: null, error: null };
          }
        }
        if (table === "ai_providers" && mode === "update") {
          return { data: null, error: null };
        }
        return { data: null, error: null };
      };

      const chain: Record<string, unknown> = {
        select(_cols?: string) {
          mode = "select";
          return chain;
        },
        insert(payload: Row) {
          mode = "insert";
          insertPayload = payload;
          return chain;
        },
        upsert(payload: Row) {
          mode = "upsert";
          upsertPayload = payload;
          return chain;
        },
        update(_payload: Row) {
          mode = "update";
          return chain;
        },
        eq(col: string, val: unknown) {
          if (table === "ai_routes" && col === "route_key") {
            // already single route
          } else if (table === "ai_secrets" && col === "secret_ref") {
            filters.push((row) => row.secret_ref === val);
            (chain as { _secretRef?: string })._secretRef = String(val);
          } else if (table === "ai_provider_health" && col === "provider_id") {
            filters.push((row) => row.provider_id === val);
            (chain as { _providerId?: string })._providerId = String(val);
          } else if (table === "ai_providers" && col === "id") {
            // no-op for update
          }
          return chain;
        },
        in(col: string, vals: unknown[]) {
          if (col === "id") {
            filters.push((row) => vals.includes(row.id));
          }
          return chain;
        },
        maybeSingle: async () => {
          if (table === "ai_routes") {
            return { data: state.route, error: null };
          }
          if (table === "ai_secrets") {
            const ref = (chain as { _secretRef?: string })._secretRef;
            const row = ref ? state.secrets.get(ref) : null;
            return row
              ? { data: { ciphertext: row.ciphertext, nonce: row.nonce }, error: null }
              : { data: null, error: null };
          }
          if (table === "ai_provider_health") {
            const id = (chain as { _providerId?: string })._providerId;
            return {
              data: id ? state.health.get(id) ?? null : null,
              error: null,
            };
          }
          return run();
        },
        then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
          return run().then(resolve, reject);
        },
      };
      return chain;
    },
  };
}

Deno.test("AIRouter falls back to second model after primary failure", async () => {
  const masterKey = crypto.getRandomValues(new Uint8Array(32));
  const sealed1 = await encryptSecret("key-primary", masterKey);
  const sealed2 = await encryptSecret("key-fallback", masterKey);

  const state = {
    route: {
      route_key: "recipe_import_text",
      enabled: true,
      primary_model_id: "m1",
      fallback_model_ids: ["m2", "m3", "m4", "m5"],
      timeout_ms: 5000,
      max_retries: 0,
      temperature: null,
      max_output_tokens: 16,
      structured_schema_key: null,
    },
    models: [
      {
        id: "m1",
        provider_id: "p1",
        display_name: "Primary",
        upstream_model_id: "model-a",
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
      {
        id: "m2",
        provider_id: "p2",
        display_name: "Fallback",
        upstream_model_id: "model-b",
        enabled: true,
        cost_input_per_1m: null,
        cost_output_per_1m: null,
        ai_providers: {
          id: "p2",
          base_url: "https://gateway.example.com/v1",
          secret_ref: "ref2",
          enabled: true,
          request_timeout_ms: 5000,
          max_retries: 0,
          environment: "production",
        },
      },
    ],
    secrets: new Map([
      ["ref1", sealed1],
      ["ref2", sealed2],
    ]),
    health: new Map<string, Row>(),
    usage: [] as Row[],
  };

  // DB mock: fallback list in resolveRoute is sliced in SQL constraint;
  // router also slices — ensure resolve only loads m1+m2 from in().
  const db = mockDb(state) as never;
  const secretStore = new AISecretStore(db, masterKey);

  let calls = 0;
  const fetchImpl: typeof fetch = async (_input, init) => {
    calls += 1;
    const body = JSON.parse(String(init?.body ?? "{}")) as { model?: string };
    if (body.model === "model-a") {
      return new Response(JSON.stringify({ error: "busy" }), { status: 503 });
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "ok-fallback" } }],
        usage: { prompt_tokens: 3, completion_tokens: 1 },
      }),
      { status: 200 },
    );
  };

  const router = new PlatformAIRouter(db as never);
  const result = await router.invoke({
    routeKey: "recipe_import_text",
    messages: [{ role: "user", content: "hi" }],
    requestId: "req-test-1",
    fetchImpl,
    secretStore,
  });

  assertEquals(result.content, "ok-fallback");
  assertEquals(result.modelId, "m2");
  assertEquals(result.attemptedModels.length >= 2, true);
  assertEquals(calls, 2);
  assertEquals(state.usage.length >= 1, true);
  assertEquals(state.usage.at(-1)?.status, "success");
});

Deno.test("AIRouter resolveRoute rejects unknown route", async () => {
  const db = {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({ data: null, error: null }),
      };
    },
  };
  const router = new PlatformAIRouter(db as never);
  await assertRejects(
    () => router.resolveRoute("nope"),
    AppError,
  );
});
