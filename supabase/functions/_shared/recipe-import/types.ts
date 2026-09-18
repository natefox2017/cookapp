/** Shared types for AI Recipe Import pipeline (Issue #55). */

export type SourceType =
  | "web"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "xiaohongshu"
  | "text";

export type JobStatus =
  | "pending"
  | "running"
  | "imported"
  | "needs_review"
  | "failed"
  | "rejected"
  | "duplicate";

export type PipelineStage =
  | "resolve"
  | "extract"
  | "normalize"
  | "parse"
  | "validate"
  | "quality"
  | "duplicate"
  | "import"
  | "done";

export type ImportErrorCode =
  | "RESOLVE_FAILED"
  | "FETCH_FAILED"
  | "EXTRACT_FAILED"
  | "AI_PARSE_FAILED"
  | "SCHEMA_INVALID"
  | "QUALITY_VALIDATION_FAILED"
  | "DUPLICATE"
  | "IMPORT_FAILED"
  | "SSRF_BLOCKED"
  | "SOURCE_UNSUPPORTED"
  | "MISSING_DESTINATION";

export type DuplicateStatus = "none" | "exact" | "similar" | "marked";

export type FieldState = "present" | "missing" | "inferred";

export interface StructuredIngredient {
  raw_text: string | null;
  quantity: number | null;
  unit: string | null;
  ingredient: string | null;
  preparation: string | null;
  state?: FieldState;
}

export interface StructuredInstruction {
  position: number;
  text: string | null;
  timer_seconds: number | null;
  state?: FieldState;
}

export interface StructuredRecipe {
  title: string | null;
  description: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  ingredients: StructuredIngredient[];
  instructions: StructuredInstruction[];
  cuisine: string | null;
  categories: string[];
  tags: string[];
  nutrition: Record<string, number | null> | null;
  source: {
    url: string | null;
    platform: SourceType | null;
    creator: string | null;
    published_at: string | null;
  };
  confidence: {
    overall: number;
    per_field: Record<string, number>;
  };
  evidence: Array<{
    field: string;
    source_type: string;
    source_excerpt?: string | null;
    source_pointer?: string | null;
  }>;
  field_states?: Record<string, FieldState>;
}

export interface ExtractedContent {
  source_type: SourceType;
  source_url: string | null;
  canonical_url: string | null;
  source_external_id: string | null;
  page_title: string | null;
  page_text: string | null;
  caption: string | null;
  transcript: string | null;
  metadata: Record<string, unknown>;
  json_ld_recipes: unknown[];
  image_candidates: Array<{
    url: string;
    alt?: string | null;
  }>;
  fetch_ok: boolean;
  extract_notes: string[];
}

export interface NormalizedContent {
  text: string;
  json_ld_recipe: Record<string, unknown> | null;
  deterministic_recipe: StructuredRecipe | null;
  image_candidates: ExtractedContent["image_candidates"];
  source_type: SourceType;
  canonical_url: string | null;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface QualityResult {
  ok: boolean;
  needs_review: boolean;
  reasons: string[];
  overall_confidence: number;
}

export interface DuplicateResult {
  status: DuplicateStatus;
  match_job_id?: string | null;
  match_recipe_id?: string | null;
  reason?: string;
}

export const SCHEMA_VERSION = "recipe_import_v1";
export const PROMPT_VERSION = "recipe_import_prompt_v1";

export const STAGE_ORDER: PipelineStage[] = [
  "resolve",
  "extract",
  "normalize",
  "parse",
  "validate",
  "quality",
  "duplicate",
  "import",
  "done",
];

export function stageIndex(stage: PipelineStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function emptyStructuredRecipe(
  partial: Partial<StructuredRecipe> = {},
): StructuredRecipe {
  return {
    title: null,
    description: null,
    servings: null,
    prep_time: null,
    cook_time: null,
    total_time: null,
    ingredients: [],
    instructions: [],
    cuisine: null,
    categories: [],
    tags: [],
    nutrition: null,
    source: {
      url: null,
      platform: null,
      creator: null,
      published_at: null,
    },
    confidence: { overall: 0, per_field: {} },
    evidence: [],
    field_states: {},
    ...partial,
  };
}
