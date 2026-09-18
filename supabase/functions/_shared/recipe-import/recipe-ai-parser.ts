/**
 * RecipeAIParser — calls AIRouter by route_key only (no direct provider client).
 */

import { getAIRouter, type AIRouter } from "../ai-router.ts";
import {
  applyAntiHallucination,
  hasCriticalGaps,
} from "./anti-hallucination.ts";
import type { NormalizedContent, StructuredRecipe } from "./types.ts";
import { emptyStructuredRecipe, PROMPT_VERSION, SCHEMA_VERSION } from "./types.ts";

export interface ParseResult {
  ok: boolean;
  recipe: StructuredRecipe;
  route_key: string;
  provider_id: string | null;
  model_id: string | null;
  prompt_version: string;
  schema_version: string;
  used_deterministic_only: boolean;
  error_code?: string;
  error_message?: string;
}

function coerceAiRecipe(data: unknown): Partial<StructuredRecipe> | null {
  if (!data || typeof data !== "object") return null;
  return data as Partial<StructuredRecipe>;
}

export async function parseRecipeWithAI(
  normalized: NormalizedContent,
  opts: {
    jobId?: string;
    router?: AIRouter;
    /** When true, skip AI if JSON-LD already has title+ingredients+instructions. */
    skipAiWhenDeterministicComplete?: boolean;
  } = {},
): Promise<ParseResult> {
  const route_key = normalized.image_candidates.length > 0 && !normalized.text
    ? "recipe_import_vision"
    : "recipe_import_text";

  const deterministic = normalized.deterministic_recipe;
  const deterministicComplete = !!deterministic &&
    !hasCriticalGaps(deterministic).length;

  if (
    opts.skipAiWhenDeterministicComplete !== false &&
    deterministicComplete
  ) {
    return {
      ok: true,
      recipe: deterministic!,
      route_key,
      provider_id: null,
      model_id: null,
      prompt_version: PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      used_deterministic_only: true,
    };
  }

  const router = opts.router ?? getAIRouter();
  const aiResult = await router.completeStructured({
    route_key,
    schema_key: SCHEMA_VERSION,
    prompt_version: PROMPT_VERSION,
    source_job_id: opts.jobId,
    input: {
      text: normalized.text,
      json_ld: normalized.json_ld_recipe,
      source_type: normalized.source_type,
      canonical_url: normalized.canonical_url,
      image_candidates: normalized.image_candidates,
    },
  });

  if (!aiResult.ok) {
    // Fall back to deterministic partial if present
    if (deterministic) {
      return {
        ok: true,
        recipe: deterministic,
        route_key,
        provider_id: aiResult.provider_id,
        model_id: aiResult.model_id,
        prompt_version: aiResult.prompt_version ?? PROMPT_VERSION,
        schema_version: aiResult.schema_version ?? SCHEMA_VERSION,
        used_deterministic_only: true,
        error_message: aiResult.error_message,
      };
    }
    return {
      ok: false,
      recipe: emptyStructuredRecipe({
        source: {
          url: normalized.canonical_url,
          platform: normalized.source_type,
          creator: null,
          published_at: null,
        },
      }),
      route_key,
      provider_id: aiResult.provider_id,
      model_id: aiResult.model_id,
      prompt_version: aiResult.prompt_version ?? PROMPT_VERSION,
      schema_version: aiResult.schema_version ?? SCHEMA_VERSION,
      used_deterministic_only: false,
      error_code: "AI_PARSE_FAILED",
      error_message: aiResult.error_message ?? "AI parse failed",
    };
  }

  const merged = applyAntiHallucination(
    deterministic,
    coerceAiRecipe(aiResult.data),
    { allowInferred: true },
  );

  // Confidence: prefer AI overall if provided, else recompute lightly
  const aiRecipe = coerceAiRecipe(aiResult.data);
  if (aiRecipe?.confidence?.overall != null) {
    merged.confidence.overall = Number(aiRecipe.confidence.overall);
  }

  return {
    ok: true,
    recipe: merged,
    route_key,
    provider_id: aiResult.provider_id,
    model_id: aiResult.model_id,
    prompt_version: aiResult.prompt_version ?? PROMPT_VERSION,
    schema_version: aiResult.schema_version ?? SCHEMA_VERSION,
    used_deterministic_only: false,
  };
}
