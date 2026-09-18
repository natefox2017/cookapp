// Admin AI Platform: providers / models / routes / usage / health.
// Auth: custom admin bearer; Owner-only for secrets and provider writes.
// Deploy: supabase functions deploy admin-ai --project-ref semsjyrqjnumpvanibip
// Issue: #53

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import {
  requireAdminSession,
  requireOwnerRole,
} from "../_shared/admin-session.ts";
import { log } from "../_shared/logger.ts";
import {
  AISecretStore,
  assertSecretStoreConfigured,
  newSecretRef,
} from "../_shared/ai-secret-store.ts";
import { validateAiBaseUrl } from "../_shared/ai-ssrf.ts";
import { OpenAICompatibleAdapter } from "../_shared/ai-openai-adapter.ts";
import { AIRouter, limitFallbackModelIds, MAX_FALLBACK_MODELS } from "../_shared/ai-router.ts";
import { summarizeUsageEvents } from "../_shared/ai-usage.ts";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-ai");
  return idx >= 0 ? parts.slice(idx + 1) : parts.slice(-3);
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

function mapProvider(
  row: Record<string, unknown>,
  secretConfigured: boolean,
) {
  return {
    id: row.id,
    name: row.name,
    protocol: row.protocol,
    baseUrl: row.base_url,
    secretConfigured,
    secretRef: null, // never expose secret_ref details to Admin beyond configured flag
    enabled: Boolean(row.enabled),
    requestTimeoutMs: Number(row.request_timeout_ms),
    maxRetries: Number(row.max_retries),
    status: row.status,
    lastHealthCheckAt: row.last_health_check_at ?? null,
    environment: row.environment,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapModel(row: Record<string, unknown>) {
  return {
    id: row.id,
    providerId: row.provider_id,
    displayName: row.display_name,
    upstreamModelId: row.upstream_model_id,
    enabled: Boolean(row.enabled),
    capabilities: row.capabilities ?? { text: true },
    contextWindow: row.context_window ?? null,
    maxOutputTokens: row.max_output_tokens ?? null,
    costInputPer1m: row.cost_input_per_1m != null
      ? Number(row.cost_input_per_1m)
      : null,
    costOutputPer1m: row.cost_output_per_1m != null
      ? Number(row.cost_output_per_1m)
      : null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoute(row: Record<string, unknown>) {
  return {
    id: row.id,
    routeKey: row.route_key,
    primaryModelId: row.primary_model_id ?? null,
    fallbackModelIds: Array.isArray(row.fallback_model_ids)
      ? row.fallback_model_ids
      : [],
    timeoutMs: Number(row.timeout_ms),
    maxRetries: Number(row.max_retries),
    temperature: row.temperature != null ? Number(row.temperature) : null,
    maxOutputTokens: row.max_output_tokens ?? null,
    structuredSchemaKey: row.structured_schema_key ?? null,
    enabled: Boolean(row.enabled),
    reserved: Boolean(row.reserved),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseCapabilities(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== "object") {
    return { text: true };
  }
  const o = raw as Record<string, unknown>;
  return {
    text: Boolean(o.text ?? true),
    vision: Boolean(o.vision ?? false),
    structured_output: Boolean(o.structured_output ?? false),
    tool_calling: Boolean(o.tool_calling ?? false),
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  try {
    const session = await requireAdminSession(req);
    const parts = routeParts(req);
    const method = req.method.toUpperCase();
    const db = createServiceClient();
    const secrets = new AISecretStore(db);
    const resource = (parts[0] ?? "").toLowerCase();
    const id = parts[1];
    const action = (parts[2] ?? "").toLowerCase();

    // -------- Providers --------
    if (resource === "providers" && method === "GET" && !id) {
      const { data, error } = await db
        .from("ai_providers")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new AppError("internal_error", error.message, 500);
      const out = [];
      for (const row of data ?? []) {
        const configured = await secrets.isConfigured(
          (row as Record<string, unknown>).secret_ref as string | null,
        );
        out.push(mapProvider(row as Record<string, unknown>, configured));
      }
      return json(out, 200, publicCorsHeaders);
    }

    if (resource === "providers" && method === "POST" && !id) {
      requireOwnerRole(session.role);
      const body = await readJson(req);
      const name = String(body.name ?? "").trim();
      const protocol = String(body.protocol ?? "openai_compatible").trim();
      const environment =
        String(body.environment ?? "production").trim() === "development"
          ? "development"
          : "production";
      if (!name) {
        throw new AppError("validation_error", "name is required", 400);
      }
      if (protocol !== "openai_compatible") {
        throw new AppError(
          "validation_error",
          "Only openai_compatible protocol is supported in Phase 1",
          400,
        );
      }
      const baseUrl = validateAiBaseUrl(String(body.baseUrl ?? ""), {
        environment,
      });
      const now = new Date().toISOString();
      const payload = {
        name,
        protocol,
        base_url: baseUrl,
        enabled: Boolean(body.enabled ?? true),
        request_timeout_ms: Number(body.requestTimeoutMs ?? 30000),
        max_retries: Number(body.maxRetries ?? 1),
        environment,
        metadata: typeof body.metadata === "object" && body.metadata
          ? body.metadata
          : {},
        updated_at: now,
      };
      const { data, error } = await db
        .from("ai_providers")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        throw new AppError("internal_error", error.message, 500);
      }
      log("info", "ai_provider_created", {
        id: data.id,
        adminId: session.adminId,
      });
      return json(
        mapProvider(data as Record<string, unknown>, false),
        201,
        publicCorsHeaders,
      );
    }

    if (resource === "providers" && method === "GET" && id && !action) {
      const { data, error } = await db
        .from("ai_providers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!data) throw new AppError("not_found", "Provider not found", 404);
      const configured = await secrets.isConfigured(
        (data as Record<string, unknown>).secret_ref as string | null,
      );
      return json(
        mapProvider(data as Record<string, unknown>, configured),
        200,
        publicCorsHeaders,
      );
    }

    if (resource === "providers" && method === "PUT" && id && !action) {
      requireOwnerRole(session.role);
      const body = await readJson(req);
      const { data: existing, error: findErr } = await db
        .from("ai_providers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (findErr) throw new AppError("internal_error", findErr.message, 500);
      if (!existing) throw new AppError("not_found", "Provider not found", 404);

      const environment =
        body.environment != null
          ? String(body.environment).trim() === "development"
            ? "development"
            : "production"
          : String(existing.environment);

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (body.name != null) updates.name = String(body.name).trim();
      if (body.baseUrl != null) {
        updates.base_url = validateAiBaseUrl(String(body.baseUrl), {
          environment: environment as "development" | "production",
        });
      }
      if (body.enabled != null) updates.enabled = Boolean(body.enabled);
      if (body.requestTimeoutMs != null) {
        updates.request_timeout_ms = Number(body.requestTimeoutMs);
      }
      if (body.maxRetries != null) updates.max_retries = Number(body.maxRetries);
      if (body.environment != null) updates.environment = environment;
      if (body.metadata != null && typeof body.metadata === "object") {
        updates.metadata = body.metadata;
      }
      if (body.protocol != null) {
        const protocol = String(body.protocol).trim();
        if (protocol !== "openai_compatible") {
          throw new AppError(
            "validation_error",
            "Only openai_compatible protocol is supported",
            400,
          );
        }
        updates.protocol = protocol;
      }

      const { data, error } = await db
        .from("ai_providers")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!data) throw new AppError("not_found", "Provider not found", 404);
      log("info", "ai_provider_updated", {
        id,
        adminId: session.adminId,
        fields: Object.keys(updates).filter((k) => k !== "updated_at"),
      });
      const configured = await secrets.isConfigured(
        (data as Record<string, unknown>).secret_ref as string | null,
      );
      return json(
        mapProvider(data as Record<string, unknown>, configured),
        200,
        publicCorsHeaders,
      );
    }

    if (resource === "providers" && method === "DELETE" && id && !action) {
      requireOwnerRole(session.role);
      const { data: existing } = await db
        .from("ai_providers")
        .select("id, secret_ref")
        .eq("id", id)
        .maybeSingle();
      if (!existing) throw new AppError("not_found", "Provider not found", 404);
      const secretRef = existing.secret_ref as string | null;
      const { error } = await db.from("ai_providers").delete().eq("id", id);
      if (error) throw new AppError("internal_error", error.message, 500);
      if (secretRef) {
        try {
          await secrets.delete(secretRef);
        } catch {
          // best-effort cleanup
        }
      }
      log("info", "ai_provider_deleted", { id, adminId: session.adminId });
      return json({ ok: true }, 200, publicCorsHeaders);
    }

    // Write-only secret update — never returns plaintext
    if (
      resource === "providers" &&
      id &&
      action === "secret" &&
      method === "PUT"
    ) {
      requireOwnerRole(session.role);
      assertSecretStoreConfigured();
      const body = await readJson(req);
      const apiKey = String(body.apiKey ?? body.secret ?? "").trim();
      if (!apiKey) {
        throw new AppError("validation_error", "apiKey is required", 400);
      }
      const { data: existing, error: findErr } = await db
        .from("ai_providers")
        .select("id, secret_ref")
        .eq("id", id)
        .maybeSingle();
      if (findErr) throw new AppError("internal_error", findErr.message, 500);
      if (!existing) throw new AppError("not_found", "Provider not found", 404);

      const secretRef =
        (existing.secret_ref as string | null) ?? newSecretRef(id);
      await secrets.put(secretRef, apiKey);
      const { data, error } = await db
        .from("ai_providers")
        .update({
          secret_ref: secretRef,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new AppError("internal_error", error.message, 500);
      log("info", "ai_provider_secret_updated", {
        id,
        adminId: session.adminId,
        changed: true,
      });
      return json(
        {
          ok: true,
          secretConfigured: true,
          provider: mapProvider(data as Record<string, unknown>, true),
        },
        200,
        publicCorsHeaders,
      );
    }

    // Test connection via Backend only
    if (
      resource === "providers" &&
      id &&
      action === "test" &&
      method === "POST"
    ) {
      requireOwnerRole(session.role);
      const { data: provider, error } = await db
        .from("ai_providers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!provider) throw new AppError("not_found", "Provider not found", 404);
      const secretRef = provider.secret_ref as string | null;
      if (!secretRef) {
        throw new AppError(
          "validation_error",
          "Provider secret not configured",
          400,
        );
      }
      const env =
        provider.environment === "development" ? "development" : "production";
      const baseUrl = validateAiBaseUrl(String(provider.base_url), {
        environment: env,
      });
      const apiKey = await secrets.getPlaintext(secretRef);
      const body = await readJson(req).catch(() => ({} as Record<string, unknown>));
      let modelId = String(body.upstreamModelId ?? "").trim();
      if (!modelId) {
        const { data: model } = await db
          .from("ai_models")
          .select("upstream_model_id")
          .eq("provider_id", id)
          .eq("enabled", true)
          .order("created_at")
          .limit(1)
          .maybeSingle();
        modelId = String(model?.upstream_model_id ?? "gpt-4o-mini");
      }
      const adapter = new OpenAICompatibleAdapter({
        baseUrl,
        apiKey,
        timeoutMs: Number(provider.request_timeout_ms ?? 15000),
      });
      try {
        const result = await adapter.testConnection(modelId);
        const now = new Date().toISOString();
        await db.from("ai_provider_health").upsert(
          {
            provider_id: id,
            status: "healthy",
            last_success_at: now,
            consecutive_failures: 0,
            circuit_open_until: null,
            updated_at: now,
          },
          { onConflict: "provider_id" },
        );
        await db
          .from("ai_providers")
          .update({
            status: "healthy",
            last_health_check_at: now,
            updated_at: now,
          })
          .eq("id", id);
        return json(
          { ok: true, latencyMs: result.latencyMs, model: result.model },
          200,
          publicCorsHeaders,
        );
      } catch (err) {
        const now = new Date().toISOString();
        const message = err instanceof Error ? err.message.slice(0, 500) : "error";
        await db.from("ai_provider_health").upsert(
          {
            provider_id: id,
            status: "unhealthy",
            last_error_at: now,
            last_error: message,
            consecutive_failures: 1,
            updated_at: now,
          },
          { onConflict: "provider_id" },
        );
        await db
          .from("ai_providers")
          .update({
            status: "unhealthy",
            last_health_check_at: now,
            updated_at: now,
          })
          .eq("id", id);
        throw err;
      }
    }

    // -------- Models --------
    if (resource === "models" && method === "GET" && !id) {
      const url = new URL(req.url);
      const providerId = url.searchParams.get("providerId");
      let query = db.from("ai_models").select("*").order("created_at");
      if (providerId) query = query.eq("provider_id", providerId);
      const { data, error } = await query;
      if (error) throw new AppError("internal_error", error.message, 500);
      return json(
        (data ?? []).map((row) => mapModel(row as Record<string, unknown>)),
        200,
        publicCorsHeaders,
      );
    }

    if (resource === "models" && method === "POST" && !id) {
      requireOwnerRole(session.role);
      const body = await readJson(req);
      const providerId = String(body.providerId ?? "").trim();
      const displayName = String(body.displayName ?? "").trim();
      const upstreamModelId = String(body.upstreamModelId ?? "").trim();
      if (!providerId || !displayName || !upstreamModelId) {
        throw new AppError(
          "validation_error",
          "providerId, displayName, and upstreamModelId are required",
          400,
        );
      }
      const payload = {
        provider_id: providerId,
        display_name: displayName,
        upstream_model_id: upstreamModelId,
        enabled: Boolean(body.enabled ?? true),
        capabilities: parseCapabilities(body.capabilities),
        context_window: body.contextWindow != null
          ? Number(body.contextWindow)
          : null,
        max_output_tokens: body.maxOutputTokens != null
          ? Number(body.maxOutputTokens)
          : null,
        cost_input_per_1m: body.costInputPer1m != null
          ? Number(body.costInputPer1m)
          : null,
        cost_output_per_1m: body.costOutputPer1m != null
          ? Number(body.costOutputPer1m)
          : null,
        metadata: typeof body.metadata === "object" && body.metadata
          ? body.metadata
          : {},
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await db
        .from("ai_models")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        throw new AppError(
          error.code === "23505" ? "conflict" : "internal_error",
          error.message,
          error.code === "23505" ? 409 : 500,
        );
      }
      return json(
        mapModel(data as Record<string, unknown>),
        201,
        publicCorsHeaders,
      );
    }

    if (resource === "models" && method === "PUT" && id) {
      requireOwnerRole(session.role);
      const body = await readJson(req);
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (body.displayName != null) {
        updates.display_name = String(body.displayName).trim();
      }
      if (body.upstreamModelId != null) {
        updates.upstream_model_id = String(body.upstreamModelId).trim();
      }
      if (body.enabled != null) updates.enabled = Boolean(body.enabled);
      if (body.capabilities != null) {
        updates.capabilities = parseCapabilities(body.capabilities);
      }
      if (body.contextWindow !== undefined) {
        updates.context_window = body.contextWindow == null
          ? null
          : Number(body.contextWindow);
      }
      if (body.maxOutputTokens !== undefined) {
        updates.max_output_tokens = body.maxOutputTokens == null
          ? null
          : Number(body.maxOutputTokens);
      }
      if (body.costInputPer1m !== undefined) {
        updates.cost_input_per_1m = body.costInputPer1m == null
          ? null
          : Number(body.costInputPer1m);
      }
      if (body.costOutputPer1m !== undefined) {
        updates.cost_output_per_1m = body.costOutputPer1m == null
          ? null
          : Number(body.costOutputPer1m);
      }
      if (body.metadata != null && typeof body.metadata === "object") {
        updates.metadata = body.metadata;
      }
      const { data, error } = await db
        .from("ai_models")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!data) throw new AppError("not_found", "Model not found", 404);
      return json(
        mapModel(data as Record<string, unknown>),
        200,
        publicCorsHeaders,
      );
    }

    if (resource === "models" && method === "DELETE" && id) {
      requireOwnerRole(session.role);
      const { error, count } = await db
        .from("ai_models")
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!count) throw new AppError("not_found", "Model not found", 404);
      return json({ ok: true }, 200, publicCorsHeaders);
    }

    // -------- Routes --------
    if (resource === "routes" && method === "GET" && !id) {
      const { data, error } = await db
        .from("ai_routes")
        .select("*")
        .order("route_key");
      if (error) throw new AppError("internal_error", error.message, 500);
      return json(
        (data ?? []).map((row) => mapRoute(row as Record<string, unknown>)),
        200,
        publicCorsHeaders,
      );
    }

    if (resource === "routes" && method === "GET" && id) {
      const { data, error } = await db
        .from("ai_routes")
        .select("*")
        .eq("route_key", id)
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!data) throw new AppError("not_found", "Route not found", 404);
      return json(
        mapRoute(data as Record<string, unknown>),
        200,
        publicCorsHeaders,
      );
    }

    if (resource === "routes" && method === "PUT" && id) {
      requireOwnerRole(session.role);
      const body = await readJson(req);
      const fallback = limitFallbackModelIds(
        Array.isArray(body.fallbackModelIds)
          ? body.fallbackModelIds.map((x) => String(x))
          : [],
      );
      if (fallback.length > MAX_FALLBACK_MODELS) {
        throw new AppError(
          "validation_error",
          `At most ${MAX_FALLBACK_MODELS} fallback models allowed`,
          400,
        );
      }
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (body.primaryModelId !== undefined) {
        updates.primary_model_id = body.primaryModelId
          ? String(body.primaryModelId)
          : null;
      }
      if (body.fallbackModelIds !== undefined) {
        updates.fallback_model_ids = fallback;
      }
      if (body.timeoutMs != null) updates.timeout_ms = Number(body.timeoutMs);
      if (body.maxRetries != null) {
        updates.max_retries = Math.min(3, Number(body.maxRetries));
      }
      if (body.temperature !== undefined) {
        updates.temperature = body.temperature == null
          ? null
          : Number(body.temperature);
      }
      if (body.maxOutputTokens !== undefined) {
        updates.max_output_tokens = body.maxOutputTokens == null
          ? null
          : Number(body.maxOutputTokens);
      }
      if (body.structuredSchemaKey !== undefined) {
        updates.structured_schema_key = body.structuredSchemaKey
          ? String(body.structuredSchemaKey)
          : null;
      }
      if (body.enabled != null) updates.enabled = Boolean(body.enabled);

      const { data, error } = await db
        .from("ai_routes")
        .update(updates)
        .eq("route_key", id)
        .select("*")
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!data) throw new AppError("not_found", "Route not found", 404);
      log("info", "ai_route_updated", {
        routeKey: id,
        adminId: session.adminId,
      });
      return json(
        mapRoute(data as Record<string, unknown>),
        200,
        publicCorsHeaders,
      );
    }

    // -------- Usage --------
    if (resource === "usage" && method === "GET") {
      const url = new URL(req.url);
      const limit = Math.min(
        500,
        Math.max(1, Number(url.searchParams.get("limit") ?? 100)),
      );
      const routeKey = url.searchParams.get("routeKey");
      let query = db
        .from("ai_usage_events")
        .select(
          "id, request_id, route_key, provider_id, model_id, final_model_id, status, latency_ms, input_tokens, output_tokens, estimated_cost, retry_count, error_code, attempted_models, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (routeKey) query = query.eq("route_key", routeKey);
      const { data, error } = await query;
      if (error) throw new AppError("internal_error", error.message, 500);
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const summary = summarizeUsageEvents(rows);
      return json(
        {
          summary,
          events: rows.map((row) => ({
            id: row.id,
            requestId: row.request_id,
            routeKey: row.route_key,
            providerId: row.provider_id,
            modelId: row.model_id,
            finalModelId: row.final_model_id,
            status: row.status,
            latencyMs: row.latency_ms,
            inputTokens: row.input_tokens,
            outputTokens: row.output_tokens,
            estimatedCost: row.estimated_cost,
            retryCount: row.retry_count,
            errorCode: row.error_code,
            attemptedModels: row.attempted_models,
            createdAt: row.created_at,
          })),
        },
        200,
        publicCorsHeaders,
      );
    }

    // -------- Health --------
    if (resource === "health" && method === "GET") {
      const { data: providers, error } = await db
        .from("ai_providers")
        .select("id, name, status, last_health_check_at, enabled");
      if (error) throw new AppError("internal_error", error.message, 500);
      const { data: health } = await db.from("ai_provider_health").select("*");
      const healthById = new Map(
        (health ?? []).map((h) => [h.provider_id as string, h]),
      );
      const items = (providers ?? []).map((p) => {
        const h = healthById.get(p.id as string);
        return {
          providerId: p.id,
          name: p.name,
          enabled: p.enabled,
          status: h?.status ?? p.status,
          lastHealthCheckAt: p.last_health_check_at ?? null,
          lastSuccessAt: h?.last_success_at ?? null,
          lastErrorAt: h?.last_error_at ?? null,
          lastError: h?.last_error ?? null,
          consecutiveFailures: h?.consecutive_failures ?? 0,
          circuitOpenUntil: h?.circuit_open_until ?? null,
        };
      });
      return json({ providers: items }, 200, publicCorsHeaders);
    }

    // -------- Resolve (debug / Admin preview of router chain; no provider call) --------
    if (resource === "resolve" && method === "POST") {
      requireOwnerRole(session.role);
      const body = await readJson(req);
      const routeKey = String(body.routeKey ?? "").trim();
      const router = new AIRouter(db);
      const resolution = await router.resolveRoute(routeKey);
      return json(
        {
          routeKey: resolution.routeKey,
          timeoutMs: resolution.timeoutMs,
          maxRetries: resolution.maxRetries,
          models: resolution.modelChain.map((m) => ({
            modelId: m.modelId,
            providerId: m.providerId,
            displayName: m.displayName,
            upstreamModelId: m.upstreamModelId,
            // never include secret or base_url details beyond existence
            secretConfigured: Boolean(m.secretRef),
          })),
        },
        200,
        publicCorsHeaders,
      );
    }

    throw new AppError("not_found", "Unknown admin-ai route", 404);
  } catch (err) {
    return errorResponse(err, publicCorsHeaders);
  }
});
