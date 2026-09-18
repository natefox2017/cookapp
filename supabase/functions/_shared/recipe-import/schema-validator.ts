/** SchemaValidator — structural checks on StructuredRecipe. */

import type { StructuredRecipe, ValidationResult } from "./types.ts";

export function validateRecipeSchema(recipe: StructuredRecipe): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (recipe.title != null && typeof recipe.title !== "string") {
    errors.push("title_not_string");
  }
  if (!Array.isArray(recipe.ingredients)) {
    errors.push("ingredients_not_array");
  } else {
    recipe.ingredients.forEach((ing, i) => {
      if (!ing || typeof ing !== "object") {
        errors.push(`ingredient_${i}_invalid`);
        return;
      }
      if (
        ing.quantity != null &&
        (typeof ing.quantity !== "number" || !Number.isFinite(ing.quantity))
      ) {
        errors.push(`ingredient_${i}_quantity_invalid`);
      }
    });
  }

  if (!Array.isArray(recipe.instructions)) {
    errors.push("instructions_not_array");
  } else {
    recipe.instructions.forEach((step, i) => {
      if (!step || typeof step !== "object") {
        errors.push(`instruction_${i}_invalid`);
        return;
      }
      if (typeof step.position !== "number") {
        errors.push(`instruction_${i}_position_invalid`);
      }
    });
  }

  if (
    recipe.confidence == null ||
    typeof recipe.confidence.overall !== "number" ||
    recipe.confidence.overall < 0 ||
    recipe.confidence.overall > 1
  ) {
    warnings.push("confidence_overall_out_of_range");
  }

  if (!Array.isArray(recipe.evidence)) {
    errors.push("evidence_not_array");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
