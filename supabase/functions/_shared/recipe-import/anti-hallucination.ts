/**
 * Anti-hallucination rules (Notion SoT):
 * - Missing critical fields → null / missing (never invent)
 * - Inferred values must be flagged inferred
 * - Insufficient evidence → Needs Review
 */

import type {
  FieldState,
  StructuredIngredient,
  StructuredInstruction,
  StructuredRecipe,
} from "./types.ts";
import { emptyStructuredRecipe } from "./types.ts";

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseDurationMinutes(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = asString(v);
  if (!s) return null;
  // ISO-8601 duration PT1H30M
  const iso = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (iso) {
    const h = Number(iso[1] ?? 0);
    const m = Number(iso[2] ?? 0);
    const sec = Number(iso[3] ?? 0);
    return h * 60 + m + Math.round(sec / 60);
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mapIngredient(raw: unknown): StructuredIngredient {
  if (typeof raw === "string") {
    return {
      raw_text: raw.trim() || null,
      quantity: null,
      unit: null,
      ingredient: raw.trim() || null,
      preparation: null,
      state: raw.trim() ? "present" : "missing",
    };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const name = asString(o.name ?? o.ingredient);
    const rawText = asString(o.raw_text) ?? name;
    return {
      raw_text: rawText,
      quantity: asNumber(o.quantity ?? o.amount),
      unit: asString(o.unit),
      ingredient: name,
      preparation: asString(o.preparation ?? o.note),
      state: name || rawText ? "present" : "missing",
    };
  }
  return {
    raw_text: null,
    quantity: null,
    unit: null,
    ingredient: null,
    preparation: null,
    state: "missing",
  };
}

function mapInstruction(raw: unknown, index: number): StructuredInstruction {
  if (typeof raw === "string") {
    return {
      position: index + 1,
      text: raw.trim() || null,
      timer_seconds: null,
      state: raw.trim() ? "present" : "missing",
    };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const text = asString(o.text ?? o.description);
    return {
      position: asNumber(o.position ?? o.order) ?? index + 1,
      text,
      timer_seconds: asNumber(o.timer_seconds ?? o.timer),
      state: text ? "present" : "missing",
    };
  }
  return {
    position: index + 1,
    text: null,
    timer_seconds: null,
    state: "missing",
  };
}

/** Map schema.org Recipe JSON-LD → StructuredRecipe (deterministic, no invention). */
export function structuredFromJsonLd(
  node: Record<string, unknown>,
  sourceUrl: string | null,
  platform: StructuredRecipe["source"]["platform"],
): StructuredRecipe {
  const recipeIngredients = node.recipeIngredient;
  const ingredients: StructuredIngredient[] = Array.isArray(recipeIngredients)
    ? recipeIngredients.map(mapIngredient)
    : [];

  let instructions: StructuredInstruction[] = [];
  const ri = node.recipeInstructions;
  if (Array.isArray(ri)) {
    instructions = ri.map((step, i) => {
      if (step && typeof step === "object") {
        const o = step as Record<string, unknown>;
        if (String(o["@type"] ?? "").toLowerCase() === "howtosection") {
          const items = Array.isArray(o.itemListElement) ? o.itemListElement : [];
          return items.map((it, j) => mapInstruction(it, i + j));
        }
      }
      return [mapInstruction(step, i)];
    }).flat();
  } else if (typeof ri === "string") {
    instructions = ri.split(/\n+/).map((line, i) => mapInstruction(line, i));
  }

  const title = asString(node.name);
  const description = asString(node.description);
  const servingsRaw = node.recipeYield ?? node.yield;
  let servings: number | null = null;
  if (typeof servingsRaw === "number") servings = servingsRaw;
  else if (typeof servingsRaw === "string") {
    const m = servingsRaw.match(/(\d+)/);
    servings = m ? Number(m[1]) : null;
  }

  const field_states: Record<string, FieldState> = {
    title: title ? "present" : "missing",
    description: description ? "present" : "missing",
    servings: servings != null ? "present" : "missing",
    ingredients: ingredients.length ? "present" : "missing",
    instructions: instructions.length ? "present" : "missing",
  };

  const evidence: StructuredRecipe["evidence"] = [];
  if (title) {
    evidence.push({
      field: "title",
      source_type: "json_ld",
      source_excerpt: title,
    });
  }
  if (ingredients.length) {
    evidence.push({
      field: "ingredients",
      source_type: "json_ld",
      source_excerpt: `${ingredients.length} items`,
    });
  }
  if (instructions.length) {
    evidence.push({
      field: "instructions",
      source_type: "json_ld",
      source_excerpt: `${instructions.length} steps`,
    });
  }

  const presentCritical =
    (title ? 1 : 0) + (ingredients.length ? 1 : 0) + (instructions.length ? 1 : 0);
  const overall = presentCritical / 3;

  return emptyStructuredRecipe({
    title,
    description,
    servings,
    prep_time: parseDurationMinutes(node.prepTime),
    cook_time: parseDurationMinutes(node.cookTime),
    total_time: parseDurationMinutes(node.totalTime),
    ingredients,
    instructions,
    cuisine: asString(node.recipeCuisine),
    categories: Array.isArray(node.recipeCategory)
      ? node.recipeCategory.map(String)
      : asString(node.recipeCategory)
      ? [String(node.recipeCategory)]
      : [],
    tags: Array.isArray(node.keywords)
      ? node.keywords.map(String)
      : typeof node.keywords === "string"
      ? node.keywords.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    nutrition: null,
    source: {
      url: sourceUrl,
      platform,
      creator: asString(
        (node.author as Record<string, unknown> | undefined)?.name ?? node.author,
      ),
      published_at: asString(node.datePublished),
    },
    confidence: {
      overall,
      per_field: {
        title: title ? 1 : 0,
        ingredients: ingredients.length ? 1 : 0,
        instructions: instructions.length ? 1 : 0,
      },
    },
    evidence,
    field_states,
  });
}

/**
 * Merge AI output onto deterministic base without allowing silent invention.
 * - Fields present in base stay (AI may only normalize wording when evidence exists)
 * - AI values for missing fields must be marked inferred OR dropped to null
 * - If AI invents ingredients/instructions with no source evidence → strip + flag
 */
export function applyAntiHallucination(
  base: StructuredRecipe | null,
  ai: Partial<StructuredRecipe> | null,
  opts: { allowInferred?: boolean } = {},
): StructuredRecipe {
  const allowInferred = opts.allowInferred ?? true;
  const out = emptyStructuredRecipe({
    ...(base ?? {}),
    source: { ...(base?.source ?? emptyStructuredRecipe().source) },
    confidence: {
      overall: base?.confidence.overall ?? 0,
      per_field: { ...(base?.confidence.per_field ?? {}) },
    },
    evidence: [...(base?.evidence ?? [])],
    field_states: { ...(base?.field_states ?? {}) },
    ingredients: [...(base?.ingredients ?? [])],
    instructions: [...(base?.instructions ?? [])],
    categories: [...(base?.categories ?? [])],
    tags: [...(base?.tags ?? [])],
  });

  if (!ai) return out;

  const hasSourceText = (base?.evidence.length ?? 0) > 0 ||
    (base?.title != null) ||
    (base?.ingredients.length ?? 0) > 0;

  const assignScalar = (
    key:
      | "title"
      | "description"
      | "servings"
      | "prep_time"
      | "cook_time"
      | "total_time"
      | "cuisine",
    aiValue: string | number | null | undefined,
    baseValue: string | number | null | undefined,
  ) => {
    if (baseValue != null && baseValue !== "") {
      return; // deterministic wins
    }
    if (aiValue == null || aiValue === "") {
      out[key] = null;
      out.field_states![key] = "missing";
      return;
    }
    if (!hasSourceText && !allowInferred) {
      out[key] = null;
      out.field_states![key] = "missing";
      return;
    }
    out[key] = aiValue as never;
    out.field_states![key] = allowInferred ? "inferred" : "present";
    out.evidence.push({
      field: key,
      source_type: "ai_inferred",
      source_excerpt: typeof aiValue === "string" ? aiValue.slice(0, 120) : null,
    });
  };

  assignScalar("title", ai.title ?? null, out.title);
  assignScalar("description", ai.description ?? null, out.description);
  assignScalar("servings", ai.servings ?? null, out.servings);
  assignScalar("prep_time", ai.prep_time ?? null, out.prep_time);
  assignScalar("cook_time", ai.cook_time ?? null, out.cook_time);
  assignScalar("total_time", ai.total_time ?? null, out.total_time);
  assignScalar("cuisine", ai.cuisine ?? null, out.cuisine);

  if ((!out.ingredients || out.ingredients.length === 0) && ai.ingredients?.length) {
    if (allowInferred) {
      out.ingredients = ai.ingredients.map((ing) => ({
        ...ing,
        state: "inferred" as FieldState,
      }));
      out.field_states!.ingredients = "inferred";
      out.evidence.push({
        field: "ingredients",
        source_type: "ai_inferred",
        source_excerpt: `${ai.ingredients.length} inferred items`,
      });
    } else {
      out.ingredients = [];
      out.field_states!.ingredients = "missing";
    }
  }

  if ((!out.instructions || out.instructions.length === 0) &&
    ai.instructions?.length) {
    if (allowInferred) {
      out.instructions = ai.instructions.map((step) => ({
        ...step,
        state: "inferred" as FieldState,
      }));
      out.field_states!.instructions = "inferred";
      out.evidence.push({
        field: "instructions",
        source_type: "ai_inferred",
        source_excerpt: `${ai.instructions.length} inferred steps`,
      });
    } else {
      out.instructions = [];
      out.field_states!.instructions = "missing";
    }
  }

  // Never invent nutrition silently
  if (out.nutrition == null && ai.nutrition) {
    out.nutrition = ai.nutrition;
    out.field_states!.nutrition = "inferred";
  }

  return out;
}

export function hasCriticalGaps(recipe: StructuredRecipe): string[] {
  const gaps: string[] = [];
  if (!recipe.title) gaps.push("missing_title");
  if (!recipe.ingredients.length) gaps.push("missing_ingredients");
  if (!recipe.instructions.length) gaps.push("missing_instructions");
  return gaps;
}

export function hasInferredCritical(recipe: StructuredRecipe): boolean {
  const states = recipe.field_states ?? {};
  return (
    states.title === "inferred" ||
    states.ingredients === "inferred" ||
    states.instructions === "inferred"
  );
}
