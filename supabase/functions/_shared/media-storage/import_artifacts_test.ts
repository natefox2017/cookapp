/**
 * Import-artifact path helpers must use MediaStorageProvider (no direct SDK).
 */

import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { MediaStorageProvider } from "./provider.ts";
import type {
  DeleteResult,
  MediaObjectMetadata,
  ObjectStat,
  SignedUrlOptions,
  UploadInput,
} from "./types.ts";
import {
  fetchAndStoreImportArtifact,
  MEDIA_BUCKETS,
  uploadImportArtifact,
} from "./mod.ts";
import { AppError } from "../errors.ts";

const JOB = "33333333-3333-4333-8333-333333333333";

class MemoryMediaStorageProvider implements MediaStorageProvider {
  readonly providerId = "memory";
  store = new Map<string, { body: Uint8Array; mime: string }>();

  async upload(input: UploadInput): Promise<MediaObjectMetadata> {
    const body = input.body instanceof Uint8Array
      ? input.body
      : input.body instanceof ArrayBuffer
      ? new Uint8Array(input.body)
      : new Uint8Array(await input.body.arrayBuffer());
    this.store.set(`${input.bucket}:${input.objectKey}`, {
      body,
      mime: input.mimeType,
    });
    return {
      storage_provider: this.providerId,
      bucket: input.bucket,
      object_key: input.objectKey,
      mime_type: input.mimeType,
      size_bytes: body.byteLength,
    };
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    this.store.delete(`${bucket}:${objectKey}`);
  }

  async batchDelete(
    bucket: string,
    objectKeys: string[],
  ): Promise<DeleteResult[]> {
    return objectKeys.map((objectKey) => {
      const k = `${bucket}:${objectKey}`;
      const deleted = this.store.delete(k);
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

  async getMetadata(bucket: string, objectKey: string): Promise<ObjectStat> {
    return { exists: this.store.has(`${bucket}:${objectKey}`) };
  }

  async exists(bucket: string, objectKey: string): Promise<boolean> {
    return this.store.has(`${bucket}:${objectKey}`);
  }
}

Deno.test("uploadImportArtifact stores via provider under job path", async () => {
  const provider = new MemoryMediaStorageProvider();
  const body = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const meta = await uploadImportArtifact(provider, {
    jobId: JOB,
    kind: "cover_candidate",
    body,
    mimeType: "image/jpeg",
  });
  assertEquals(meta.bucket, MEDIA_BUCKETS.recipeImportArtifacts);
  assertEquals(meta.object_key, `${JOB}/cover.jpg`);
  assertEquals(
    provider.store.has(
      `${MEDIA_BUCKETS.recipeImportArtifacts}:${JOB}/cover.jpg`,
    ),
    true,
  );
});

Deno.test("fetchAndStoreImportArtifact uses SSRF-safe fetch then provider", async () => {
  const provider = new MemoryMediaStorageProvider();
  const png = new Uint8Array([1, 2, 3, 4, 5]);
  const fetchImpl: typeof fetch = () =>
    Promise.resolve(
      new Response(png, {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );

  const meta = await fetchAndStoreImportArtifact(provider, {
    jobId: JOB,
    kind: "screenshot",
    sourceUrl: "https://cdn.example.com/shot.png",
    suffix: "1",
    fetchImpl,
  });

  assertEquals(meta.object_key, `${JOB}/screenshot-1.png`);
  assertEquals(meta.source_url, "https://cdn.example.com/shot.png");
  assertEquals(meta.size_bytes, 5);
});

Deno.test("fetchAndStoreImportArtifact rejects SSRF targets", async () => {
  const provider = new MemoryMediaStorageProvider();
  await assertRejects(
    () =>
      fetchAndStoreImportArtifact(provider, {
        jobId: JOB,
        kind: "screenshot",
        sourceUrl: "http://169.254.169.254/latest/meta-data",
      }),
    AppError,
  );
});
