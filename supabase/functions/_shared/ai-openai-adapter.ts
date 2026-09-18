/** OpenAI-compatible chat completions adapter. */

import { AppError } from "./errors.ts";
import { redactSecrets } from "./ai-ssrf.ts";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: Record<string, unknown>;
};

export type ChatCompletionResult = {
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
  rawStatus: number;
  latencyMs: number;
};

export type ProviderCallOptions = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  /** Injected for tests */
  fetchImpl?: typeof fetch;
};

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export class OpenAICompatibleAdapter {
  constructor(private readonly options: ProviderCallOptions) {}

  async chatCompletion(
    body: ChatCompletionRequest,
  ): Promise<ChatCompletionResult> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    const started = Date.now();
    try {
      const res = await fetchImpl(joinUrl(this.options.baseUrl, "/chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: "error",
      });
      const latencyMs = Date.now() - started;
      const text = await res.text();
      if (!res.ok) {
        const safe = redactSecrets(text).slice(0, 500);
        throw new AppError(
          res.status === 401 || res.status === 403 ? "forbidden" : "internal_error",
          `Provider error ${res.status}: ${safe || res.statusText}`,
          res.status >= 400 && res.status < 500 ? res.status : 502,
          { providerStatus: res.status },
        );
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new AppError("internal_error", "Provider returned non-JSON body", 502);
      }
      const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
      const message = choices?.[0]?.message as Record<string, unknown> | undefined;
      const content = String(message?.content ?? "");
      const usage = parsed.usage as Record<string, unknown> | undefined;
      return {
        content,
        inputTokens: usage?.prompt_tokens != null
          ? Number(usage.prompt_tokens)
          : null,
        outputTokens: usage?.completion_tokens != null
          ? Number(usage.completion_tokens)
          : null,
        rawStatus: res.status,
        latencyMs,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AppError("internal_error", "Provider request timed out", 504, {
          code: "timeout",
        });
      }
      const message = err instanceof Error ? redactSecrets(err.message) : "provider_error";
      throw new AppError("internal_error", message, 502);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Minimal low-cost probe — never send user data. */
  async testConnection(upstreamModelId = "gpt-4o-mini"): Promise<{
    ok: boolean;
    latencyMs: number;
    model: string;
  }> {
    const result = await this.chatCompletion({
      model: upstreamModelId,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
      temperature: 0,
    });
    return {
      ok: true,
      latencyMs: result.latencyMs,
      model: upstreamModelId,
    };
  }
}

export function isRetryableProviderError(err: unknown): boolean {
  if (!(err instanceof AppError)) return false;
  if (err.details && typeof err.details === "object") {
    const code = (err.details as { code?: string }).code;
    if (code === "timeout") return true;
  }
  return err.status === 429 || err.status === 502 || err.status === 503 ||
    err.status === 504;
}
