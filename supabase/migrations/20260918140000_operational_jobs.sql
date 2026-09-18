-- Operational Jobs + Jobs & Syncs foundation (Issue #60)
-- Unified run history for cleanup / ASC sync / RC health / future Play.
-- recipe_import_jobs remains the import fact table; exposed via v_operational_jobs.
-- #58/#59 tables (payment_transactions, store_analytics_daily, …) are NOT created here —
-- aggregation probes them when present (see docs/backend/AGGREGATION_CONTRACTS.md).

-- ---------------------------------------------------------------------------
-- Expand job type registry
-- ---------------------------------------------------------------------------
insert into public.operational_job_type_registry (job_type, description)
values
  (
    'storage_cleanup_import_artifacts',
    'Delete expired recipe-import-artifacts objects. Cron / manual via storage-cleanup-import-artifacts.'
  ),
  (
    'recipe_import_worker',
    'pgmq Import Queue worker tick (recipe-import-worker). Per-item state stays on recipe_import_jobs.'
  ),
  (
    'store_analytics_sync',
    'App Store Connect Analytics → store_analytics_daily (#59). Canonical job type.'
  ),
  (
    'financial_report_sync',
    'Apple Financial Reports → financial_report_rows (#59). Never merged with Analytics revenue.'
  ),
  (
    'asc_analytics_sync',
    'Alias of store_analytics_sync for Admin Operations callers.'
  ),
  (
    'asc_financial_sync',
    'Alias of financial_report_sync for Admin Operations callers.'
  ),
  (
    'revenuecat_health_check',
    'Probe RevenueCat webhook secret + recent purchase_events freshness. Does not invent Operational status.'
  ),
  (
    'google_play_sync',
    'Future Reserved. Google Play sync is not implemented; manual run must refuse.'
  ),
  (
    'ai_gateway_health_check',
    'Probe configured AI providers (secretConfigured + last health). No fake healthy badge.'
  )
on conflict (job_type) do update set description = excluded.description;

-- ---------------------------------------------------------------------------
-- operational_jobs — unified run ledger
-- ---------------------------------------------------------------------------
create table if not exists public.operational_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null
    references public.operational_job_type_registry (job_type),
  provider text not null
    check (provider in (
      'cookapp',
      'supabase',
      'revenuecat',
      'app_store_connect',
      'google_play',
      'ai_gateway'
    )),
  status text not null default 'pending'
    check (status in (
      'pending',
      'running',
      'succeeded',
      'failed',
      'cancelled',
      'not_configured',
      'future_reserved'
    )),
  trigger text not null default 'system'
    check (trigger in ('manual', 'cron', 'webhook', 'system', 'retry')),
  started_at timestamptz,
  completed_at timestamptz,
  next_run_at timestamptz,
  rows_affected integer check (rows_affected is null or rows_affected >= 0),
  items_total integer check (items_total is null or items_total >= 0),
  items_failed integer check (items_failed is null or items_failed >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 3 check (max_retries >= 0),
  error_code text,
  error_message text,
  request_id text,
  correlation_id text,
  parent_job_id uuid references public.operational_jobs (id) on delete set null,
  related_entity_type text,
  related_entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.admin_accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_jobs_completed_after_start check (
    completed_at is null
    or started_at is null
    or completed_at >= started_at
  )
);

create index if not exists operational_jobs_type_created_idx
  on public.operational_jobs (job_type, created_at desc);
create index if not exists operational_jobs_status_idx
  on public.operational_jobs (status);
create index if not exists operational_jobs_provider_idx
  on public.operational_jobs (provider);
create index if not exists operational_jobs_created_at_idx
  on public.operational_jobs (created_at desc);

create or replace function public.touch_operational_jobs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists operational_jobs_set_updated_at on public.operational_jobs;
create trigger operational_jobs_set_updated_at
  before update on public.operational_jobs
  for each row execute function public.touch_operational_jobs_updated_at();

comment on table public.operational_jobs is
  'Unified operational job runs for Jobs & Syncs (#60). Import item state remains on recipe_import_jobs.';

alter table public.operational_jobs enable row level security;
revoke all on table public.operational_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.operational_jobs to service_role;

-- ---------------------------------------------------------------------------
-- Unified list view: operational_jobs ∪ recipe_import_jobs (mapped)
-- store_sync_runs (#59) joins when that migration lands (see AGGREGATION_CONTRACTS).
-- ---------------------------------------------------------------------------
create or replace view public.v_operational_jobs
with (security_invoker = true)
as
select
  j.id,
  j.job_type,
  j.provider,
  j.status,
  j.trigger,
  j.started_at,
  j.completed_at,
  j.next_run_at,
  j.rows_affected,
  j.items_total,
  j.items_failed,
  j.retry_count,
  j.max_retries,
  j.error_code,
  j.error_message,
  j.request_id,
  j.correlation_id,
  j.parent_job_id,
  j.related_entity_type,
  j.related_entity_id,
  j.metadata,
  j.created_by,
  j.created_at,
  j.updated_at,
  'operational_jobs'::text as source_table
from public.operational_jobs j
union all
select
  r.id,
  'recipe_import'::text as job_type,
  'cookapp'::text as provider,
  case r.status
    when 'pending' then 'pending'
    when 'running' then 'running'
    when 'imported' then 'succeeded'
    when 'needs_review' then 'succeeded'
    when 'duplicate' then 'succeeded'
    when 'failed' then 'failed'
    when 'rejected' then 'cancelled'
    else 'pending'
  end as status,
  'system'::text as trigger,
  r.started_at,
  r.completed_at,
  null::timestamptz as next_run_at,
  null::integer as rows_affected,
  1::integer as items_total,
  case when r.status = 'failed' then 1 else 0 end as items_failed,
  r.retry_count,
  3::integer as max_retries,
  r.error_code,
  r.error_message,
  null::text as request_id,
  null::text as correlation_id,
  null::uuid as parent_job_id,
  'recipe_import_job'::text as related_entity_type,
  r.id::text as related_entity_id,
  jsonb_build_object(
    'source_type', r.source_type,
    'stage', r.stage,
    'batch_id', r.batch_id,
    'confidence', r.confidence,
    'duplicate_status', r.duplicate_status
  ) as metadata,
  r.created_by,
  r.created_at,
  r.updated_at,
  'recipe_import_jobs'::text as source_table
from public.recipe_import_jobs r
union all
select
  s.id,
  s.job_type,
  case s.provider
    when 'apple_app_store' then 'app_store_connect'
    when 'google_play' then 'google_play'
    else 'cookapp'
  end as provider,
  case s.status
    when 'pending' then 'pending'
    when 'running' then 'running'
    when 'succeeded' then 'succeeded'
    when 'failed' then 'failed'
    when 'skipped_not_configured' then 'not_configured'
    when 'skipped_reserved' then 'future_reserved'
    else 'pending'
  end as status,
  case s.triggered_by
    when 'manual' then 'manual'
    when 'cron' then 'cron'
    else 'system'
  end as trigger,
  s.started_at,
  s.completed_at,
  null::timestamptz as next_run_at,
  s.rows_upserted as rows_affected,
  null::integer as items_total,
  null::integer as items_failed,
  0::integer as retry_count,
  3::integer as max_retries,
  s.error_code,
  s.error_message,
  s.request_id,
  s.correlation_id,
  null::uuid as parent_job_id,
  'store_sync_run'::text as related_entity_type,
  s.id::text as related_entity_id,
  coalesce(s.metadata, '{}'::jsonb) || jsonb_build_object(
    'range_start', s.range_start,
    'range_end', s.range_end,
    'store_provider', s.provider
  ) as metadata,
  s.actor_admin_id as created_by,
  s.created_at,
  coalesce(s.completed_at, s.started_at, s.created_at) as updated_at,
  'store_sync_runs'::text as source_table
from public.store_sync_runs s;

comment on view public.v_operational_jobs is
  'Unified Jobs & Syncs listing (#60). Maps recipe_import_jobs; operational_jobs for other providers.';

-- Ensure recipe_import is registered for the view mapping documentation.
insert into public.operational_job_type_registry (job_type, description)
values (
  'recipe_import',
  'AI Recipe Import job (fact table: recipe_import_jobs). Listed via v_operational_jobs.'
)
on conflict (job_type) do update set description = excluded.description;

grant select on public.v_operational_jobs to service_role;

-- ---------------------------------------------------------------------------
-- Integration connection status cache (no secrets; Admin Settings #63 reads this)
-- ---------------------------------------------------------------------------
create table if not exists public.integration_connection_status (
  integration_key text primary key
    check (integration_key in (
      'supabase',
      'revenuecat',
      'app_store_connect',
      'ai_gateway',
      'google_play'
    )),
  status text not null
    check (status in (
      'connected',
      'not_configured',
      'degraded',
      'unknown',
      'future_reserved'
    )),
  config_complete boolean not null default false,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_code text,
  last_error_message text,
  checked_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.integration_connection_status is
  'Cached Integrations status for Admin (#60 APIs / #63 UI). Never invent Operational; secrets never stored.';

create or replace function public.touch_integration_connection_status_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists integration_connection_status_set_updated_at
  on public.integration_connection_status;
create trigger integration_connection_status_set_updated_at
  before update on public.integration_connection_status
  for each row execute function public.touch_integration_connection_status_updated_at();

alter table public.integration_connection_status enable row level security;
revoke all on table public.integration_connection_status from public, anon, authenticated;
grant select, insert, update, delete on table public.integration_connection_status to service_role;

insert into public.integration_connection_status (integration_key, status, config_complete, details)
values
  ('supabase', 'unknown', false, '{"note":"Probed at runtime by admin-operations"}'::jsonb),
  ('revenuecat', 'not_configured', false, '{"note":"Requires REVENUECAT_WEBHOOK_SECRET"}'::jsonb),
  ('app_store_connect', 'not_configured', false, '{"note":"ASC keys — #59"}'::jsonb),
  ('ai_gateway', 'not_configured', false, '{"note":"Requires COOKAPP_AI_MASTER_KEY + providers"}'::jsonb),
  ('google_play', 'future_reserved', false, '{"note":"Android Future Reserved — no live sync"}'::jsonb)
on conflict (integration_key) do nothing;
