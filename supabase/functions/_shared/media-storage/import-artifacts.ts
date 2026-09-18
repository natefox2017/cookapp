/**
 * Import-artifact paths — always go through MediaStorageProvider.
 * Bucket: recipe-import-artifacts · path: {job_id}/...
 */

import type { MediaStorageProvider } from "./provider.ts";
import { safeFetchUrl } from "./ssrf.ts";
import { MEDIA_BUCKETS, type MediaObjectMetadata } from "./types.ts";
import {
  BUCKET_LIMITS,
  IMPORT_ARTIFACT_DEFAULT_TTL_SECONDS,
  assertImportArtifactObjectKey,
  assertMimeAllowed,
  assertSizeAllowed,
  validateUploadRequest,
} from "./validation.ts";

export type ImportArtifactKind =
  | "cover_candidate"
  | "screenshot"
  | "ocr_frame"
  | "transcript"
  | "caption"
  | "attachment"
  | "temp_video"
  | "other";

const KIND_FILE: Record<ImportArtifactKind, { name: string; mimeFallback: string }> = {
  cover_candidate: { name: "cover", mimeFallback: "image/jpeg" },
  screenshot: { name: "screenshot", mimeFallback: "image/jpeg" },
  ocr_frame: { name: "ocr-frame", mimeFallback: "image/jpeg" },
  transcript: { name: "transcript", mimeFallback: "text/plain" },
  caption: { name: "caption", mimeFallback: "text/plain" },
  attachment: { name: "attachment", mimeFallback: "application/json" },
  temp_video: { name: "temp-video", mimeFallback: "video/mp4" },
  other: { name: "artifact", mimeFallback: "application/octet-stream" },
};

const EXT_FOR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "text/plain": "txt",
  "text/vtt": "vtt",
  "application/json": "json",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function buildImportArtifactObjectKey(args: {
  jobId: string;
  kind: ImportArtifactKind;
  mimeType: string;
  /** Optional disambiguator (e.g. frame index). */
  suffix?: string;
}): string {
  const mime = assertMimeAllowed(
    MEDIA_BUCKETS.recipeImportArtifacts,
    args.mimeType,
  );
  const ext = EXT_FOR_MIME[mime];
  if (!ext) {
    throw new Error(`no extension mapping for ${mime}`);
  }
  const base = KIND_FILE[args.kind].name;
  const name = args.suffix
    ? `${base}-${args.suffix}.${ext}`
    : `${base}.${ext}`;
  const objectKey = `${args.jobId}/${name}`;
  assertImportArtifactObjectKey(objectKey);
  return objectKey;
}

export function defaultImportArtifactExpiresAt(
  from: Date = new Date(),
  ttlSeconds = IMPORT_ARTIFACT_DEFAULT_TTL_SECONDS,
): Date {
  return new Date(from.getTime() + ttlSeconds * 1000);
}

/**
 * Upload bytes for an import job via MediaStorageProvider.
 */
export async function uploadImportArtifact(
  provider: MediaStorageProvider,
  args: {
    jobId: string;
    kind: ImportArtifactKind;
    body: Uint8Array | Blob | ArrayBuffer;
    mimeType: string;
    suffix?: string;
    objectKey?: string;
    checksum?: string;
    width?: number;
    height?: number;
    durationMs?: number;
  },
): Promise<MediaObjectMetadata> {
  const objectKey = args.objectKey ??
    buildImportArtifactObjectKey({
      jobId: args.jobId,
      kind: args.kind,
      mimeType: args.mimeType,
      suffix: args.suffix,
    });

  const sizeBytes = args.body instanceof Uint8Array
    ? args.body.byteLength
    : args.body instanceof ArrayBuffer
    ? args.body.byteLength
    : args.body.size;

  validateUploadRequest({
    bucket: MEDIA_BUCKETS.recipeImportArtifacts,
    objectKey,
    mimeType: args.mimeType,
    sizeBytes,
    kind: "import_artifact",
  });

  return await provider.upload({
    bucket: MEDIA_BUCKETS.recipeImportArtifacts,
    objectKey,
    body: args.body,
    mimeType: args.mimeType,
    upsert: true,
    checksum: args.checksum,
    width: args.width,
    height: args.height,
    durationMs: args.durationMs,
  });
}

/**
 * Fetch a remote URL (SSRF-safe) and store as an import artifact.
 */
export async function fetchAndStoreImportArtifact(
  provider: MediaStorageProvider,
  args: {
    jobId: string;
    kind: ImportArtifactKind;
    sourceUrl: string;
    mimeTypeHint?: string;
    suffix?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<MediaObjectMetadata & { source_url: string }> {
  const limits = BUCKET_LIMITS[MEDIA_BUCKETS.recipeImportArtifacts]!;
  const fetched = await safeFetchUrl(
    args.sourceUrl,
    {
      maxBytes: limits.maxBytes,
      allowedMimeTypes: limits.allowedMimeTypes,
    },
    args.fetchImpl,
  );

  const mime = args.mimeTypeHint
    ? assertMimeAllowed(MEDIA_BUCKETS.recipeImportArtifacts, args.mimeTypeHint)
    : assertMimeAllowed(MEDIA_BUCKETS.recipeImportArtifacts, fetched.mimeType);

  assertSizeAllowed(MEDIA_BUCKETS.recipeImportArtifacts, fetched.sizeBytes);

  const meta = await uploadImportArtifact(provider, {
    jobId: args.jobId,
    kind: args.kind,
    body: fetched.body,
    mimeType: mime,
    suffix: args.suffix,
  });

  return { ...meta, source_url: fetched.finalUrl };
}

export async function deleteImportArtifactsForJob(
  provider: MediaStorageProvider,
  jobId: string,
  objectKeys: string[],
): Promise<void> {
  for (const key of objectKeys) {
    assertImportArtifactObjectKey(key);
    if (!key.startsWith(`${jobId}/`)) {
      throw new Error(`object_key ${key} does not belong to job ${jobId}`);
    }
  }
  await provider.batchDelete(MEDIA_BUCKETS.recipeImportArtifacts, objectKeys);
}
