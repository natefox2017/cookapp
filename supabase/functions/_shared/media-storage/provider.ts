/**
 * MediaStorageProvider — business code must depend on this interface only.
 * Do not hardcode Supabase Storage URLs or call storage SDK from feature modules.
 */

import type {
  DeleteResult,
  MediaObjectMetadata,
  ObjectStat,
  SignedUploadOptions,
  SignedUrlOptions,
  UploadInput,
} from "./types.ts";

export interface MediaStorageProvider {
  readonly providerId: string;

  upload(input: UploadInput): Promise<MediaObjectMetadata>;

  delete(bucket: string, objectKey: string): Promise<void>;

  batchDelete(
    bucket: string,
    objectKeys: string[],
  ): Promise<DeleteResult[]>;

  /**
   * Temporary signed download URL. Permanent / non-expiring URLs are forbidden.
   */
  createSignedUrl(
    bucket: string,
    objectKey: string,
    options: SignedUrlOptions,
  ): Promise<string>;

  /**
   * Optional presigned upload URL for controlled client/admin uploads.
   * Credentials never leave the server; only a short-lived URL is returned.
   */
  createSignedUploadUrl?(
    bucket: string,
    objectKey: string,
    options: SignedUploadOptions,
  ): Promise<{ signedUrl: string; token?: string; path: string }>;

  getPublicUrl?(bucket: string, objectKey: string): string;

  getMetadata(bucket: string, objectKey: string): Promise<ObjectStat>;

  exists(bucket: string, objectKey: string): Promise<boolean>;
}
