/**
 * Production Recipe Import runtime wiring (#53 / #54 / #61).
 * Worker must inject PlatformAIRouter + Supabase MediaStorageProvider.
 * Stub / memory providers are test-only and never installed here.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { PlatformAIRouter, type AIRouter } from "../ai-router.ts";
import {
  createSupabaseMediaStorageProvider,
  STORAGE_PROVIDER_SUPABASE,
  type MediaStorageProvider,
} from "../media-storage/mod.ts";

export interface ImportPipelineRuntime {
  router: AIRouter;
  media: MediaStorageProvider;
}

export function createImportPipelineRuntime(
  admin: SupabaseClient,
): ImportPipelineRuntime {
  const media = createSupabaseMediaStorageProvider(admin);
  if (media.providerId !== STORAGE_PROVIDER_SUPABASE) {
    throw new Error(
      "Production import runtime must use Supabase MediaStorageProvider",
    );
  }
  return {
    router: new PlatformAIRouter(admin),
    media,
  };
}
