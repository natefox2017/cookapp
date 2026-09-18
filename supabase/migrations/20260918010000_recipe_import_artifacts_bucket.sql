-- Media storage: private recipe-import-artifacts bucket + metadata TTL table.
-- SoT: Notion Media & Object Storage Architecture / Issue #54
-- Existing buckets avatars / recipe-covers / recipe-images are unchanged.
--
-- Operational job type (Jobs & Syncs / #60):
--   storage_cleanup_import_artifacts

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-import-artifacts',
  'recipe-import-artifacts',
  false,
  52428800, -- 50 MiB (temp video / large frames; user media buckets stay smaller)
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'text/plain',
    'text/vtt',
    'application/json',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Service-role / backend only: no authenticated client policies.
-- (Supabase service_role bypasses RLS; omitting policies denies anon/authenticated.)
drop policy if exists "recipe_import_artifacts_select_own" on storage.objects;
drop policy if exists "recipe_import_artifacts_insert_own" on storage.objects;
drop policy if exists "recipe_import_artifacts_update_own" on storage.objects;
drop policy if exists "recipe_import_artifacts_delete_own" on storage.objects;

-- Metadata for import artifacts (Postgres stores pointers only — never base64/blobs).
-- Full recipe_import_jobs / recipe_import_artifacts evidence tables land in #55;
-- this table is the storage TTL index used by MediaStorageProvider cleanup.
create table if not exists public.recipe_import_artifact_objects (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  artifact_kind text not null,
  storage_provider text not null default 'supabase',
  bucket text not null default 'recipe-import-artifacts',
  object_key text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width integer null check (width is null or width > 0),
  height integer null check (height is null or height > 0),
  duration_ms integer null check (duration_ms is null or duration_ms >= 0),
  checksum text null,
  source_url text null,
  expires_at timestamptz not null,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint recipe_import_artifact_objects_bucket_chk
    check (bucket = 'recipe-import-artifacts'),
  constraint recipe_import_artifact_objects_key_unique
    unique (bucket, object_key)
);

comment on table public.recipe_import_artifact_objects is
  'TTL index for AI import media in recipe-import-artifacts. Metadata only; bytes live in Storage via MediaStorageProvider.';

comment on column public.recipe_import_artifact_objects.storage_provider is
  'Logical provider id (phase 1: supabase). Business code must not hardcode provider URLs.';

comment on column public.recipe_import_artifact_objects.object_key is
  'Path inside bucket: {job_id}/...';

comment on column public.recipe_import_artifact_objects.expires_at is
  'TTL deadline; storage_cleanup_import_artifacts deletes object + marks deleted_at.';

create index if not exists recipe_import_artifact_objects_expires_idx
  on public.recipe_import_artifact_objects (expires_at)
  where deleted_at is null;

create index if not exists recipe_import_artifact_objects_job_idx
  on public.recipe_import_artifact_objects (job_id)
  where deleted_at is null;

alter table public.recipe_import_artifact_objects enable row level security;

-- No policies for anon/authenticated: service_role only (Edge Functions / workers).
revoke all on table public.recipe_import_artifact_objects from public, anon, authenticated;
grant select, insert, update, delete on table public.recipe_import_artifact_objects to service_role;

-- Document operational job type for Operations center (#60).
create table if not exists public.operational_job_type_registry (
  job_type text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

comment on table public.operational_job_type_registry is
  'Catalog of operational job types for Jobs & Syncs. Implementation workers may land later (#56/#60).';

insert into public.operational_job_type_registry (job_type, description)
values (
  'storage_cleanup_import_artifacts',
  'Delete expired recipe-import-artifacts objects and mark recipe_import_artifact_objects.deleted_at. Invoked by Edge Function storage-cleanup-import-artifacts (cron / manual).'
)
on conflict (job_type) do update set description = excluded.description;

alter table public.operational_job_type_registry enable row level security;
revoke all on table public.operational_job_type_registry from public, anon, authenticated;
grant select on table public.operational_job_type_registry to service_role;
