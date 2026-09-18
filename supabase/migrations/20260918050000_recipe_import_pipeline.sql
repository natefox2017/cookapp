-- Recipe Import Pipeline core (Issue #55)
-- Shared Backend pipeline for Admin + future iOS. Queue worker is #56.
-- Depends conceptually on AI Platform (#53) and MediaStorage (#54); schema is self-contained.

-- Allow service_role / security definer imports to set explicit user_id.
-- Client JWT inserts still force ownership from auth.uid().
create or replace function public.recipes_set_owner()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Batches
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_import_batches (
  id uuid primary key default gen_random_uuid(),
  total integer not null default 0 check (total >= 0),
  imported integer not null default 0 check (imported >= 0),
  needs_review integer not null default 0 check (needs_review >= 0),
  failed integer not null default 0 check (failed >= 0),
  duplicate integer not null default 0 check (duplicate >= 0),
  created_by uuid references public.admin_accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint recipe_import_batches_counts_lte_total
    check (imported + needs_review + failed + duplicate <= total)
);

create index if not exists recipe_import_batches_created_at_idx
  on public.recipe_import_batches (created_at desc);

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_import_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.recipe_import_batches (id) on delete set null,
  source_type text not null
    check (source_type in ('web', 'tiktok', 'instagram', 'youtube', 'xiaohongshu', 'text')),
  source_url text,
  canonical_url text,
  source_external_id text,
  source_text text,
  destination_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in (
      'pending', 'running', 'imported', 'needs_review', 'failed', 'rejected', 'duplicate'
    )),
  stage text not null default 'resolve'
    check (stage in (
      'resolve', 'extract', 'normalize', 'parse', 'validate', 'quality',
      'duplicate', 'import', 'done'
    )),
  confidence numeric(5, 4),
  duplicate_status text not null default 'none'
    check (duplicate_status in ('none', 'exact', 'similar', 'marked')),
  duplicate_of_job_id uuid references public.recipe_import_jobs (id) on delete set null,
  duplicate_of_recipe_id uuid references public.recipes (id) on delete set null,
  recipe_id uuid references public.recipes (id) on delete set null,
  error_code text
    check (
      error_code is null or error_code in (
        'RESOLVE_FAILED',
        'FETCH_FAILED',
        'EXTRACT_FAILED',
        'AI_PARSE_FAILED',
        'SCHEMA_INVALID',
        'QUALITY_VALIDATION_FAILED',
        'DUPLICATE',
        'IMPORT_FAILED',
        'SSRF_BLOCKED',
        'SOURCE_UNSUPPORTED',
        'MISSING_DESTINATION'
      )
    ),
  error_message text,
  retry_count integer not null default 0 check (retry_count >= 0),
  route_key text,
  ai_provider text,
  ai_model text,
  prompt_version text,
  schema_version text not null default 'recipe_import_v1',
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.admin_accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_import_jobs_source_present check (
    (source_type = 'text' and char_length(trim(coalesce(source_text, ''))) > 0)
    or (source_type <> 'text' and char_length(trim(coalesce(source_url, ''))) > 0)
  )
);

create index if not exists recipe_import_jobs_status_idx
  on public.recipe_import_jobs (status);
create index if not exists recipe_import_jobs_batch_id_idx
  on public.recipe_import_jobs (batch_id);
create index if not exists recipe_import_jobs_created_at_idx
  on public.recipe_import_jobs (created_at desc);
create index if not exists recipe_import_jobs_canonical_url_idx
  on public.recipe_import_jobs (canonical_url)
  where canonical_url is not null;

-- Exact URL duplicate: one non-rejected active job per canonical URL.
create unique index if not exists recipe_import_jobs_exact_url_active_uidx
  on public.recipe_import_jobs (canonical_url)
  where canonical_url is not null
    and status not in ('rejected', 'failed');

comment on table public.recipe_import_jobs is
  'AI Recipe Import jobs. Single shared pipeline for Admin + future iOS (Issue #55).';

-- ---------------------------------------------------------------------------
-- Results (structured parse + validation evidence)
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_import_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.recipe_import_jobs (id) on delete cascade,
  schema_version text not null default 'recipe_import_v1',
  structured_recipe jsonb not null default '{}'::jsonb,
  validation_result jsonb not null default '{}'::jsonb,
  confidence jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_import_results_structured_is_object
    check (jsonb_typeof(structured_recipe) = 'object'),
  constraint recipe_import_results_validation_is_object
    check (jsonb_typeof(validation_result) = 'object'),
  constraint recipe_import_results_confidence_is_object
    check (jsonb_typeof(confidence) = 'object'),
  constraint recipe_import_results_evidence_is_array
    check (jsonb_typeof(evidence) = 'array')
);

-- ---------------------------------------------------------------------------
-- Artifacts (evidence pointers; large blobs via MediaStorageProvider)
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_import_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.recipe_import_jobs (id) on delete cascade,
  artifact_type text not null
    check (artifact_type in (
      'raw_html',
      'page_text',
      'json_ld',
      'caption',
      'transcript',
      'metadata',
      'image_candidate',
      'normalized_text',
      'ai_response',
      'log'
    )),
  content text,
  storage_provider text,
  bucket text,
  object_key text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint recipe_import_artifacts_payload_present check (
    content is not null
    or (storage_provider is not null and bucket is not null and object_key is not null)
  )
);

create index if not exists recipe_import_artifacts_job_id_idx
  on public.recipe_import_artifacts (job_id);

comment on table public.recipe_import_artifacts is
  'Import evidence. Binary media uses MediaStorageProvider (#54); DB stores keys only.';

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.touch_recipe_import_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipe_import_jobs_set_updated_at on public.recipe_import_jobs;
create trigger recipe_import_jobs_set_updated_at
  before update on public.recipe_import_jobs
  for each row execute function public.touch_recipe_import_jobs_updated_at();

create or replace function public.touch_recipe_import_results_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipe_import_results_set_updated_at on public.recipe_import_results;
create trigger recipe_import_results_set_updated_at
  before update on public.recipe_import_results
  for each row execute function public.touch_recipe_import_results_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: admin-only via service_role Edge Functions (no client policies)
-- ---------------------------------------------------------------------------
alter table public.recipe_import_batches enable row level security;
alter table public.recipe_import_jobs enable row level security;
alter table public.recipe_import_results enable row level security;
alter table public.recipe_import_artifacts enable row level security;

-- ---------------------------------------------------------------------------
-- Private import-artifacts bucket (MediaStorage namespace; full provider in #54)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-import-artifacts',
  'recipe-import-artifacts',
  false,
  52428800,
  array[
    'text/plain',
    'text/html',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No authenticated Storage policies: artifacts are service_role / MediaStorageProvider only.

-- ---------------------------------------------------------------------------
-- Batch summary refresh helper (service_role)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_recipe_import_batch_summary(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_imported integer;
  v_needs_review integer;
  v_failed integer;
  v_duplicate integer;
  v_pending integer;
begin
  select
    count(*)::integer,
    count(*) filter (where status = 'imported')::integer,
    count(*) filter (where status = 'needs_review')::integer,
    count(*) filter (where status = 'failed')::integer,
    count(*) filter (where status = 'duplicate' or duplicate_status = 'exact')::integer,
    count(*) filter (where status in ('pending', 'running'))::integer
  into v_total, v_imported, v_needs_review, v_failed, v_duplicate, v_pending
  from public.recipe_import_jobs
  where batch_id = p_batch_id;

  update public.recipe_import_batches
  set
    total = coalesce(v_total, 0),
    imported = coalesce(v_imported, 0),
    needs_review = coalesce(v_needs_review, 0),
    failed = coalesce(v_failed, 0),
    duplicate = coalesce(v_duplicate, 0),
    completed_at = case
      when coalesce(v_pending, 0) = 0 and coalesce(v_total, 0) > 0 then coalesce(completed_at, now())
      else null
    end
  where id = p_batch_id;
end;
$$;

revoke all on function public.refresh_recipe_import_batch_summary(uuid) from public;
grant execute on function public.refresh_recipe_import_batch_summary(uuid) to service_role;
