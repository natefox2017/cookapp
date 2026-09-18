/** RecipeImporter — persist StructuredRecipe into recipes table (Issue #104).
 * Same table for user + system libraries; discriminated by library_kind.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { StructuredRecipe } from "./types.ts";

export type RecipeLibraryKind = "user_owned" | "system_recommended";

export interface ImportRecipeInput {
  /** Required when library_kind = user_owned. Must be null for system_recommended. */
  owner_user_id: string | null;
  library_kind?: RecipeLibraryKind;
  recipe: StructuredRecipe;
  cover_object_key?: string | null;
  import_job_id?: string | null;
  source_url?: string | null;
  source_platform?: string | null;
  created_by_admin_id?: string | null;
  /** System recipes default to draft; caller may pass published after review approve. */
  publish_status?: "draft" | "published" | "archived" | "user";
}

export interface ImportRecipeResult {
  ok: boolean;
  recipe_id?: string;
  error_message?: string;
}

export function mapStructuredToRecipeRow(input: ImportRecipeInput) {
  const {
    recipe,
    owner_user_id,
    cover_object_key,
    library_kind = owner_user_id ? "user_owned" : "system_recommended",
    import_job_id = null,
    source_url = null,
    source_platform = null,
    created_by_admin_id = null,
    publish_status,
  } = input;

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

  const resolvedPublish =
    publish_status ??
    (library_kind === "system_recommended" ? "draft" : "user");

  return {
    user_id: library_kind === "system_recommended" ? null : owner_user_id,
    library_kind,
    publish_status: resolvedPublish,
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
    source_url: source_url ?? recipe.source?.url ?? null,
    source_platform: source_platform ?? recipe.source?.platform ?? null,
    source_attribution: recipe.source?.creator ?? null,
    import_job_id,
    created_by_admin_id,
    published_at: resolvedPublish === "published" ? new Date().toISOString() : null,
  };
}

export async function importRecipe(
  admin: SupabaseClient,
  input: ImportRecipeInput,
): Promise<ImportRecipeResult> {
  const libraryKind = input.library_kind ??
    (input.owner_user_id ? "user_owned" : "system_recommended");

  if (libraryKind === "user_owned" && !input.owner_user_id) {
    return { ok: false, error_message: "destination_user_id required for user library" };
  }
  if (libraryKind === "system_recommended" && input.owner_user_id) {
    return {
      ok: false,
      error_message: "system_recommended recipes must not set destination_user_id",
    };
  }
  if (!input.recipe.title?.trim()) {
    return { ok: false, error_message: "title required" };
  }

  const row = mapStructuredToRecipeRow({ ...input, library_kind: libraryKind });
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
