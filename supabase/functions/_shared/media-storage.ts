/**
 * Media storage provider contract (Issue #54).
 * Import artifacts MUST use this abstraction — never hardcode Supabase Storage URLs.
 *
 * When #54 lands, replace StubMediaStorageProvider with Supabase-backed impl.
 */

export interface MediaObjectRef {
  storage_provider: string;
  bucket: string;
  object_key: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  checksum?: string | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
}

export interface MediaUploadInput {
  bucket: string;
  object_key: string;
  body: Uint8Array | string;
  mime_type: string;
  metadata?: Record<string, string>;
}

export interface MediaStorageProvider {
  upload(input: MediaUploadInput): Promise<MediaObjectRef>;
  delete(ref: Pick<MediaObjectRef, "bucket" | "object_key">): Promise<void>;
  batchDelete(
    refs: Array<Pick<MediaObjectRef, "bucket" | "object_key">>,
  ): Promise<void>;
  signedUrl(
    ref: Pick<MediaObjectRef, "bucket" | "object_key">,
    expiresInSeconds: number,
  ): Promise<string>;
  publicUrl?(ref: Pick<MediaObjectRef, "bucket" | "object_key">): string | null;
  exists(ref: Pick<MediaObjectRef, "bucket" | "object_key">): Promise<boolean>;
  metadata(
    ref: Pick<MediaObjectRef, "bucket" | "object_key">,
  ): Promise<MediaObjectRef | null>;
}

export const RECIPE_IMPORT_ARTIFACTS_BUCKET = "recipe-import-artifacts";

/** In-memory stub for tests / until MediaStorage (#54) is wired. */
export class StubMediaStorageProvider implements MediaStorageProvider {
  private readonly objects = new Map<string, {
    body: Uint8Array;
    mime_type: string;
    metadata: Record<string, string>;
  }>();

  private key(bucket: string, object_key: string): string {
    return `${bucket}::${object_key}`;
  }

  async upload(input: MediaUploadInput): Promise<MediaObjectRef> {
    const body = typeof input.body === "string"
      ? new TextEncoder().encode(input.body)
      : input.body;
    this.objects.set(this.key(input.bucket, input.object_key), {
      body,
      mime_type: input.mime_type,
      metadata: input.metadata ?? {},
    });
    return {
      storage_provider: "stub",
      bucket: input.bucket,
      object_key: input.object_key,
      mime_type: input.mime_type,
      size_bytes: body.byteLength,
    };
  }

  async delete(ref: Pick<MediaObjectRef, "bucket" | "object_key">): Promise<void> {
    this.objects.delete(this.key(ref.bucket, ref.object_key));
  }

  async batchDelete(
    refs: Array<Pick<MediaObjectRef, "bucket" | "object_key">>,
  ): Promise<void> {
    for (const ref of refs) await this.delete(ref);
  }

  async signedUrl(
    ref: Pick<MediaObjectRef, "bucket" | "object_key">,
    _expiresInSeconds: number,
  ): Promise<string> {
    // Opaque signed-url stand-in — never a real storage host URL.
    return `media://signed/${ref.bucket}/${ref.object_key}`;
  }

  async exists(
    ref: Pick<MediaObjectRef, "bucket" | "object_key">,
  ): Promise<boolean> {
    return this.objects.has(this.key(ref.bucket, ref.object_key));
  }

  async metadata(
    ref: Pick<MediaObjectRef, "bucket" | "object_key">,
  ): Promise<MediaObjectRef | null> {
    const hit = this.objects.get(this.key(ref.bucket, ref.object_key));
    if (!hit) return null;
    return {
      storage_provider: "stub",
      bucket: ref.bucket,
      object_key: ref.object_key,
      mime_type: hit.mime_type,
      size_bytes: hit.body.byteLength,
    };
  }
}

let defaultStorage: MediaStorageProvider = new StubMediaStorageProvider();

export function setMediaStorageProvider(provider: MediaStorageProvider): void {
  defaultStorage = provider;
}

export function getMediaStorageProvider(): MediaStorageProvider {
  return defaultStorage;
}
