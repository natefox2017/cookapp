/** RecipeImporter — persist StructuredRecipe into recipes table. */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { StructuredRecipe } from "./types.ts";

export interface ImportRecipeInput {
  owner_user_id: string;
  recipe: StructuredRecipe;
  cover_object_key?: string | null;
}

export interface ImportRecipeResult {
  ok: boolean;
  recipe_id?: string;
  error_message?: string;
}

export function mapStructuredToRecipeRow(input: ImportRecipeInput) {
  const { recipe, owner_user_id, cover_object_key } = input;
  const ingredients = recipe.ingredients.map((ing) => ({
    name: ing.ingredient ?? ing.raw_text ?? "",
    amount: ing.quantity,
    unit: ing.unit,
    note: ing.preparation,
  }));
  const steps = recipe.instructions
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((step) => ({
      order: step.position,
      description: step.text ?? "",
      image: null,
      timer: step.timer_seconds,
    }));

  const cooking_time = recipe.total_time ??
    (recipe.prep_time != null || recipe.cook_time != null
      ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
      : null);

  return {
    user_id: owner_user_id,
    title: recipe.title!.trim(),
    description: recipe.description,
    cover_image: cover_object_key ?? null,
    cuisine: recipe.cuisine,
    category: recipe.categories[0] ?? null,
    tags: recipe.tags,
    ingredients,
    steps,
    nutrition: recipe.nutrition ?? {},
    cooking_time,
    servings: recipe.servings,
  };
}

export async function importRecipe(
  admin: SupabaseClient,
  input: ImportRecipeInput,
): Promise<ImportRecipeResult> {
  if (!input.owner_user_id) {
    return { ok: false, error_message: "destination_user_id required" };
  }
  if (!input.recipe.title?.trim()) {
    return { ok: false, error_message: "title required" };
  }

  const row = mapStructuredToRecipeRow(input);
  const { data, error } = await admin.from("recipes").insert(row).select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error_message: error?.message ?? "insert failed",
    };
  }
  return { ok: true, recipe_id: data.id as string };
}
