/**
 * Shared Recipe Import Pipeline orchestrator.
 * SourceResolver → ContentExtractor → Normalizer → RecipeAIParser →
 * SchemaValidator → QualityValidator → DuplicateDetector → RecipeImporter
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { AIRouter } from "../ai-router.ts";
import {
  MEDIA_BUCKETS,
  type MediaStorageProvider,
} from "../media-storage/mod.ts";
import { canonicalizeUrl } from "../ssrf.ts";
import { resolveSource } from "./source-resolver.ts";
import { extractContent } from "./content-extractor.ts";
import { normalizeContent } from "./normalizer.ts";
import { parseRecipeWithAI } from "./recipe-ai-parser.ts";
import { validateRecipeSchema } from "./schema-validator.ts";
import { validateRecipeQuality } from "./quality-validator.ts";
import {
  detectDuplicate,
  recipeContentFingerprint,
  type DuplicateLookup,
} from "./duplicate-detector.ts";
import { importRecipe } from "./recipe-importer.ts";
import type {
  ImportErrorCode,
  JobStatus,
  PipelineStage,
  StructuredRecipe,
} from "./types.ts";
import { SCHEMA_VERSION, stageIndex } from "./types.ts";

export interface PipelineJobRow {
  id: string;
  batch_id: string | null;
  source_type: string;
  source_url: string | null;
  canonical_url: string | null;
  source_external_id: string | null;
  source_text: string | null;
  destination_user_id: string | null;
  status: JobStatus;
  stage: PipelineStage;
  retry_count: number;
}

export interface PipelineDeps {
  admin: SupabaseClient;
  router?: AIRouter;
  media?: MediaStorageProvider;
  duplicateLookup?: DuplicateLookup;
  htmlOverride?: string | null;
  fetchImpl?: typeof fetch;
  confidenceThreshold?: number;
}

function supabaseDuplicateLookup(admin: SupabaseClient): DuplicateLookup {
  return {
    async findByCanonicalUrl(canonicalUrl, excludeJobId) {
      let q = admin
        .from("recipe_import_jobs")
        .select("id, recipe_id")
        .eq("canonical_url", canonicalUrl)
        .not("status", "in", "(rejected,failed)")
        .limit(1);
      if (excludeJobId) q = q.neq("id", excludeJobId);
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return { job_id: data.id as string, recipe_id: (data.recipe_id as string | null) };
    },
  };
}

async function updateJob(
  admin: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await admin.from("recipe_import_jobs").update(patch).eq(
    "id",
    jobId,
  );
  if (error) throw new Error(`job_update_failed: ${error.message}`);
}

async function upsertResult(
  admin: SupabaseClient,
  jobId: string,
  payload: {
    structured_recipe: StructuredRecipe;
    validation_result: unknown;
    confidence: unknown;
    evidence: unknown;
    schema_version?: string;
  },
) {
  const row = {
    job_id: jobId,
    schema_version: payload.schema_version ?? SCHEMA_VERSION,
    structured_recipe: payload.structured_recipe,
    validation_result: payload.validation_result,
    confidence: payload.confidence,
    evidence: payload.evidence,
  };
  const { error } = await admin.from("recipe_import_results").upsert(row, {
    onConflict: "job_id",
  });
  if (error) throw new Error(`result_upsert_failed: ${error.message}`);
}

async function saveArtifact(
  admin: SupabaseClient,
  media: MediaStorageProvider,
  jobId: string,
  artifact_type: string,
  content: string,
  opts: { useStorage?: boolean; mime?: string } = {},
) {
  if (opts.useStorage && content.length > 8_000) {
    const object_key = `${jobId}/${artifact_type}.txt`;
    const body = new TextEncoder().encode(content);
    const ref = await media.upload({
      bucket: MEDIA_BUCKETS.recipeImportArtifacts,
      objectKey: object_key,
      body,
      mimeType: opts.mime ?? "text/plain",
    });
    await admin.from("recipe_import_artifacts").insert({
      job_id: jobId,
      artifact_type,
      storage_provider: ref.storage_provider,
      bucket: ref.bucket,
      object_key: ref.object_key,
      mime_type: ref.mime_type,
      size_bytes: ref.size_bytes,
      source_metadata: {},
    });
    return;
  }
  await admin.from("recipe_import_artifacts").insert({
    job_id: jobId,
    artifact_type,
    content: content.slice(0, 200_000),
    source_metadata: {},
  });
}

async function failJob(
  admin: SupabaseClient,
  jobId: string,
  stage: PipelineStage,
  error_code: ImportErrorCode,
  error_message: string,
  status: JobStatus = "failed",
) {
  await updateJob(admin, jobId, {
    status,
    stage,
    error_code,
    error_message,
    completed_at: new Date().toISOString(),
  });
}

export async function runImportPipeline(
  job: PipelineJobRow,
  deps: PipelineDeps,
  opts: { fromStage?: PipelineStage } = {},
): Promise<{ status: JobStatus; recipe_id?: string | null }> {
  const admin = deps.admin;
  if (!deps.media) {
    throw new Error(
      "MediaStorageProvider is required. Inject createSupabaseMediaStorageProvider(serviceClient); stub is test-only.",
    );
  }
  if (deps.media.providerId === "stub") {
    throw new Error("Stub MediaStorageProvider is test-only");
  }
  const media = deps.media;
  const fromStage = opts.fromStage ?? "resolve";
  const startIdx = stageIndex(fromStage);

  await updateJob(admin, job.id, {
    status: "running",
    stage: fromStage,
    started_at: job.retry_count > 0 ? undefined : new Date().toISOString(),
    error_code: null,
    error_message: null,
  });

  let sourceType = job.source_type as PipelineJobRow["source_type"];
  let sourceUrl = job.source_url;
  let canonicalUrl = job.canonical_url;
  let sourceExternalId = job.source_external_id;
  let extracted = null as Awaited<ReturnType<typeof extractContent>> | null;
  let normalized = null as ReturnType<typeof normalizeContent> | null;
  let recipe: StructuredRecipe | null = null;
  let routeKey: string | null = null;
  let aiProvider: string | null = null;
  let aiModel: string | null = null;
  let promptVersion: string | null = null;
  let schemaVersion: string = SCHEMA_VERSION;

  // --- resolve ---
  if (startIdx <= stageIndex("resolve")) {
    const resolved = resolveSource({
      source_url: job.source_url,
      source_text: job.source_text,
    });
    if (!resolved.ok) {
      await failJob(
        admin,
        job.id,
        "resolve",
        resolved.error_code ?? "RESOLVE_FAILED",
        resolved.error_message ?? "resolve failed",
      );
      return { status: "failed" };
    }
    sourceType = resolved.source_type;
    sourceUrl = resolved.source_url;
    if (sourceUrl) {
      try {
        canonicalUrl = canonicalizeUrl(sourceUrl);
      } catch {
        canonicalUrl = sourceUrl;
      }
    }
    await updateJob(admin, job.id, {
      stage: "extract",
      source_type: sourceType,
      source_url: sourceUrl,
      canonical_url: canonicalUrl,
    });
  }

  // --- extract ---
  if (startIdx <= stageIndex("extract")) {
    extracted = await extractContent({
      source_type: sourceType as never,
      source_url: sourceUrl,
      source_text: job.source_text,
      htmlOverride: deps.htmlOverride,
      fetchImpl: deps.fetchImpl,
    });

    if (extracted.extract_notes.some((n) => n.startsWith("ssrf_blocked"))) {
      await failJob(
        admin,
        job.id,
        "extract",
        "SSRF_BLOCKED",
        extracted.extract_notes.join("; "),
      );
      return { status: "failed" };
    }

    if (sourceType === "xiaohongshu") {
      await failJob(
        admin,
        job.id,
        "extract",
        "SOURCE_UNSUPPORTED",
        "Xiaohongshu extraction is not enabled yet",
        "needs_review",
      );
      return { status: "needs_review" };
    }

    if (!extracted.fetch_ok && sourceType !== "text") {
      await failJob(
        admin,
        job.id,
        "extract",
        "FETCH_FAILED",
        extracted.extract_notes.join("; ") || "fetch failed",
      );
      return { status: "failed" };
    }

    canonicalUrl = extracted.canonical_url ?? canonicalUrl;
    sourceExternalId = extracted.source_external_id;

    if (extracted.page_text) {
      await saveArtifact(admin, media, job.id, "page_text", extracted.page_text, {
        useStorage: true,
      });
    }
    if (extracted.caption) {
      await saveArtifact(admin, media, job.id, "caption", extracted.caption, {
        useStorage: extracted.caption.length > 8_000,
      });
    }
    if (extracted.transcript) {
      await saveArtifact(admin, media, job.id, "transcript", extracted.transcript, {
        useStorage: extracted.transcript.length > 8_000,
      });
    }
    if (extracted.json_ld_recipes.length) {
      await saveArtifact(
        admin,
        media,
        job.id,
        "json_ld",
        JSON.stringify(extracted.json_ld_recipes),
      );
    }

    await updateJob(admin, job.id, {
      stage: "normalize",
      canonical_url: canonicalUrl,
      source_external_id: sourceExternalId,
    });
  }

  // --- normalize ---
  if (startIdx <= stageIndex("normalize")) {
    if (!extracted) {
      // Re-extract when retrying from normalize without cached extract
      extracted = await extractContent({
        source_type: sourceType as never,
        source_url: sourceUrl,
        source_text: job.source_text,
        htmlOverride: deps.htmlOverride,
        fetchImpl: deps.fetchImpl,
      });
    }
    normalized = normalizeContent(extracted);
    if (normalized.text) {
      await saveArtifact(
        admin,
        media,
        job.id,
        "normalized_text",
        normalized.text,
        { useStorage: true },
      );
    }
    await updateJob(admin, job.id, { stage: "parse" });
  }

  // --- parse ---
  if (startIdx <= stageIndex("parse")) {
    if (!normalized) {
      if (!extracted) {
        extracted = await extractContent({
          source_type: sourceType as never,
          source_url: sourceUrl,
          source_text: job.source_text,
          htmlOverride: deps.htmlOverride,
          fetchImpl: deps.fetchImpl,
        });
      }
      normalized = normalizeContent(extracted);
    }
    if (!deps.router) {
      throw new Error(
        "AIRouter is required. Inject PlatformAIRouter(serviceClient); StubAIRouter is test-only.",
      );
    }
    const parsed = await parseRecipeWithAI(normalized, {
      jobId: job.id,
      router: deps.router,
    });
    routeKey = parsed.route_key;
    aiProvider = parsed.provider_id;
    aiModel = parsed.model_id;
    promptVersion = parsed.prompt_version;
    schemaVersion = parsed.schema_version;
    recipe = parsed.recipe;

    await updateJob(admin, job.id, {
      stage: "validate",
      route_key: routeKey,
      ai_provider: aiProvider,
      ai_model: aiModel,
      prompt_version: promptVersion,
      schema_version: schemaVersion,
    });

    if (!parsed.ok) {
      await upsertResult(admin, job.id, {
        structured_recipe: recipe,
        validation_result: { ok: false, errors: [parsed.error_code] },
        confidence: recipe.confidence,
        evidence: recipe.evidence,
        schema_version: schemaVersion,
      });
      await failJob(
        admin,
        job.id,
        "parse",
        "AI_PARSE_FAILED",
        parsed.error_message ?? "AI parse failed",
        "needs_review",
      );
      return { status: "needs_review" };
    }
  }

  if (!recipe) {
    await failJob(
      admin,
      job.id,
      "parse",
      "AI_PARSE_FAILED",
      "No structured recipe after parse stage",
      "needs_review",
    );
    return { status: "needs_review" };
  }

  // --- validate ---
  if (startIdx <= stageIndex("validate")) {
    const validation = validateRecipeSchema(recipe);
    await upsertResult(admin, job.id, {
      structured_recipe: recipe,
      validation_result: validation,
      confidence: recipe.confidence,
      evidence: recipe.evidence,
      schema_version: schemaVersion,
    });
    if (!validation.ok) {
      await failJob(
        admin,
        job.id,
        "validate",
        "SCHEMA_INVALID",
        validation.errors.join(", "),
        "needs_review",
      );
      return { status: "needs_review" };
    }
    await updateJob(admin, job.id, { stage: "quality" });
  }

  // --- quality ---
  let quality = validateRecipeQuality(recipe, {
    confidenceThreshold: deps.confidenceThreshold,
  });
  if (startIdx <= stageIndex("quality")) {
    quality = validateRecipeQuality(recipe, {
      confidenceThreshold: deps.confidenceThreshold,
    });
    await upsertResult(admin, job.id, {
      structured_recipe: recipe,
      validation_result: { quality },
      confidence: recipe.confidence,
      evidence: recipe.evidence,
      schema_version: schemaVersion,
    });
    await updateJob(admin, job.id, {
      stage: "duplicate",
      confidence: quality.overall_confidence,
    });
  }

  // --- duplicate ---
  if (startIdx <= stageIndex("duplicate")) {
    const lookup = deps.duplicateLookup ?? supabaseDuplicateLookup(admin);
    const dup = await detectDuplicate({
      canonical_url: canonicalUrl,
      source_type: sourceType,
      source_external_id: sourceExternalId,
      recipe,
      exclude_job_id: job.id,
      lookup,
    });

    if (dup.status === "exact") {
      await updateJob(admin, job.id, {
        status: "duplicate",
        stage: "done",
        duplicate_status: "exact",
        duplicate_of_job_id: dup.match_job_id ?? null,
        duplicate_of_recipe_id: dup.match_recipe_id ?? null,
        error_code: "DUPLICATE",
        error_message: dup.reason ?? "exact duplicate",
        confidence: quality.overall_confidence,
        completed_at: new Date().toISOString(),
        route_key: routeKey,
        ai_provider: aiProvider,
        ai_model: aiModel,
        prompt_version: promptVersion,
      });
      return { status: "duplicate" };
    }

    if (dup.status === "similar") {
      await updateJob(admin, job.id, {
        status: "needs_review",
        stage: "done",
        duplicate_status: "similar",
        duplicate_of_job_id: dup.match_job_id ?? null,
        duplicate_of_recipe_id: dup.match_recipe_id ?? null,
        error_code: "DUPLICATE",
        error_message: dup.reason ?? "similar duplicate",
        confidence: quality.overall_confidence,
        completed_at: new Date().toISOString(),
      });
      return { status: "needs_review" };
    }

    await updateJob(admin, job.id, {
      stage: "import",
      duplicate_status: "none",
    });
  }

  // Quality gate before auto-import
  if (quality.needs_review || !quality.ok) {
    await updateJob(admin, job.id, {
      status: "needs_review",
      stage: "done",
      error_code: "QUALITY_VALIDATION_FAILED",
      error_message: quality.reasons.join(", "),
      confidence: quality.overall_confidence,
      completed_at: new Date().toISOString(),
      route_key: routeKey,
      ai_provider: aiProvider,
      ai_model: aiModel,
      prompt_version: promptVersion,
    });
    return { status: "needs_review" };
  }

  // --- import ---
  if (startIdx <= stageIndex("import")) {
    if (!job.destination_user_id) {
      await failJob(
        admin,
        job.id,
        "import",
        "MISSING_DESTINATION",
        "destination_user_id required for auto-import",
        "needs_review",
      );
      return { status: "needs_review" };
    }

    const imported = await importRecipe(admin, {
      owner_user_id: job.destination_user_id,
      recipe,
    });
    if (!imported.ok) {
      await failJob(
        admin,
        job.id,
        "import",
        "IMPORT_FAILED",
        imported.error_message ?? "import failed",
        "needs_review",
      );
      return { status: "needs_review" };
    }

    await updateJob(admin, job.id, {
      status: "imported",
      stage: "done",
      recipe_id: imported.recipe_id,
      confidence: quality.overall_confidence,
      completed_at: new Date().toISOString(),
      route_key: routeKey,
      ai_provider: aiProvider,
      ai_model: aiModel,
      prompt_version: promptVersion,
      error_code: null,
      error_message: null,
    });

    // Store fingerprint artifact for future similarity checks
    await saveArtifact(
      admin,
      media,
      job.id,
      "metadata",
      JSON.stringify({
        fingerprint: recipeContentFingerprint(recipe),
      }),
    );

    return { status: "imported", recipe_id: imported.recipe_id };
  }

  await updateJob(admin, job.id, {
    status: "needs_review",
    stage: "done",
    completed_at: new Date().toISOString(),
  });
  return { status: "needs_review" };
}
