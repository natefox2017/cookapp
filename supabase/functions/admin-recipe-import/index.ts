// Admin Recipe Import API — shared Backend AI Recipe Import pipeline.
// Auth: custom admin bearer via requireAdminSession.
// Deploy: supabase functions deploy admin-recipe-import --project-ref semsjyrqjnumpvanibip
// Issue: #55
//
// Depends on AI Platform (#53) + MediaStorage (#54) via shared interfaces/stubs.
// Full async queue worker is #56 — single jobs run inline here.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";
import { resolveSource } from "../_shared/recipe-import/source-resolver.ts";
import { canonicalizeUrl } from "../_shared/ssrf.ts";
import {
  runImportPipeline,
  type PipelineJobRow,
} from "../_shared/recipe-import/pipeline.ts";
import type { PipelineStage } from "../_shared/recipe-import/types.ts";
import { STAGE_ORDER } from "../_shared/recipe-import/types.ts";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-recipe-import");
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("validation_error", "Invalid JSON body", 400);
  }
}

function mapJob(row: Record<string, unknown>) {
  return {
    id: row.id,
    batchId: row.batch_id,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    canonicalUrl: row.canonical_url,
    sourceExternalId: row.source_external_id,
    status: row.status,
    stage: row.stage,
    confidence: row.confidence != null ? Number(row.confidence) : null,
    duplicateStatus: row.duplicate_status,
    duplicateOfJobId: row.duplicate_of_job_id,
    duplicateOfRecipeId: row.duplicate_of_recipe_id,
    recipeId: row.recipe_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    routeKey: row.route_key,
    aiProvider: row.ai_provider,
    aiModel: row.ai_model,
    promptVersion: row.prompt_version,
    schemaVersion: row.schema_version,
    destinationUserId: row.destination_user_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBatch(row: Record<string, unknown>) {
  return {
    id: row.id,
    total: row.total,
    imported: row.imported,
    needsReview: row.needs_review,
    failed: row.failed,
    duplicate: row.duplicate,
    createdBy: row.created_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function parseStage(value: unknown): PipelineStage {
  const s = String(value ?? "resolve");
  if ((STAGE_ORDER as string[]).includes(s)) return s as PipelineStage;
  throw new AppError("validation_error", `Invalid from_stage: ${s}`, 400);
}

async function loadJob(
  admin: ReturnType<typeof createServiceClient>,
  id: string,
): Promise<PipelineJobRow> {
  const { data, error } = await admin
    .from("recipe_import_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError("internal_error", error.message, 500);
  if (!data) throw new AppError("not_found", "Import job not found", 404);
  return data as unknown as PipelineJobRow;
}

async function refreshBatch(
  admin: ReturnType<typeof createServiceClient>,
  batchId: string | null,
) {
  if (!batchId) return;
  await admin.rpc("refresh_recipe_import_batch_summary", {
    p_batch_id: batchId,
  });
}

function prepareSource(body: Record<string, unknown>) {
  const sourceUrl = body.sourceUrl != null
    ? String(body.sourceUrl).trim()
    : body.source_url != null
    ? String(body.source_url).trim()
    : "";
  const sourceText = body.sourceText != null
    ? String(body.sourceText)
    : body.source_text != null
    ? String(body.source_text)
    : "";
  const destinationUserId = body.destinationUserId != null
    ? String(body.destinationUserId)
    : body.destination_user_id != null
    ? String(body.destination_user_id)
    : null;

  const resolved = resolveSource({
    source_url: sourceUrl || null,
    source_text: sourceText || null,
  });
  if (!resolved.ok) {
    throw new AppError(
      "validation_error",
      resolved.error_message ?? "Invalid source",
      400,
      { error_code: resolved.error_code },
    );
  }

  let canonical: string | null = null;
  if (resolved.source_url) {
    try {
      canonical = canonicalizeUrl(resolved.source_url);
    } catch {
      canonical = resolved.source_url;
    }
  }

  return {
    source_type: resolved.source_type,
    source_url: resolved.source_url,
    canonical_url: canonical,
    source_text: resolved.source_type === "text" ? sourceText : null,
    destination_user_id: destinationUserId,
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  try {
    const session = await requireAdminSession(req);
    const admin = createServiceClient();
    const parts = routeParts(req);
    const method = req.method.toUpperCase();
    const resource = (parts[0] ?? "").toLowerCase();

    // GET /jobs
    if (resource === "jobs" && parts.length === 1 && method === "GET") {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      const limit = Math.min(
        Number(url.searchParams.get("limit") ?? 50) || 50,
        200,
      );
      let q = admin
        .from("recipe_import_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new AppError("internal_error", error.message, 500);
      return json({ jobs: (data ?? []).map((r) => mapJob(r as Record<string, unknown>)) });
    }

    // POST /jobs — create single + run inline
    if (resource === "jobs" && parts.length === 1 && method === "POST") {
      const body = await readJson(req);
      const prepared = prepareSource(body);

      if (prepared.canonical_url) {
        const { data: existing } = await admin
          .from("recipe_import_jobs")
          .select("id, status")
          .eq("canonical_url", prepared.canonical_url)
          .not("status", "in", "(rejected,failed)")
          .maybeSingle();
        if (existing) {
          throw new AppError(
            "conflict",
            "Exact source URL already has an active import job",
            409,
            {
              error_code: "DUPLICATE",
              existingJobId: existing.id,
              existingStatus: existing.status,
            },
          );
        }
      }

      const { data: inserted, error } = await admin
        .from("recipe_import_jobs")
        .insert({
          ...prepared,
          status: "pending",
          stage: "resolve",
          created_by: session.adminId,
        })
        .select("*")
        .maybeSingle();

      if (error) {
        if (error.code === "23505") {
          throw new AppError(
            "conflict",
            "Exact source URL already has an active import job",
            409,
            { error_code: "DUPLICATE" },
          );
        }
        throw new AppError("internal_error", error.message, 500);
      }

      const job = inserted as unknown as PipelineJobRow;
      const result = await runImportPipeline(job, { admin });
      const fresh = await loadJob(admin, job.id);
      return json(
        { job: mapJob(fresh as unknown as Record<string, unknown>), result },
        201,
      );
    }

    // GET /jobs/:id
    if (resource === "jobs" && parts.length === 2 && method === "GET") {
      const job = await loadJob(admin, parts[1]);
      const { data: result } = await admin
        .from("recipe_import_results")
        .select("*")
        .eq("job_id", job.id)
        .maybeSingle();
      const { data: artifacts } = await admin
        .from("recipe_import_artifacts")
        .select(
          "id, artifact_type, storage_provider, bucket, object_key, mime_type, size_bytes, created_at",
        )
        .eq("job_id", job.id)
        .order("created_at", { ascending: true });

      return json({
        job: mapJob(job as unknown as Record<string, unknown>),
        result: result ?? null,
        artifacts: artifacts ?? [],
      });
    }

    // POST /jobs/:id/retry
    if (
      resource === "jobs" && parts.length === 3 && parts[2] === "retry" &&
      method === "POST"
    ) {
      const body = await readJson(req);
      const fromStage = parseStage(body.fromStage ?? body.from_stage ?? "resolve");
      const job = await loadJob(admin, parts[1]);
      await admin.from("recipe_import_jobs").update({
        retry_count: (job.retry_count ?? 0) + 1,
        status: "pending",
        error_code: null,
        error_message: null,
        completed_at: null,
      }).eq("id", job.id);

      const refreshed = await loadJob(admin, job.id);
      const result = await runImportPipeline(refreshed, { admin }, { fromStage });
      await refreshBatch(admin, refreshed.batch_id);
      const fresh = await loadJob(admin, job.id);
      return json({
        job: mapJob(fresh as unknown as Record<string, unknown>),
        result,
      });
    }

    // POST /jobs/:id/reparse — retry from parse stage
    if (
      resource === "jobs" && parts.length === 3 && parts[2] === "reparse" &&
      method === "POST"
    ) {
      const job = await loadJob(admin, parts[1]);
      await admin.from("recipe_import_jobs").update({
        retry_count: (job.retry_count ?? 0) + 1,
        status: "pending",
        error_code: null,
        error_message: null,
        completed_at: null,
      }).eq("id", job.id);
      const refreshed = await loadJob(admin, job.id);
      const result = await runImportPipeline(refreshed, { admin }, {
        fromStage: "parse",
      });
      await refreshBatch(admin, refreshed.batch_id);
      const fresh = await loadJob(admin, job.id);
      return json({
        job: mapJob(fresh as unknown as Record<string, unknown>),
        result,
      });
    }

    // POST /jobs/:id/approve — import review result
    if (
      resource === "jobs" && parts.length === 3 && parts[2] === "approve" &&
      method === "POST"
    ) {
      const body = await readJson(req);
      const job = await loadJob(admin, parts[1]);
      const destination = body.destinationUserId != null
        ? String(body.destinationUserId)
        : body.destination_user_id != null
        ? String(body.destination_user_id)
        : job.destination_user_id;

      if (!destination) {
        throw new AppError(
          "validation_error",
          "destinationUserId required to approve import",
          400,
        );
      }

      await admin.from("recipe_import_jobs").update({
        destination_user_id: destination,
        retry_count: (job.retry_count ?? 0) + 1,
        status: "pending",
        error_code: null,
        error_message: null,
        completed_at: null,
      }).eq("id", job.id);

      const refreshed = await loadJob(admin, job.id);
      // Skip duplicate re-block on self; run from import if result exists
      const { data: existingResult } = await admin
        .from("recipe_import_results")
        .select("id")
        .eq("job_id", job.id)
        .maybeSingle();

      const fromStage: PipelineStage = existingResult ? "quality" : "resolve";
      const result = await runImportPipeline(refreshed, { admin }, { fromStage });
      await refreshBatch(admin, refreshed.batch_id);
      const fresh = await loadJob(admin, job.id);
      return json({
        job: mapJob(fresh as unknown as Record<string, unknown>),
        result,
      });
    }

    // POST /jobs/:id/reject
    if (
      resource === "jobs" && parts.length === 3 && parts[2] === "reject" &&
      method === "POST"
    ) {
      const body = await readJson(req);
      const job = await loadJob(admin, parts[1]);
      const reason = body.reason != null ? String(body.reason) : "rejected_by_admin";
      await admin.from("recipe_import_jobs").update({
        status: "rejected",
        stage: "done",
        error_message: reason,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);
      await refreshBatch(admin, job.batch_id);
      const fresh = await loadJob(admin, job.id);
      return json({ job: mapJob(fresh as unknown as Record<string, unknown>) });
    }

    // POST /batches — create batch (jobs pending; worker is #56)
    if (resource === "batches" && parts.length === 1 && method === "POST") {
      const body = await readJson(req);
      const urlsRaw = body.urls ?? body.sourceUrls ?? [];
      const urls = Array.isArray(urlsRaw)
        ? urlsRaw.map((u) => String(u).trim()).filter(Boolean)
        : String(urlsRaw).split(/\n+/).map((u) => u.trim()).filter(Boolean);
      const destinationUserId = body.destinationUserId != null
        ? String(body.destinationUserId)
        : null;

      if (!urls.length) {
        throw new AppError("validation_error", "urls required", 400);
      }

      const { data: batch, error: batchErr } = await admin
        .from("recipe_import_batches")
        .insert({
          total: urls.length,
          created_by: session.adminId,
        })
        .select("*")
        .maybeSingle();
      if (batchErr || !batch) {
        throw new AppError(
          "internal_error",
          batchErr?.message ?? "batch create failed",
          500,
        );
      }

      const jobIds: string[] = [];
      const skipped: Array<{ url: string; reason: string }> = [];

      for (const url of urls) {
        try {
          const prepared = prepareSource({ sourceUrl: url, destinationUserId });
          if (prepared.canonical_url) {
            const { data: existing } = await admin
              .from("recipe_import_jobs")
              .select("id")
              .eq("canonical_url", prepared.canonical_url)
              .not("status", "in", "(rejected,failed)")
              .maybeSingle();
            if (existing) {
              skipped.push({ url, reason: "DUPLICATE" });
              continue;
            }
          }
          const { data: job, error } = await admin
            .from("recipe_import_jobs")
            .insert({
              ...prepared,
              batch_id: batch.id,
              status: "pending",
              stage: "resolve",
              created_by: session.adminId,
            })
            .select("id")
            .maybeSingle();
          if (error || !job) {
            skipped.push({ url, reason: error?.message ?? "insert_failed" });
            continue;
          }
          jobIds.push(job.id as string);
        } catch (err) {
          skipped.push({
            url,
            reason: err instanceof Error ? err.message : "error",
          });
        }
      }

      await refreshBatch(admin, batch.id as string);
      const { data: freshBatch } = await admin
        .from("recipe_import_batches")
        .select("*")
        .eq("id", batch.id)
        .maybeSingle();

      return json(
        {
          batch: mapBatch((freshBatch ?? batch) as Record<string, unknown>),
          jobIds,
          skipped,
          note:
            "Batch jobs are pending. Full async queue worker is Issue #56. Use POST /jobs/:id/retry to process individually.",
        },
        201,
      );
    }

    // GET /batches/:id
    if (resource === "batches" && parts.length === 2 && method === "GET") {
      await refreshBatch(admin, parts[1]);
      const { data: batch, error } = await admin
        .from("recipe_import_batches")
        .select("*")
        .eq("id", parts[1])
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!batch) throw new AppError("not_found", "Batch not found", 404);
      const { data: jobs } = await admin
        .from("recipe_import_jobs")
        .select("*")
        .eq("batch_id", parts[1])
        .order("created_at", { ascending: true });
      return json({
        batch: mapBatch(batch as Record<string, unknown>),
        jobs: (jobs ?? []).map((j) => mapJob(j as Record<string, unknown>)),
      });
    }

    throw new AppError("not_found", "Unknown admin-recipe-import route", 404);
  } catch (err) {
    return errorResponse(err, publicCorsHeaders);
  }
});
