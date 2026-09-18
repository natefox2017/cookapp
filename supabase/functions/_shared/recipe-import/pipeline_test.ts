/**
 * Unit tests for Recipe Import pipeline core (Issue #55).
 * Run: deno test --allow-env supabase/functions/_shared/recipe-import/
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import { StubAIRouter } from "../ai-router.ts";
import { extractJsonLdRecipes, extractContent } from "./content-extractor.ts";
import { resolveSource } from "./source-resolver.ts";
import { normalizeContent } from "./normalizer.ts";
import {
  applyAntiHallucination,
  hasCriticalGaps,
  structuredFromJsonLd,
} from "./anti-hallucination.ts";
import { validateRecipeSchema } from "./schema-validator.ts";
import { validateRecipeQuality } from "./quality-validator.ts";
import {
  detectDuplicate,
  MemoryDuplicateLookup,
  recipeContentFingerprint,
} from "./duplicate-detector.ts";
import { parseRecipeWithAI } from "./recipe-ai-parser.ts";
import { emptyStructuredRecipe, STAGE_ORDER, stageIndex } from "./types.ts";
import { mapStructuredToRecipeRow } from "./recipe-importer.ts";

const SAMPLE_HTML = `<!doctype html>
<html><head>
<title>Tomato Pasta</title>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Tomato Pasta",
  "description": "Simple pasta",
  "recipeYield": "4",
  "prepTime": "PT10M",
  "cookTime": "PT20M",
  "recipeIngredient": ["200g pasta", "3 tomatoes", "olive oil"],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Boil water"},
    {"@type": "HowToStep", "text": "Cook pasta"},
    {"@type": "HowToStep", "text": "Mix with tomatoes"}
  ]
}
</script>
</head><body><h1>Tomato Pasta</h1><p>Yum</p></body></html>`;

Deno.test("SourceResolver detects platforms", () => {
  assertEquals(
    resolveSource({ source_url: "https://www.tiktok.com/@x/video/1" }).source_type,
    "tiktok",
  );
  assertEquals(
    resolveSource({ source_url: "https://www.instagram.com/p/abc/" }).source_type,
    "instagram",
  );
  assertEquals(
    resolveSource({ source_url: "https://youtu.be/abc123" }).source_type,
    "youtube",
  );
  assertEquals(
    resolveSource({ source_url: "https://www.xiaohongshu.com/explore/1" })
      .source_type,
    "xiaohongshu",
  );
  assertEquals(
    resolveSource({ source_url: "https://example.com/recipe" }).source_type,
    "web",
  );
  assertEquals(
    resolveSource({ source_text: "1 cup flour\nmix well" }).source_type,
    "text",
  );
});

Deno.test("extract priority: JSON-LD Recipe before free text", async () => {
  const recipes = extractJsonLdRecipes(SAMPLE_HTML);
  assertEquals(recipes.length, 1);
  assertEquals((recipes[0] as Record<string, unknown>).name, "Tomato Pasta");

  const extracted = await extractContent({
    source_type: "web",
    source_url: "https://example.com/pasta",
    htmlOverride: SAMPLE_HTML,
  });
  assertEquals(extracted.json_ld_recipes.length, 1);
  assertStringIncludes(extracted.extract_notes.join(","), "json_ld_recipe_found");

  const normalized = normalizeContent(extracted);
  assertExists(normalized.deterministic_recipe);
  assertEquals(normalized.deterministic_recipe!.title, "Tomato Pasta");
  assertEquals(normalized.deterministic_recipe!.ingredients.length, 3);
  assertEquals(normalized.deterministic_recipe!.instructions.length, 3);
});

Deno.test("anti-hallucination: missing stays null; inferred flagged", () => {
  const base = emptyStructuredRecipe({
    title: "Soup",
    ingredients: [],
    instructions: [],
    field_states: { title: "present", ingredients: "missing" },
    evidence: [{ field: "title", source_type: "json_ld", source_excerpt: "Soup" }],
  });

  const merged = applyAntiHallucination(base, {
    title: "HALLUCINATED TITLE SHOULD NOT WIN",
    ingredients: [
      {
        raw_text: "1 cup invented spice",
        quantity: 1,
        unit: "cup",
        ingredient: "invented spice",
        preparation: null,
      },
    ],
    instructions: null as unknown as [],
  }, { allowInferred: true });

  assertEquals(merged.title, "Soup"); // deterministic wins
  assertEquals(merged.field_states?.ingredients, "inferred");
  assertEquals(merged.ingredients[0]?.state, "inferred");
  assertEquals(
    merged.evidence.some((e) => e.source_type === "ai_inferred"),
    true,
  );

  const strict = applyAntiHallucination(base, {
    ingredients: [
      {
        raw_text: "secret",
        quantity: null,
        unit: null,
        ingredient: "secret",
        preparation: null,
      },
    ],
  }, { allowInferred: false });
  assertEquals(strict.ingredients.length, 0);
  assertEquals(strict.field_states?.ingredients, "missing");
});

Deno.test("schema + quality validation gates", () => {
  const good = structuredFromJsonLd(
    {
      "@type": "Recipe",
      name: "Tomato Pasta",
      recipeIngredient: ["pasta"],
      recipeInstructions: ["boil"],
    },
    "https://example.com/pasta",
    "web",
  );
  const schema = validateRecipeSchema(good);
  assertEquals(schema.ok, true);

  const quality = validateRecipeQuality(good, { confidenceThreshold: 0.5 });
  assertEquals(quality.ok, true);

  const bad = emptyStructuredRecipe();
  assertEquals(hasCriticalGaps(bad).length >= 3, true);
  const q2 = validateRecipeQuality(bad, { confidenceThreshold: 0.9 });
  assertEquals(q2.needs_review, true);
  assertEquals(q2.reasons.includes("missing_title"), true);
});

Deno.test("duplicate exact URL blocks recreate semantics", async () => {
  const recipe = emptyStructuredRecipe({
    title: "A",
    ingredients: [{
      raw_text: "x",
      quantity: null,
      unit: null,
      ingredient: "x",
      preparation: null,
    }],
    instructions: [{ position: 1, text: "y", timer_seconds: null }],
  });
  const lookup = new MemoryDuplicateLookup([
    {
      job_id: "job-1",
      recipe_id: "recipe-1",
      canonical_url: "https://example.com/pasta",
      fingerprint: recipeContentFingerprint(recipe),
    },
  ]);

  const exact = await detectDuplicate({
    canonical_url: "https://example.com/pasta",
    source_type: "web",
    source_external_id: null,
    recipe,
    exclude_job_id: "job-2",
    lookup,
  });
  assertEquals(exact.status, "exact");
  assertEquals(exact.match_job_id, "job-1");

  const none = await detectDuplicate({
    canonical_url: "https://example.com/other",
    source_type: "web",
    source_external_id: null,
    recipe: emptyStructuredRecipe({ title: "Other" }),
    exclude_job_id: "job-2",
    lookup,
  });
  assertEquals(none.status, "none");
});

Deno.test("retry-from-stage ordering is stable", () => {
  assertEquals(stageIndex("resolve"), 0);
  assertEquals(stageIndex("parse") > stageIndex("extract"), true);
  assertEquals(stageIndex("import") < stageIndex("done"), true);
  assertEquals(STAGE_ORDER.includes("validate"), true);
});

Deno.test("RecipeAIParser prefers deterministic JSON-LD over AI", async () => {
  const extracted = await extractContent({
    source_type: "web",
    source_url: "https://example.com/pasta",
    htmlOverride: SAMPLE_HTML,
  });
  const normalized = normalizeContent(extracted);

  let aiCalled = false;
  const router = new StubAIRouter(() => {
    aiCalled = true;
    return {
      ok: true,
      data: { title: "AI SHOULD NOT BE CALLED" },
      route_key: "recipe_import_text",
      provider_id: "test",
      model_id: "test-model",
      prompt_version: "v",
      schema_version: "s",
      latency_ms: 1,
    };
  });

  const parsed = await parseRecipeWithAI(normalized, { router });
  assertEquals(parsed.ok, true);
  assertEquals(parsed.used_deterministic_only, true);
  assertEquals(parsed.recipe.title, "Tomato Pasta");
  assertEquals(aiCalled, false);
});

Deno.test("RecipeAIParser uses route_key via AIRouter (no second client)", async () => {
  const normalized = normalizeContent({
    source_type: "text",
    source_url: null,
    canonical_url: null,
    source_external_id: null,
    page_title: null,
    page_text: "Flour and water. Mix. Bake.",
    caption: null,
    transcript: null,
    metadata: {},
    json_ld_recipes: [],
    image_candidates: [],
    fetch_ok: true,
    extract_notes: [],
  });

  const router = new StubAIRouter((req) => {
    assertEquals(req.route_key, "recipe_import_text");
    return {
      ok: true,
      data: {
        title: "Bread",
        ingredients: [{
          raw_text: "flour",
          quantity: null,
          unit: null,
          ingredient: "flour",
          preparation: null,
        }],
        instructions: [{ position: 1, text: "Mix", timer_seconds: null }],
        confidence: { overall: 0.8, per_field: {} },
        evidence: [],
      },
      route_key: req.route_key,
      provider_id: "stub-provider",
      model_id: "stub-model",
      prompt_version: "p1",
      schema_version: "recipe_import_v1",
      latency_ms: 2,
    };
  });

  const parsed = await parseRecipeWithAI(normalized, { router });
  assertEquals(parsed.ok, true);
  assertEquals(parsed.route_key, "recipe_import_text");
  assertEquals(parsed.provider_id, "stub-provider");
  assertEquals(parsed.recipe.title, "Bread");
  assertEquals(parsed.recipe.field_states?.title, "inferred");
});

Deno.test("SSRF blocked hosts fail extract", async () => {
  const extracted = await extractContent({
    source_type: "web",
    source_url: "https://127.0.0.1/secret",
  });
  assertEquals(extracted.fetch_ok, false);
  assertEquals(
    extracted.extract_notes.some((n) => n.startsWith("ssrf_blocked")),
    true,
  );
});

Deno.test("importer maps structured recipe to recipes row shape", () => {
  const recipe = structuredFromJsonLd(
    {
      "@type": "Recipe",
      name: "Tomato Pasta",
      recipeIngredient: ["pasta"],
      recipeInstructions: ["boil"],
      totalTime: "PT30M",
    },
    "https://example.com/pasta",
    "web",
  );
  const row = mapStructuredToRecipeRow({
    owner_user_id: "00000000-0000-0000-0000-000000000001",
    recipe,
  });
  assertEquals(row.title, "Tomato Pasta");
  assertEquals(row.ingredients.length, 1);
  assertEquals(row.steps.length, 1);
  assertEquals(row.cooking_time, 30);
});
