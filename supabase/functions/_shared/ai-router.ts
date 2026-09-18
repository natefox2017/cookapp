/**
 * AIRouter — resolve route_key → primary + limited fallback chain.
 * Business code must call by route_key only (never hardcode model names).
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { AppError } from "./errors.ts";
import {
  OpenAICompatibleAdapter,
  isRetryableProviderError,
  type ChatCompletionRequest,
  type ChatCompletionResult,
} from "./ai-openai-adapter.ts";
import { AISecretStore } from "./ai-secret-store.ts";
import { validateAiBaseUrl } from "./ai-ssrf.ts";
import { AIUsageRecorder, type UsageStatus } from "./ai-usage.ts";
import { log } from "./logger.ts";

export const MAX_FALLBACK_MODELS = 3;
export const CIRCUIT_FAILURE_THRESHOLD = 3;
export const CIRCUIT_OPEN_MS = 60_000;

export type RouteResolution = {
  routeKey: string;
  timeoutMs: number;
  maxRetries: number;
  temperature: number | null;
  maxOutputTokens: number | null;
  structuredSchemaKey: string | null;
  modelChain: ResolvedModel[];
};

export type ResolvedModel = {
  modelId: string;
  providerId: string;
  displayName: string;
  upstreamModelId: string;
  baseUrl: string;
  secretRef: string | null;
  providerEnabled: boolean;
  requestTimeoutMs: number;
  maxRetries: number;
  environment: "development" | "production";
  costInputPer1m: number | null;
  costOutputPer1m: number | null;
};

export type RouterInvokeInput = {
  routeKey: string;
  messages: ChatCompletionRequest["messages"];
  requestId?: string;
  userId?: string | null;
  adminId?: string | null;
  sourceJobId?: string | null;
  responseFormat?: Record<string, unknown>;
  /** Test injection */
  fetchImpl?: typeof fetch;
  secretStore?: AISecretStore;
};

export type RouterInvokeResult = {
  requestId: string;
  routeKey: string;
  content: string;
  modelId: string;
  providerId: string;
  upstreamModelId: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  retryCount: number;
  attemptedModels: Array<{
    modelId: string;
    providerId: string;
    errorCode?: string;
  }>;
};

type HealthRow = {
  provider_id: string;
  consecutive_failures: number;
  circuit_open_until: string | null;
  status: string;
};

function estimateCost(
  inputTokens: number | null,
  outputTokens: number | null,
  model: ResolvedModel,
): number | null {
  if (
    (inputTokens == null && outputTokens == null) ||
    (model.costInputPer1m == null && model.costOutputPer1m == null)
  ) {
    return null;
  }
  const inCost = ((inputTokens ?? 0) / 1_000_000) * (model.costInputPer1m ?? 0);
  const outCost = ((outputTokens ?? 0) / 1_000_000) * (model.costOutputPer1m ?? 0);
  return inCost + outCost;
}

export class PlatformAIRouter {
  constructor(
    private readonly db: SupabaseClient,
    private readonly usage = new AIUsageRecorder(db),
    private readonly secrets = new AISecretStore(db),
  ) {}

  /** Load route + ordered model chain (primary then up to MAX_FALLBACK_MODELS). */
  async resolveRoute(routeKey: string): Promise<RouteResolution> {
    const key = String(routeKey ?? "").trim();
    if (!key) {
      throw new AppError("validation_error", "route_key is required", 400);
    }

    const { data: route, error } = await this.db
      .from("ai_routes")
      .select("*")
      .eq("route_key", key)
      .maybeSingle();
    if (error) {
      throw new AppError("internal_error", error.message, 500);
    }
    if (!route) {
      throw new AppError("not_found", `Unknown AI route: ${key}`, 404);
    }
    if (!route.enabled) {
      throw new AppError("forbidden", `AI route disabled: ${key}`, 403);
    }

    const fallbackIds = Array.isArray(route.fallback_model_ids)
      ? (route.fallback_model_ids as string[]).slice(0, MAX_FALLBACK_MODELS)
      : [];
    const orderedIds = [
      ...(route.primary_model_id ? [route.primary_model_id as string] : []),
      ...fallbackIds.filter((id) => id !== route.primary_model_id),
    ];

    if (!orderedIds.length) {
      throw new AppError(
        "validation_error",
        `AI route ${key} has no primary model configured`,
        400,
      );
    }

    const { data: models, error: modelError } = await this.db
      .from("ai_models")
      .select(
        "id, provider_id, display_name, upstream_model_id, enabled, cost_input_per_1m, cost_output_per_1m, ai_providers(id, base_url, secret_ref, enabled, request_timeout_ms, max_retries, environment)",
      )
      .in("id", orderedIds);
    if (modelError) {
      throw new AppError("internal_error", modelError.message, 500);
    }

    const byId = new Map((models ?? []).map((m) => [m.id as string, m]));
    const chain: ResolvedModel[] = [];
    for (const id of orderedIds) {
      const row = byId.get(id);
      if (!row || !row.enabled) continue;
      const providerRaw = row.ai_providers as
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null;
      const provider = Array.isArray(providerRaw) ? providerRaw[0] ?? null : providerRaw;
      if (!provider || !provider.enabled) continue;
      chain.push({
        modelId: row.id as string,
        providerId: row.provider_id as string,
        displayName: row.display_name as string,
        upstreamModelId: row.upstream_model_id as string,
        baseUrl: String(provider.base_url),
        secretRef: (provider.secret_ref as string | null) ?? null,
        providerEnabled: Boolean(provider.enabled),
        requestTimeoutMs: Number(provider.request_timeout_ms ?? 30000),
        maxRetries: Number(provider.max_retries ?? 1),
        environment:
          provider.environment === "development" ? "development" : "production",
        costInputPer1m: row.cost_input_per_1m != null
          ? Number(row.cost_input_per_1m)
          : null,
        costOutputPer1m: row.cost_output_per_1m != null
          ? Number(row.cost_output_per_1m)
          : null,
      });
    }

    if (!chain.length) {
      throw new AppError(
        "validation_error",
        `AI route ${key} has no enabled models/providers`,
        400,
      );
    }

    return {
      routeKey: key,
      timeoutMs: Number(route.timeout_ms ?? 60000),
      maxRetries: Math.min(3, Number(route.max_retries ?? 1)),
      temperature: route.temperature != null ? Number(route.temperature) : null,
      maxOutputTokens: route.max_output_tokens != null
        ? Number(route.max_output_tokens)
        : null,
      structuredSchemaKey: (route.structured_schema_key as string | null) ?? null,
      modelChain: chain,
    };
  }

  async invoke(input: RouterInvokeInput): Promise<RouterInvokeResult> {
    const requestId = input.requestId ?? crypto.randomUUID();
    const resolution = await this.resolveRoute(input.routeKey);
    const secretStore = input.secretStore ?? this.secrets;
    const attempted: RouterInvokeResult["attemptedModels"] = [];
    let retryCount = 0;
    let lastError: unknown;

    for (const model of resolution.modelChain) {
      if (await this.isCircuitOpen(model.providerId)) {
        attempted.push({
          modelId: model.modelId,
          providerId: model.providerId,
          errorCode: "circuit_open",
        });
        continue;
      }

      let apiKey: string;
      try {
        if (!model.secretRef) {
          throw new AppError("validation_error", "Provider secret not configured", 400);
        }
        apiKey = await secretStore.getPlaintext(model.secretRef);
      } catch (err) {
        attempted.push({
          modelId: model.modelId,
          providerId: model.providerId,
          errorCode: "secret_missing",
        });
        lastError = err;
        continue;
      }

      let baseUrl: string;
      try {
        baseUrl = validateAiBaseUrl(model.baseUrl, {
          environment: model.environment,
        });
      } catch (err) {
        attempted.push({
          modelId: model.modelId,
          providerId: model.providerId,
          errorCode: "invalid_base_url",
        });
        lastError = err;
        continue;
      }

      const timeoutMs = Math.min(resolution.timeoutMs, model.requestTimeoutMs);
      const adapter = new OpenAICompatibleAdapter({
        baseUrl,
        apiKey,
        timeoutMs,
        fetchImpl: input.fetchImpl,
      });

      const maxAttempts = Math.min(
        resolution.maxRetries,
        model.maxRetries,
      ) + 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) retryCount += 1;
        try {
          const body: ChatCompletionRequest = {
            model: model.upstreamModelId,
            messages: input.messages,
          };
          if (resolution.temperature != null) body.temperature = resolution.temperature;
          if (resolution.maxOutputTokens != null) {
            body.max_tokens = resolution.maxOutputTokens;
          }
          if (input.responseFormat) body.response_format = input.responseFormat;

          const result = await adapter.chatCompletion(body);
          attempted.push({
            modelId: model.modelId,
            providerId: model.providerId,
          });
          await this.recordSuccess(model.providerId);
          await this.usage.record({
            requestId,
            routeKey: resolution.routeKey,
            providerId: model.providerId,
            modelId: model.modelId,
            finalModelId: model.modelId,
            status: "success",
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            estimatedCost: estimateCost(
              result.inputTokens,
              result.outputTokens,
              model,
            ),
            retryCount,
            attemptedModels: attempted,
            userId: input.userId,
            adminId: input.adminId,
            sourceJobId: input.sourceJobId,
          });

          return {
            requestId,
            routeKey: resolution.routeKey,
            content: result.content,
            modelId: model.modelId,
            providerId: model.providerId,
            upstreamModelId: model.upstreamModelId,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            retryCount,
            attemptedModels: attempted,
          };
        } catch (err) {
          lastError = err;
          const errorCode = err instanceof AppError
            ? err.code
            : "provider_error";
          attempted.push({
            modelId: model.modelId,
            providerId: model.providerId,
            errorCode,
          });
          await this.recordFailure(model.providerId, err);
          if (!isRetryableProviderError(err) || attempt + 1 >= maxAttempts) {
            break;
          }
        }
      }
    }

    const status: UsageStatus = attempted.some((a) => a.errorCode === "circuit_open") &&
        attempted.every((a) => a.errorCode === "circuit_open")
      ? "circuit_open"
      : "fallback_exhausted";

    await this.usage.record({
      requestId,
      routeKey: resolution.routeKey,
      status,
      retryCount,
      errorCode: lastError instanceof AppError ? lastError.code : "fallback_exhausted",
      attemptedModels: attempted,
      userId: input.userId,
      adminId: input.adminId,
      sourceJobId: input.sourceJobId,
    });

    log("warn", "ai_router_fallback_exhausted", {
      requestId,
      routeKey: resolution.routeKey,
      attempts: attempted.length,
    });

    if (lastError instanceof AppError) throw lastError;
    throw new AppError(
      "internal_error",
      `AI route ${resolution.routeKey} exhausted primary and fallback models`,
      502,
      { requestId, attemptedModels: attempted },
    );
  }

  private async isCircuitOpen(providerId: string): Promise<boolean> {
    const { data } = await this.db
      .from("ai_provider_health")
      .select("circuit_open_until")
      .eq("provider_id", providerId)
      .maybeSingle();
    if (!data?.circuit_open_until) return false;
    return new Date(data.circuit_open_until as string).getTime() > Date.now();
  }

  private async recordSuccess(providerId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.from("ai_provider_health").upsert(
      {
        provider_id: providerId,
        status: "healthy",
        last_success_at: now,
        consecutive_failures: 0,
        circuit_open_until: null,
        updated_at: now,
      },
      { onConflict: "provider_id" },
    );
    await this.db
      .from("ai_providers")
      .update({ status: "healthy", last_health_check_at: now, updated_at: now })
      .eq("id", providerId);
  }

  private async recordFailure(providerId: string, err: unknown): Promise<void> {
    const now = new Date();
    const message = err instanceof Error ? err.message.slice(0, 500) : "error";
    const { data: existing } = await this.db
      .from("ai_provider_health")
      .select("consecutive_failures")
      .eq("provider_id", providerId)
      .maybeSingle();
    const failures = Number((existing as HealthRow | null)?.consecutive_failures ?? 0) + 1;
    const circuitOpenUntil = failures >= CIRCUIT_FAILURE_THRESHOLD
      ? new Date(now.getTime() + CIRCUIT_OPEN_MS).toISOString()
      : null;
    const status = failures >= CIRCUIT_FAILURE_THRESHOLD
      ? "unhealthy"
      : "degraded";
    await this.db.from("ai_provider_health").upsert(
      {
        provider_id: providerId,
        status,
        last_error_at: now.toISOString(),
        last_error: message,
        consecutive_failures: failures,
        circuit_open_until: circuitOpenUntil,
        updated_at: now.toISOString(),
      },
      { onConflict: "provider_id" },
    );
    await this.db
      .from("ai_providers")
      .update({
        status,
        last_health_check_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", providerId);
  }

  /** Recipe Import (#55) entrypoint — never expose provider keys to callers. */
  async completeStructured(
    request: {
      route_key: string;
      input: unknown;
      schema_key?: string;
      source_job_id?: string;
      prompt_version?: string;
    },
    runtime?: { fetchImpl?: typeof fetch; secretStore?: AISecretStore },
  ): Promise<{
    ok: boolean;
    data: unknown | null;
    route_key: string;
    provider_id: string | null;
    model_id: string | null;
    prompt_version: string | null;
    schema_version: string | null;
    latency_ms: number;
    error_code?: string;
    error_message?: string;
  }> {
    const input = request.input;
    let userContent: string;
    if (typeof input === "string") userContent = input;
    else {
      try { userContent = JSON.stringify(input); }
      catch { userContent = String(input); }
    }
    const started = Date.now();
    try {
      const result = await this.invoke({
        routeKey: String(request.route_key),
        messages: [{ role: "user", content: userContent }],
        requestId: request.source_job_id,
        responseFormat: { type: "json_object" },
        fetchImpl: runtime?.fetchImpl,
        secretStore: runtime?.secretStore,
        sourceJobId: request.source_job_id,
      });
      let data: unknown = result.content;
      if (typeof result.content === "string") {
        try { data = JSON.parse(result.content); } catch { data = result.content; }
      }
      return {
        ok: true,
        data,
        route_key: String(request.route_key),
        provider_id: result.providerId ?? null,
        model_id: result.modelId ?? null,
        prompt_version: request.prompt_version ?? null,
        schema_version: request.schema_key ?? null,
        latency_ms: Date.now() - started,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code ?? "AI_ROUTER_ERROR";
      return {
        ok: false,
        data: null,
        route_key: String(request.route_key),
        provider_id: null,
        model_id: null,
        prompt_version: request.prompt_version ?? null,
        schema_version: request.schema_key ?? null,
        latency_ms: Date.now() - started,
        error_code: code,
        error_message: message,
      };
    }
  }
}

/** Pure helper for unit tests — enforce fallback list length. */
export function limitFallbackModelIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))].slice(0, MAX_FALLBACK_MODELS);
}

/** Pure helper — decide whether another model should be tried. */
export function shouldTryNextModel(opts: {
  attemptIndex: number;
  chainLength: number;
  lastRetryable: boolean;
  retriesUsedOnModel: number;
  maxRetriesOnModel: number;
}): boolean {
  if (opts.attemptIndex + 1 >= opts.chainLength) return false;
  // Always allow next model after model-level retries exhausted or non-retryable
  if (!opts.lastRetryable) return true;
  return opts.retriesUsedOnModel >= opts.maxRetriesOnModel;
}


// --- Recipe Import port (Issue #55) ---

export type AIRouteKey =
  | "recipe_import_text"
  | "recipe_import_vision"
  | "recipe_quality_check"
  | "recipe_dedup_similarity"
  | "assistant_default"
  | "assistant_vision";

export interface AIStructuredRequest {
  route_key: AIRouteKey | string;
  input: unknown;
  schema_key?: string;
  source_job_id?: string;
  prompt_version?: string;
}

export interface AIStructuredResult {
  ok: boolean;
  data: unknown | null;
  route_key: string;
  provider_id: string | null;
  model_id: string | null;
  prompt_version: string | null;
  schema_version: string | null;
  latency_ms: number;
  error_code?: string;
  error_message?: string;
}

/** Port used by Recipe Import — PlatformAIRouter and StubAIRouter both satisfy this. */
export interface AIRouter {
  completeStructured(request: AIStructuredRequest): Promise<AIStructuredResult>;
}

export class StubAIRouter implements AIRouter {
  constructor(
    private readonly handler?: (
      request: AIStructuredRequest,
    ) => Promise<AIStructuredResult> | AIStructuredResult,
  ) {}

  async completeStructured(
    request: AIStructuredRequest,
  ): Promise<AIStructuredResult> {
    if (this.handler) return await this.handler(request);
    return {
      ok: false,
      data: null,
      route_key: String(request.route_key),
      provider_id: null,
      model_id: null,
      prompt_version: request.prompt_version ?? null,
      schema_version: request.schema_key ?? null,
      latency_ms: 0,
      error_code: "AI_PLATFORM_UNAVAILABLE",
      error_message:
        "AIRouter not configured. Wire AI Platform (#53) before live parse.",
    };
  }
}

let defaultRouter: AIRouter | null = null;

export function setAIRouter(router: AIRouter): void {
  if (router instanceof StubAIRouter) {
    throw new Error("StubAIRouter is test-only and cannot be installed as the default router");
  }
  defaultRouter = router;
}

export function getAIRouter(): AIRouter {
  if (!defaultRouter) {
    throw new Error(
      "AIRouter is not configured. Inject PlatformAIRouter(serviceClient) in production; StubAIRouter is test-only.",
    );
  }
  return defaultRouter;
}

export function resetAIRouter(): void {
  defaultRouter = null;
}
