/**
 * In-memory MediaStorageProvider for tests only.
 * Never used as the production default (providerId is "memory", not "stub").
 */

import type { MediaStorageProvider } from "./provider.ts";
import type {
  DeleteResult,
  MediaObjectMetadata,
  ObjectStat,
  SignedUrlOptions,
  SignedUploadOptions,
  UploadInput,
} from "./types.ts";
import { byteLength } from "./validation.ts";

export class MemoryMediaStorageProvider implements MediaStorageProvider {
  readonly providerId = "memory";
  readonly store = new Map<string, { body: Uint8Array; mime: string }>();

  private key(bucket: string, objectKey: string): string {
    return `${bucket}:${objectKey}`;
  }

  async upload(input: UploadInput): Promise<MediaObjectMetadata> {
    const body = input.body instanceof Uint8Array
      ? input.body
      : input.body instanceof ArrayBuffer
      ? new Uint8Array(input.body)
      : new Uint8Array(await input.body.arrayBuffer());
    this.store.set(this.key(input.bucket, input.objectKey), {
      body,
      mime: input.mimeType,
    });
    return {
      storage_provider: this.providerId,
      bucket: input.bucket,
      object_key: input.objectKey,
      mime_type: input.mimeType,
      size_bytes: body.byteLength || byteLength(body),
    };
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    this.store.delete(this.key(bucket, objectKey));
  }

  async batchDelete(
    bucket: string,
    objectKeys: string[],
  ): Promise<DeleteResult[]> {
    return objectKeys.map((objectKey) => {
      const deleted = this.store.delete(this.key(bucket, objectKey));
      return { objectKey, deleted };
    });
  }

  async createSignedUrl(
    _bucket: string,
    objectKey: string,
    options: SignedUrlOptions,
  ): Promise<string> {
    return `https://signed.example/${objectKey}?e=${options.expiresInSeconds}`;
  }

  async createSignedUploadUrl(
    _bucket: string,
    objectKey: string,
    _options: SignedUploadOptions,
  ): Promise<{ signedUrl: string; token?: string; path: string }> {
    return {
      signedUrl: `https://signed-upload.example/${objectKey}`,
      path: objectKey,
    };
  }

  async getMetadata(bucket: string, objectKey: string): Promise<ObjectStat> {
    const hit = this.store.get(this.key(bucket, objectKey));
    if (!hit) return { exists: false };
    return {
      exists: true,
      sizeBytes: hit.body.byteLength,
      mimeType: hit.mime,
    };
  }

  async exists(bucket: string, objectKey: string): Promise<boolean> {
    return this.store.has(this.key(bucket, objectKey));
  }
}
