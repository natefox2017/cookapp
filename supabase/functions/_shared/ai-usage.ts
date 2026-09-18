/** AI usage event recorder — metadata only (no full prompt/response). */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { log } from "./logger.ts";

export type UsageStatus =
  | "success"
  | "error"
  | "timeout"
  | "fallback_exhausted"
  | "circuit_open";

export type UsageEventInput = {
  requestId: string;
  routeKey: string;
  providerId?: string | null;
  modelId?: string | null;
  finalModelId?: string | null;
  status: UsageStatus;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCost?: number | null;
  retryCount?: number;
  errorCode?: string | null;
  attemptedModels?: Array<Record<string, unknown>>;
  userId?: string | null;
  adminId?: string | null;
  sourceJobId?: string | null;
};

export class AIUsageRecorder {
  constructor(private readonly db: SupabaseClient) {}

  async record(event: UsageEventInput): Promise<void> {
    const row = {
      request_id: event.requestId,
      route_key: event.routeKey,
      provider_id: event.providerId ?? null,
      model_id: event.modelId ?? null,
      final_model_id: event.finalModelId ?? null,
      status: event.status,
      latency_ms: event.latencyMs ?? null,
      input_tokens: event.inputTokens ?? null,
      output_tokens: event.outputTokens ?? null,
      estimated_cost: event.estimatedCost ?? null,
      retry_count: event.retryCount ?? 0,
      error_code: event.errorCode ?? null,
      attempted_models: event.attemptedModels ?? [],
      user_id: event.userId ?? null,
      admin_id: event.adminId ?? null,
      source_job_id: event.sourceJobId ?? null,
    };
    const { error } = await this.db.from("ai_usage_events").insert(row);
    if (error) {
      log("warn", "ai_usage_record_failed", {
        requestId: event.requestId,
        message: error.message,
      });
    }
  }
}

export type UsageSummary = {
  requests: number;
  successRate: number;
  errorRate: number;
  fallbackRate: number;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number | null;
  byRoute: Record<string, number>;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
};

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? null;
}

export function summarizeUsageEvents(
  rows: Array<Record<string, unknown>>,
): UsageSummary {
  const requests = rows.length;
  let success = 0;
  let errors = 0;
  let fallbacks = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costSum = 0;
  let costCount = 0;
  const latencies: number[] = [];
  const byRoute: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  const byModel: Record<string, number> = {};

  for (const row of rows) {
    const status = String(row.status ?? "");
    if (status === "success") success += 1;
    else errors += 1;
    const attempted = row.attempted_models;
    if (Array.isArray(attempted) && attempted.length > 1) fallbacks += 1;
    if (typeof row.latency_ms === "number") latencies.push(row.latency_ms);
    if (typeof row.input_tokens === "number") inputTokens += row.input_tokens;
    if (typeof row.output_tokens === "number") outputTokens += row.output_tokens;
    if (typeof row.estimated_cost === "number") {
      costSum += row.estimated_cost;
      costCount += 1;
    }
    const route = String(row.route_key ?? "unknown");
    byRoute[route] = (byRoute[route] ?? 0) + 1;
    const provider = String(row.provider_id ?? "unknown");
    byProvider[provider] = (byProvider[provider] ?? 0) + 1;
    const model = String(row.final_model_id ?? row.model_id ?? "unknown");
    byModel[model] = (byModel[model] ?? 0) + 1;
  }

  latencies.sort((a, b) => a - b);
  return {
    requests,
    successRate: requests ? success / requests : 0,
    errorRate: requests ? errors / requests : 0,
    fallbackRate: requests ? fallbacks / requests : 0,
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    inputTokens,
    outputTokens,
    estimatedCost: costCount ? costSum : null,
    byRoute,
    byProvider,
    byModel,
  };
}
