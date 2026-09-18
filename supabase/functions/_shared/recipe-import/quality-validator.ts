/** RecipeQualityValidator — auto-import vs needs_review gates. */

import {
  hasCriticalGaps,
  hasInferredCritical,
} from "./anti-hallucination.ts";
import type { QualityResult, StructuredRecipe } from "./types.ts";

export function defaultConfidenceThreshold(): number {
  const raw = Deno.env.get("RECIPE_IMPORT_CONFIDENCE_THRESHOLD");
  if (raw == null || raw === "") return 0.75;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.75;
}

export function validateRecipeQuality(
  recipe: StructuredRecipe,
  opts: { confidenceThreshold?: number } = {},
): QualityResult {
  const threshold = opts.confidenceThreshold ?? defaultConfidenceThreshold();
  const reasons: string[] = [];
  const gaps = hasCriticalGaps(recipe);
  reasons.push(...gaps);

  const overall = recipe.confidence?.overall ?? 0;
  if (overall < threshold) {
    reasons.push("low_confidence");
  }
  if (hasInferredCritical(recipe)) {
    reasons.push("inferred_critical_fields");
  }

  // Quantity/unit conflict heuristic
  for (const ing of recipe.ingredients) {
    if (ing.quantity != null && ing.quantity < 0) {
      reasons.push("ingredient_quantity_conflict");
      break;
    }
    if (ing.quantity != null && !ing.unit && !ing.ingredient) {
      reasons.push("ingredient_parse_conflict");
      break;
    }
  }

  const needs_review = reasons.length > 0;
  const ok = gaps.length === 0;

  return {
    ok,
    needs_review,
    reasons,
    overall_confidence: overall,
  };
}
