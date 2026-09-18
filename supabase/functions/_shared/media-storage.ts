/**
 * Compatibility entry for MediaStorageProvider.
 *
 * Production code must import from `./media-storage/mod.ts` and inject
 * `createSupabaseMediaStorageProvider(serviceClient)`.
 * This file no longer defaults to an in-memory stub.
 */

export type {
  MediaStorageProvider,
} from "./media-storage/provider.ts";
export type {
  MediaObjectMetadata as MediaObjectRef,
  UploadInput as MediaUploadInput,
} from "./media-storage/types.ts";
export {
  createSupabaseMediaStorageProvider,
  SupabaseMediaStorageProvider,
  MEDIA_BUCKETS,
  STORAGE_PROVIDER_SUPABASE,
} from "./media-storage/mod.ts";
export { MemoryMediaStorageProvider } from "./media-storage/memory-provider.ts";
export { RECIPE_IMPORT_ARTIFACTS_BUCKET } from "./media-storage/compat.ts";

import type { MediaStorageProvider } from "./media-storage/provider.ts";

let configured: MediaStorageProvider | null = null;

/** Tests may inject a provider. Production must pass one explicitly. */
export function setMediaStorageProvider(provider: MediaStorageProvider): void {
  if (provider.providerId === "stub") {
    throw new Error("Stub MediaStorageProvider is test-only and cannot be installed as default");
  }
  configured = provider;
}

export function getMediaStorageProvider(): MediaStorageProvider {
  if (!configured) {
    throw new Error(
      "MediaStorageProvider is not configured. Inject createSupabaseMediaStorageProvider(serviceClient) in production.",
    );
  }
  return configured;
}

export function resetMediaStorageProvider(): void {
  configured = null;
}
