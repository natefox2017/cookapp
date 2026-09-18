# Media & Object Storage (Issue #54)

SoT: [Media & Object Storage Architecture](https://app.notion.com/p/3dfe1df1f5a781f9a7e2c276a0a911f8)

## Phase 1 provider

- **Provider:** Supabase Storage (via `MediaStorageProvider`)
- **Not in this issue:** Cloudflare R2 / Stream migration, GCS

## Buckets

| Bucket | Access | Path | Notes |
|--------|--------|------|-------|
| `avatars` | private, user RLS | `{user_id}/…` | existing |
| `recipe-covers` | private, user RLS | `{user_id}/{recipe_id}/…` | existing |
| `recipe-images` | private, user RLS | `{user_id}/{recipe_id}/…` | existing |
| `recipe-import-artifacts` | private, **service_role only** | `{job_id}/…` | TTL + cleanup |

## Abstraction

Business / import code must use:

```ts
import {
  createSupabaseMediaStorageProvider,
  uploadImportArtifact,
  fetchAndStoreImportArtifact,
} from "../_shared/media-storage/mod.ts";
```

Production `recipe-import-worker` injects `createSupabaseMediaStorageProvider(serviceClient)` via `createImportPipelineRuntime`. In-memory / stub providers are test-only and cannot be the runtime default.

Do **not**:

- Hardcode Supabase Storage URLs in feature modules
- Ship `service_role` or storage secrets to App / Admin browser
- Issue permanent signed URLs (max 1h)
- Store base64 / blobs in Postgres

## Metadata pattern (Postgres)

`recipe_import_artifact_objects` (and future media tables) store:

- `storage_provider`, `bucket`, `object_key`
- `mime_type`, `size_bytes`, `width`, `height`, `duration_ms`, `checksum`
- `expires_at` / `deleted_at` for TTL

## Operational job type

| Job type | Function | Auth |
|----------|----------|------|
| `storage_cleanup_import_artifacts` | `POST /functions/v1/storage-cleanup-import-artifacts` | `Bearer STORAGE_CLEANUP_SECRET` |

Registered in `operational_job_type_registry` for Jobs & Syncs (#60).

```bash
supabase secrets set STORAGE_CLEANUP_SECRET=… --project-ref semsjyrqjnumpvanibip
```

## Tests

```bash
deno test supabase/functions/_shared/media-storage/
```

Covers path / MIME / size validation and SSRF for external fetch ingest.
