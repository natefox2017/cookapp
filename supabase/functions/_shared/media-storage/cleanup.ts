/**
 * TTL cleanup for recipe-import-artifacts.
 * Operational job type: storage_cleanup_import_artifacts
 *
 * Full Jobs & Syncs UI lands in #60; this module is the reusable cleanup core
 * invoked by the Edge Function stub / future worker.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { MediaStorageProvider } from "./provider.ts";
import { MEDIA_BUCKETS } from "./types.ts";

/** Documented operational job type for Operations / Jobs & Syncs (#60). */
export const JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS =
  "storage_cleanup_import_artifacts" as const;

export type CleanupCandidate = {
  id: string;
  job_id: string;
  bucket: string;
  object_key: string;
  expires_at: string;
};

export type CleanupResult = {
  job_type: typeof JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS;
  scanned: number;
  deleted: number;
  failed: number;
  errors: Array<{ object_key: string; message: string }>;
};

/**
 * Delete expired rows from recipe_import_artifact_objects and their storage objects.
 * Retries are left to the Operations layer (#60); this returns per-object errors.
 */
export async function cleanupExpiredImportArtifacts(
  db: SupabaseClient,
  provider: MediaStorageProvider,
  options?: { limit?: number; now?: Date },
): Promise<CleanupResult> {
  const limit = options?.limit ?? 200;
  const nowIso = (options?.now ?? new Date()).toISOString();

  const { data, error } = await db
    .from("recipe_import_artifact_objects")
    .select("id, job_id, bucket, object_key, expires_at")
    .lte("expires_at", nowIso)
    .is("deleted_at", null)
    .order("expires_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`cleanup query failed: ${error.message}`);
  }

  const rows = (data ?? []) as CleanupCandidate[];
  const result: CleanupResult = {
    job_type: JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS,
    scanned: rows.length,
    deleted: 0,
    failed: 0,
    errors: [],
  };

  if (rows.length === 0) return result;

  // Group by bucket (should always be recipe-import-artifacts).
  const byBucket = new Map<string, CleanupCandidate[]>();
  for (const row of rows) {
    const list = byBucket.get(row.bucket) ?? [];
    list.push(row);
    byBucket.set(row.bucket, list);
  }

  for (const [bucket, candidates] of byBucket) {
    const keys = candidates.map((c) => c.object_key);
    const deleteResults = await provider.batchDelete(bucket, keys);
    const okKeys = new Set(
      deleteResults.filter((r) => r.deleted).map((r) => r.objectKey),
    );

    for (const candidate of candidates) {
      if (!okKeys.has(candidate.object_key)) {
        const err = deleteResults.find((r) =>
          r.objectKey === candidate.object_key
        );
        result.failed += 1;
        result.errors.push({
          object_key: candidate.object_key,
          message: err?.error ?? "delete_failed",
        });
        continue;
      }

      const { error: markError } = await db
        .from("recipe_import_artifact_objects")
        .update({ deleted_at: nowIso })
        .eq("id", candidate.id);

      if (markError) {
        result.failed += 1;
        result.errors.push({
          object_key: candidate.object_key,
          message: markError.message,
        });
      } else {
        result.deleted += 1;
      }
    }
  }

  return result;
}

/** Helper to persist metadata after upload (import pipeline uses this). */
export async function recordImportArtifactObject(
  db: SupabaseClient,
  meta: {
    job_id: string;
    artifact_kind: string;
    storage_provider: string;
    bucket?: string;
    object_key: string;
    mime_type: string;
    size_bytes: number;
    width?: number | null;
    height?: number | null;
    duration_ms?: number | null;
    checksum?: string | null;
    expires_at: string;
    source_url?: string | null;
  },
): Promise<string> {
  const { data, error } = await db
    .from("recipe_import_artifact_objects")
    .insert({
      job_id: meta.job_id,
      artifact_kind: meta.artifact_kind,
      storage_provider: meta.storage_provider,
      bucket: meta.bucket ?? MEDIA_BUCKETS.recipeImportArtifacts,
      object_key: meta.object_key,
      mime_type: meta.mime_type,
      size_bytes: meta.size_bytes,
      width: meta.width ?? null,
      height: meta.height ?? null,
      duration_ms: meta.duration_ms ?? null,
      checksum: meta.checksum ?? null,
      expires_at: meta.expires_at,
      source_url: meta.source_url ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`record artifact failed: ${error?.message ?? "empty"}`);
  }
  return data.id as string;
}
