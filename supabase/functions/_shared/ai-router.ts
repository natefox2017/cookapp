/**
 * AI Platform router contract (Issue #53).
 * Recipe Import (#55) MUST call this interface only — never a second AI client,
 * never hardcoded base URL / API key / model id.
 *
 * When #53 lands, replace StubAIRouter with the real AIRouter implementation.
 */

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

export interface AIRouter {
  completeStructured(request: AIStructuredRequest): Promise<AIStructuredResult>;
}

/** Injectable default: fails closed until AI Platform (#53) is wired. */
export class StubAIRouter implements AIRouter {
  constructor(
    private readonly handler?: (
      request: AIStructuredRequest,
    ) => Promise<AIStructuredResult> | AIStructuredResult,
  ) {}

  async completeStructured(
    request: AIStructuredRequest,
  ): Promise<AIStructuredResult> {
    if (this.handler) {
      return await this.handler(request);
    }
    return {
      ok: false,
      data: null,
      route_key: request.route_key,
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

let defaultRouter: AIRouter = new StubAIRouter();

export function setAIRouter(router: AIRouter): void {
  defaultRouter = router;
}

export function getAIRouter(): AIRouter {
  return defaultRouter;
}
