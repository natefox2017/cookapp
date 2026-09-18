/**
 * Media object metadata persisted in Postgres (never file bytes / base64).
 * SoT: Notion Media & Object Storage Architecture.
 */

export const STORAGE_PROVIDER_SUPABASE = "supabase" as const;

export type StorageProviderId = typeof STORAGE_PROVIDER_SUPABASE | string;

/** Known buckets. Future providers keep the same logical names. */
export const MEDIA_BUCKETS = {
  avatars: "avatars",
  recipeCovers: "recipe-covers",
  recipeImages: "recipe-images",
  recipeImportArtifacts: "recipe-import-artifacts",
} as const;

export type MediaBucket = (typeof MEDIA_BUCKETS)[keyof typeof MEDIA_BUCKETS];

export type MediaObjectMetadata = {
  storage_provider: StorageProviderId;
  bucket: MediaBucket | string;
  object_key: string;
  mime_type: string;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  checksum?: string | null;
  created_at?: string;
};

export type UploadInput = {
  bucket: MediaBucket | string;
  objectKey: string;
  body: Uint8Array | Blob | ArrayBuffer;
  mimeType: string;
  cacheControl?: string;
  upsert?: boolean;
  /** Optional content checksum (hex/base64) for integrity tracking. */
  checksum?: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

export type SignedUrlOptions = {
  /** Seconds until expiry. Must be finite and > 0. Never permanent. */
  expiresInSeconds: number;
  download?: string | boolean;
};

export type SignedUploadOptions = {
  expiresInSeconds: number;
};

export type ObjectStat = {
  exists: boolean;
  sizeBytes?: number;
  mimeType?: string;
  updatedAt?: string;
  metadata?: Record<string, string>;
};

export type DeleteResult = {
  objectKey: string;
  deleted: boolean;
  error?: string;
};
