/** Path / MIME / size validation for media uploads. */

import { AppError } from "../errors.ts";
import { MEDIA_BUCKETS, type MediaBucket } from "./types.ts";

/** Default max signed URL lifetime (1 hour). Never permanent. */
export const MAX_SIGNED_URL_SECONDS = 60 * 60;

/** Import-artifact TTL default (7 days) when expires_at not set explicitly. */
export const IMPORT_ARTIFACT_DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Safe object path segment: no traversal, no absolute, no control chars. */
const SAFE_SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export const BUCKET_LIMITS: Record<
  string,
  { maxBytes: number; allowedMimeTypes: readonly string[] }
> = {
  [MEDIA_BUCKETS.avatars]: {
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
  },
  [MEDIA_BUCKETS.recipeCovers]: {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
  },
  [MEDIA_BUCKETS.recipeImages]: {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
  },
  [MEDIA_BUCKETS.recipeImportArtifacts]: {
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "text/plain",
      "text/vtt",
      "application/json",
      "video/mp4",
      "video/webm",
    ],
  },
};

const EXT_BY_MIME: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/heic": ["heic"],
  "image/heif": ["heif"],
  "text/plain": ["txt", "text"],
  "text/vtt": ["vtt"],
  "application/json": ["json"],
  "video/mp4": ["mp4", "m4v"],
  "video/webm": ["webm"],
};

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function assertSafeObjectKey(objectKey: string): void {
  if (!objectKey || typeof objectKey !== "string") {
    throw new AppError("validation_error", "object_key is required", 400);
  }
  if (objectKey.length > 1024) {
    throw new AppError("validation_error", "object_key too long", 400);
  }
  if (
    objectKey.startsWith("/") ||
    objectKey.includes("\\") ||
    objectKey.includes("\0") ||
    objectKey.includes("//")
  ) {
    throw new AppError("validation_error", "invalid object_key format", 400);
  }
  const segments = objectKey.split("/");
  if (segments.some((s) => !s || s === "." || s === "..")) {
    throw new AppError(
      "validation_error",
      "object_key must not contain empty or traversal segments",
      400,
    );
  }
  for (const segment of segments) {
    if (!SAFE_SEGMENT_RE.test(segment)) {
      throw new AppError(
        "validation_error",
        `unsafe object_key segment: ${segment}`,
        400,
      );
    }
  }
}

/**
 * Import artifacts path convention: `{job_id}/{relative...}`
 * job_id must be a UUID (import job id).
 */
export function assertImportArtifactObjectKey(objectKey: string): void {
  assertSafeObjectKey(objectKey);
  const [jobId, ...rest] = objectKey.split("/");
  if (!isUuid(jobId)) {
    throw new AppError(
      "validation_error",
      "import artifact object_key must start with job UUID",
      400,
    );
  }
  if (rest.length < 1) {
    throw new AppError(
      "validation_error",
      "import artifact object_key requires a path under job_id",
      400,
    );
  }
}

export function assertUserScopedObjectKey(
  objectKey: string,
  userId: string,
): void {
  assertSafeObjectKey(objectKey);
  const first = objectKey.split("/")[0];
  if (first !== userId) {
    throw new AppError(
      "forbidden",
      "object_key must be scoped to the authenticated user",
      403,
    );
  }
  if (!isUuid(userId)) {
    throw new AppError("validation_error", "user_id must be a UUID", 400);
  }
}

export function normalizeMimeType(mimeType: string): string {
  const base = mimeType.trim().toLowerCase().split(";")[0]!.trim();
  if (!base || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(base)) {
    throw new AppError("validation_error", "invalid mime_type", 400);
  }
  return base;
}

export function assertMimeAllowed(
  bucket: string,
  mimeType: string,
): string {
  const normalized = normalizeMimeType(mimeType);
  const limits = BUCKET_LIMITS[bucket];
  if (!limits) {
    throw new AppError("validation_error", `unknown bucket: ${bucket}`, 400);
  }
  if (!limits.allowedMimeTypes.includes(normalized)) {
    throw new AppError(
      "validation_error",
      `mime_type not allowed for bucket ${bucket}: ${normalized}`,
      400,
      { allowed: limits.allowedMimeTypes },
    );
  }
  return normalized;
}

export function assertSizeAllowed(bucket: string, sizeBytes: number): void {
  const limits = BUCKET_LIMITS[bucket];
  if (!limits) {
    throw new AppError("validation_error", `unknown bucket: ${bucket}`, 400);
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    throw new AppError("validation_error", "invalid size_bytes", 400);
  }
  if (sizeBytes === 0) {
    throw new AppError("validation_error", "empty uploads are not allowed", 400);
  }
  if (sizeBytes > limits.maxBytes) {
    throw new AppError(
      "validation_error",
      `file exceeds max size for bucket ${bucket} (${limits.maxBytes} bytes)`,
      400,
      { size_bytes: sizeBytes, max_bytes: limits.maxBytes },
    );
  }
}

export function assertExtensionMatchesMime(
  objectKey: string,
  mimeType: string,
): void {
  const normalized = normalizeMimeType(mimeType);
  const allowedExts = EXT_BY_MIME[normalized];
  if (!allowedExts) {
    throw new AppError("validation_error", `unsupported mime_type: ${normalized}`, 400);
  }
  const base = objectKey.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    throw new AppError(
      "validation_error",
      "object_key must include a file extension",
      400,
    );
  }
  const ext = base.slice(dot + 1).toLowerCase();
  if (!allowedExts.includes(ext)) {
    throw new AppError(
      "validation_error",
      `extension .${ext} does not match mime_type ${normalized}`,
      400,
      { expected_extensions: allowedExts },
    );
  }
}

export function assertSignedUrlExpiry(expiresInSeconds: number): number {
  if (
    !Number.isFinite(expiresInSeconds) ||
    expiresInSeconds <= 0 ||
    !Number.isInteger(expiresInSeconds)
  ) {
    throw new AppError(
      "validation_error",
      "expiresInSeconds must be a positive integer",
      400,
    );
  }
  if (expiresInSeconds > MAX_SIGNED_URL_SECONDS) {
    throw new AppError(
      "validation_error",
      `signed URL expiry must be <= ${MAX_SIGNED_URL_SECONDS}s (permanent URLs forbidden)`,
      400,
    );
  }
  return expiresInSeconds;
}

export function byteLength(
  body: Uint8Array | Blob | ArrayBuffer,
): number {
  if (body instanceof Uint8Array) return body.byteLength;
  if (body instanceof ArrayBuffer) return body.byteLength;
  return body.size;
}

export function isKnownBucket(bucket: string): bucket is MediaBucket {
  return Object.values(MEDIA_BUCKETS).includes(bucket as MediaBucket);
}

export function validateUploadRequest(args: {
  bucket: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  kind?: "user" | "import_artifact";
  userId?: string;
}): string {
  if (!isKnownBucket(args.bucket)) {
    throw new AppError("validation_error", `unknown bucket: ${args.bucket}`, 400);
  }
  const mime = assertMimeAllowed(args.bucket, args.mimeType);
  assertSizeAllowed(args.bucket, args.sizeBytes);
  assertExtensionMatchesMime(args.objectKey, mime);

  if (args.kind === "import_artifact") {
    if (args.bucket !== MEDIA_BUCKETS.recipeImportArtifacts) {
      throw new AppError(
        "validation_error",
        "import artifacts must use recipe-import-artifacts bucket",
        400,
      );
    }
    assertImportArtifactObjectKey(args.objectKey);
  } else if (args.kind === "user" && args.userId) {
    assertUserScopedObjectKey(args.objectKey, args.userId);
  } else {
    assertSafeObjectKey(args.objectKey);
  }

  return mime;
}
