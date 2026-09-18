/**
 * Admin catalog DTO mapping tests (Issue #92).
 * Run: deno test --allow-env supabase/functions/_shared/admin-catalog/
 */

import { assertEquals } from "jsr:@std/assert@1";
import {
  foldMealPlans,
  mapRecipeIngredients,
  mapRecipeNutrition,
  mapRecipeSteps,
  matchesTaxonomyFilter,
  pantryFreshnessPercent,
  persistableSettings,
  recipePayloadToColumns,
  slugify,
} from "./map.ts";

Deno.test("slugify normalizes taxonomy names", () => {
  assertEquals(slugify("Gluten Free"), "gluten_free");
  assertEquals(slugify("  Japanese  "), "japanese");
});

Deno.test("taxonomy filter matches id or display name", () => {
  const lookup = new Map([["japanese", "Japanese"]]);
  assertEquals(matchesTaxonomyFilter("japanese", "Japanese", lookup), true);
  assertEquals(matchesTaxonomyFilter("japanese", "japanese", lookup), true);
  assertEquals(matchesTaxonomyFilter("italian", "Japanese", lookup), false);
  assertEquals(matchesTaxonomyFilter("japanese", undefined, lookup), true);
});

Deno.test("recipe nested jsonb maps to Admin DTO keys", () => {
  assertEquals(
    mapRecipeIngredients([{ name: "Salt", amount: 1, unit: "tsp" }]),
    [{ name: "Salt", quantity: "1", unit: "tsp" }],
  );
  assertEquals(
    mapRecipeSteps([{ order: 2, description: "Stir" }]),
    [{ order: 2, instruction: "Stir" }],
  );
  assertEquals(mapRecipeNutrition({ calories: 10, protein: 1, carbohydrates: 2, fat: 3 }), {
    calories: 10,
    proteinG: 1,
    carbsG: 2,
    fatG: 3,
  });
});

Deno.test("recipe PATCH payload writes schema.org-ish jsonb", () => {
  const cols = recipePayloadToColumns({
    notes: "hello",
    ingredients: [{ name: "Egg", quantity: "2", unit: "" }],
    steps: [{ order: 1, instruction: "Crack" }],
    nutrition: { calories: 70, proteinG: 6, carbsG: 1, fatG: 5 },
  });
  assertEquals(cols.description, "hello");
  assertEquals(cols.ingredients, [{ name: "Egg", amount: "2", unit: "", note: null }]);
  assertEquals(cols.steps, [{
    order: 1,
    description: "Crack",
    image: null,
    timer: null,
  }]);
  assertEquals(cols.nutrition, {
    calories: 70,
    protein: 6,
    fat: 5,
    carbohydrates: 1,
  });
});

Deno.test("pantry freshness: expired=0, missing=100, mid-window scaled", () => {
  const now = Date.parse("2026-09-18T00:00:00Z");
  assertEquals(pantryFreshnessPercent(null, now), 100);
  assertEquals(pantryFreshnessPercent("2026-09-10", now), 0);
  assertEquals(pantryFreshnessPercent("2026-09-25", now), 50);
});

Deno.test("meal plans fold per date with unique titles", () => {
  const folded = foldMealPlans([
    { plan_date: "2026-09-18", meal_type: "breakfast", title: "Oats" },
    { plan_date: "2026-09-18", meal_type: "breakfast", title: "Oats" },
    { plan_date: "2026-09-18", meal_type: "dinner", title: "Soup" },
    { plan_date: "2026-09-19", meal_type: "lunch", title: "Salad" },
  ]);
  assertEquals(folded, [
    { date: "2026-09-18", breakfast: "Oats", lunch: null, dinner: "Soup" },
    { date: "2026-09-19", breakfast: null, lunch: "Salad", dinner: null },
  ]);
});

Deno.test("settings persist strips system diagnostics", () => {
  const stored = persistableSettings({
    general: { appName: "Pestle", supportEmail: "a@b.c", defaultLocale: "en-US", maintenanceMode: true },
    units: { measurementSystem: "imperial", temperatureUnit: "fahrenheit" },
    categories: { allowUserTags: false, requireCuisine: false },
    system: { mockMode: true, apiBaseUrl: "http://evil", logLevel: "debug" },
  });
  assertEquals(stored.general.appName, "Pestle");
  assertEquals("system" in stored, false);
});
