-- App Store analytics + financial report sync (Issue #59 / Backend V2 P1)
-- Tables: store_analytics_daily, financial_report_rows, store_sync_runs,
--         store_integrations, store_secrets.
-- Access: service_role Edge Functions only. No PostgREST client policies.
-- Rules: missing Apple data must NOT be filled with 0; Analytics vs Financial
--        never merge into one "final revenue" field; Google Play = Future Reserved.

-- ---------------------------------------------------------------------------
-- Encrypted store secrets (ASC private key etc.). Ciphertext only.
-- ---------------------------------------------------------------------------
create table if not exists public.store_secrets (
  id uuid primary key default gen_random_uuid(),
  secret_ref text not null unique,
  ciphertext text not null,
  nonce text not null,
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_secrets_ref_nonempty check (char_length(trim(secret_ref)) > 0),
  constraint store_secrets_ciphertext_nonempty check (char_length(ciphertext) > 0)
);

comment on table public.store_secrets is
  'Server-side App Store / Play integration secrets. AES-GCM ciphertext only; never expose via Admin/App APIs.';

alter table public.store_secrets enable row level security;
revoke all on table public.store_secrets from public, anon, authenticated;
grant all on table public.store_secrets to service_role;

-- ---------------------------------------------------------------------------
-- Integration connection registry (status only; no plaintext secrets)
-- ---------------------------------------------------------------------------
create table if not exists public.store_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique
    check (provider in ('apple_app_store', 'google_play')),
  display_name text not null,
  platform text not null check (platform in ('ios', 'android')),
  store text not null check (store in ('app_store', 'google_play')),
  status text not null default 'not_configured'
    check (status in (
      'not_configured',
      'configured',
      'degraded',
      'error',
      'future_reserved'
    )),
  -- Non-secret config (issuer/key ids, vendor number, app apple id)
  issuer_id text,
  key_id text,
  vendor_number text,
  app_apple_id text,
  secret_ref text references public.store_secrets (secret_ref) on delete set null,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_integrations_display_name_nonempty
    check (char_length(trim(display_name)) > 0)
);

create index if not exists store_integrations_status_idx
  on public.store_integrations (status);

comment on table public.store_integrations is
  'Store provider connection status. Secrets via secret_ref only. Google Play stays future_reserved until Android.';

alter table public.store_integrations enable row level security;
revoke all on table public.store_integrations from public, anon, authenticated;
grant all on table public.store_integrations to service_role;

-- Seed Apple (implementable) + Google Play (reserved). Idempotent.
insert into public.store_integrations (
  provider, display_name, platform, store, status, metadata
)
values
  (
    'apple_app_store',
    'Apple App Store Connect',
    'ios',
    'app_store',
    'not_configured',
    jsonb_build_object(
      'analytics', 'app_store_connect_analytics',
      'financial', 'apple_financial_reports',
      'issue', 59
    )
  ),
  (
    'google_play',
    'Google Play Console',
    'android',
    'google_play',
    'future_reserved',
    jsonb_build_object(
      'note', 'Future Reserved — no credentials, sync jobs, or fake Android series',
      'issue', 59
    )
  )
on conflict (provider) do nothing;

-- ---------------------------------------------------------------------------
-- Unified sync / job runs for store providers (feeds Ops Jobs in #60)
-- ---------------------------------------------------------------------------
create table if not exists public.store_sync_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null
    check (job_type in (
      'store_analytics_sync',
      'financial_report_sync'
    )),
  provider text not null
    check (provider in ('apple_app_store', 'google_play')),
  status text not null default 'pending'
    check (status in (
      'pending',
      'running',
      'succeeded',
      'failed',
      'skipped_not_configured',
      'skipped_reserved'
    )),
  triggered_by text not null default 'manual'
    check (triggered_by in ('manual', 'cron', 'worker')),
  actor_admin_id uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  rows_upserted integer not null default 0
    check (rows_upserted >= 0),
  error_code text,
  error_message text,
  cursor_token text,
  range_start date,
  range_end date,
  request_id text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists store_sync_runs_provider_started_idx
  on public.store_sync_runs (provider, started_at desc);
create index if not exists store_sync_runs_job_type_started_idx
  on public.store_sync_runs (job_type, started_at desc);
create index if not exists store_sync_runs_status_idx
  on public.store_sync_runs (status);

comment on table public.store_sync_runs is
  'Store analytics / financial sync job runs. Google Play runs must stay skipped_reserved until Android.';

alter table public.store_sync_runs enable row level security;
revoke all on table public.store_sync_runs from public, anon, authenticated;
grant all on table public.store_sync_runs to service_role;

-- ---------------------------------------------------------------------------
-- Daily store analytics (operational / acquisition grain)
-- metric_value is nullable: privacy threshold / not returned → NULL, never invent 0.
-- ---------------------------------------------------------------------------
create table if not exists public.store_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  platform text not null check (platform in ('ios', 'android')),
  store text not null check (store in ('app_store', 'google_play')),
  territory text not null default '',
  acquisition_source text not null default '',
  metric_key text not null
    check (metric_key in (
      'first_time_downloads',
      'redownloads',
      'total_downloads',
      'units',
      'product_page_views',
      'impressions',
      'paying_users',
      'purchases',
      'sessions',
      'installs',
      'deletions',
      'other'
    )),
  -- NULL means Apple did not return a value (privacy / insufficient) — do NOT coerce to 0
  metric_value numeric(20, 4),
  data_status text not null default 'available'
    check (data_status in (
      'available',
      'insufficient',
      'not_returned',
      'not_configured'
    )),
  provider_source text not null
    check (provider_source in (
      'app_store_connect_analytics',
      'sales_and_trends',
      'google_play_console',
      'manual'
    )),
  estimated boolean not null default true,
  sync_run_id uuid references public.store_sync_runs (id) on delete set null,
  synced_at timestamptz not null default now(),
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_analytics_daily_grain_unique unique (
    metric_date,
    platform,
    store,
    territory,
    acquisition_source,
    metric_key,
    provider_source
  )
);

create index if not exists store_analytics_daily_date_idx
  on public.store_analytics_daily (metric_date desc);
create index if not exists store_analytics_daily_platform_store_idx
  on public.store_analytics_daily (platform, store);
create index if not exists store_analytics_daily_metric_key_idx
  on public.store_analytics_daily (metric_key);
create index if not exists store_analytics_daily_sync_run_idx
  on public.store_analytics_daily (sync_run_id);

comment on table public.store_analytics_daily is
  'Normalized daily store analytics. Missing Apple values stay NULL (never fill 0). Not final financial truth.';
comment on column public.store_analytics_daily.metric_value is
  'Nullable aggregate. Privacy threshold / Apple omitted → NULL. Forbidden: invent zeros.';
comment on column public.store_analytics_daily.territory is
  'Apple territory as reported. Never substitute device locale / IP country.';

create or replace function public.touch_store_analytics_daily_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_analytics_daily_set_updated_at on public.store_analytics_daily;
create trigger store_analytics_daily_set_updated_at
  before update on public.store_analytics_daily
  for each row execute function public.touch_store_analytics_daily_updated_at();

alter table public.store_analytics_daily enable row level security;
revoke all on table public.store_analytics_daily from public, anon, authenticated;
grant all on table public.store_analytics_daily to service_role;

-- ---------------------------------------------------------------------------
-- Financial report rows (final proceeds / reconciliation grain)
-- Kept separate from store_analytics_daily — never merge into one revenue field.
-- ---------------------------------------------------------------------------
create table if not exists public.financial_report_rows (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('ios', 'android')),
  store text not null check (store in ('app_store', 'google_play')),
  fiscal_period text not null,
  report_date date,
  territory text,
  currency text,
  product_id text,
  units integer,
  gross_amount numeric(20, 4),
  developer_proceeds numeric(20, 4),
  taxes numeric(20, 4),
  adjustments numeric(20, 4),
  exchange_rate numeric(20, 8),
  report_status text not null default 'final'
    check (report_status in ('preliminary', 'final', 'adjusted', 'unavailable')),
  provider_source text not null
    check (provider_source in (
      'apple_financial_reports',
      'google_play_financial_reports',
      'manual'
    )),
  provider_row_key text not null,
  sync_run_id uuid references public.store_sync_runs (id) on delete set null,
  synced_at timestamptz not null default now(),
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_report_rows_provider_key_unique
    unique (provider_source, provider_row_key),
  constraint financial_report_rows_fiscal_period_nonempty
    check (char_length(trim(fiscal_period)) > 0)
);

create index if not exists financial_report_rows_fiscal_idx
  on public.financial_report_rows (fiscal_period desc);
create index if not exists financial_report_rows_platform_store_idx
  on public.financial_report_rows (platform, store);
create index if not exists financial_report_rows_sync_run_idx
  on public.financial_report_rows (sync_run_id);

comment on table public.financial_report_rows is
  'Platform financial report rows for reconciliation. Separate from analytics; final_proceeds live here only.';
comment on column public.financial_report_rows.developer_proceeds is
  'Confirmed developer proceeds from financial reports — not estimated analytics revenue.';

create or replace function public.touch_financial_report_rows_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists financial_report_rows_set_updated_at on public.financial_report_rows;
create trigger financial_report_rows_set_updated_at
  before update on public.financial_report_rows
  for each row execute function public.touch_financial_report_rows_updated_at();

alter table public.financial_report_rows enable row level security;
revoke all on table public.financial_report_rows from public, anon, authenticated;
grant all on table public.financial_report_rows to service_role;
