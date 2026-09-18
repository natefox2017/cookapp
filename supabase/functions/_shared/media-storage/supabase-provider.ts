/** Supabase Storage implementation of MediaStorageProvider. */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { AppError } from "../errors.ts";
import type { MediaStorageProvider } from "./provider.ts";
import type {
  DeleteResult,
  MediaObjectMetadata,
  ObjectStat,
  SignedUploadOptions,
  SignedUrlOptions,
  UploadInput,
} from "./types.ts";
import { STORAGE_PROVIDER_SUPABASE } from "./types.ts";
import {
  assertSignedUrlExpiry,
  byteLength,
  validateUploadRequest,
} from "./validation.ts";

export class SupabaseMediaStorageProvider implements MediaStorageProvider {
  readonly providerId = STORAGE_PROVIDER_SUPABASE;

  constructor(private readonly client: SupabaseClient) {}

  async upload(input: UploadInput): Promise<MediaObjectMetadata> {
    const sizeBytes = byteLength(input.body);
    const mime = validateUploadRequest({
      bucket: input.bucket,
      objectKey: input.objectKey,
      mimeType: input.mimeType,
      sizeBytes,
    });

    const { error } = await this.client.storage
      .from(input.bucket)
      .upload(input.objectKey, input.body, {
        contentType: mime,
        upsert: input.upsert ?? false,
        cacheControl: input.cacheControl ?? "3600",
      });

    if (error) {
      throw new AppError(
        "internal_error",
        `storage upload failed: ${error.message}`,
        500,
      );
    }

    return {
      storage_provider: this.providerId,
      bucket: input.bucket,
      object_key: input.objectKey,
      mime_type: mime,
      size_bytes: sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      duration_ms: input.durationMs ?? null,
      checksum: input.checksum ?? null,
      created_at: new Date().toISOString(),
    };
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([objectKey]);
    if (error) {
      throw new AppError(
        "internal_error",
        `storage delete failed: ${error.message}`,
        500,
      );
    }
  }

  async batchDelete(
    bucket: string,
    objectKeys: string[],
  ): Promise<DeleteResult[]> {
    if (objectKeys.length === 0) return [];
    const results: DeleteResult[] = [];
    const PAGE = 100;
    for (let i = 0; i < objectKeys.length; i += PAGE) {
      const chunk = objectKeys.slice(i, i + PAGE);
      const { data, error } = await this.client.storage.from(bucket).remove(
        chunk,
      );
      if (error) {
        for (const key of chunk) {
          results.push({ objectKey: key, deleted: false, error: error.message });
        }
        continue;
      }
      const deleted = new Set((data ?? []).map((d) => d.name));
      for (const key of chunk) {
        // Supabase returns basename in some versions; also match full key.
        const base = key.split("/").pop() ?? key;
        results.push({
          objectKey: key,
          deleted: deleted.has(key) || deleted.has(base) || (data?.length ?? 0) > 0,
        });
      }
    }
    return results;
  }

  async createSignedUrl(
    bucket: string,
    objectKey: string,
    options: SignedUrlOptions,
  ): Promise<string> {
    const expiresIn = assertSignedUrlExpiry(options.expiresInSeconds);
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(objectKey, expiresIn, {
        download: options.download,
      });
    if (error || !data?.signedUrl) {
      throw new AppError(
        "internal_error",
        `signed URL failed: ${error?.message ?? "empty"}`,
        500,
      );
    }
    return data.signedUrl;
  }

  async createSignedUploadUrl(
    bucket: string,
    objectKey: string,
    options: SignedUploadOptions,
  ): Promise<{ signedUrl: string; token?: string; path: string }> {
    assertSignedUrlExpiry(options.expiresInSeconds);
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUploadUrl(objectKey);
    if (error || !data?.signedUrl) {
      throw new AppError(
        "internal_error",
        `signed upload URL failed: ${error?.message ?? "empty"}`,
        500,
      );
    }
    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path ?? objectKey,
    };
  }

  getPublicUrl(bucket: string, objectKey: string): string {
    // Private buckets should not use this for user media; kept for interface completeness.
    const { data } = this.client.storage.from(bucket).getPublicUrl(objectKey);
    return data.publicUrl;
  }

  async getMetadata(bucket: string, objectKey: string): Promise<ObjectStat> {
    const parent = objectKey.includes("/")
      ? objectKey.slice(0, objectKey.lastIndexOf("/"))
      : "";
    const name = objectKey.includes("/")
      ? objectKey.slice(objectKey.lastIndexOf("/") + 1)
      : objectKey;

    const { data, error } = await this.client.storage.from(bucket).list(parent, {
      search: name,
      limit: 100,
    });
    if (error) {
      throw new AppError(
        "internal_error",
        `storage list failed: ${error.message}`,
        500,
      );
    }
    const entry = (data ?? []).find((e) => e.name === name);
    if (!entry || entry.id === null) {
      return { exists: false };
    }
    const meta = entry.metadata as Record<string, unknown> | null;
    return {
      exists: true,
      sizeBytes: typeof meta?.size === "number"
        ? meta.size
        : typeof entry.metadata?.["size"] === "number"
        ? (entry.metadata["size"] as number)
        : undefined,
      mimeType: typeof meta?.mimetype === "string"
        ? meta.mimetype
        : typeof meta?.contentType === "string"
        ? meta.contentType
        : undefined,
      updatedAt: entry.updated_at ?? undefined,
      metadata: meta
        ? Object.fromEntries(
          Object.entries(meta).map(([k, v]) => [k, String(v)]),
        )
        : undefined,
    };
  }

  async exists(bucket: string, objectKey: string): Promise<boolean> {
    const stat = await this.getMetadata(bucket, objectKey);
    return stat.exists;
  }
}

export function createSupabaseMediaStorageProvider(
  client: SupabaseClient,
): MediaStorageProvider {
  return new SupabaseMediaStorageProvider(client);
}
