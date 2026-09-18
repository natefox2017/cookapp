-- AI Platform core (Issue #53 / Backend V2 P0-3)
-- Providers, models, routes, usage, health + encrypted secret store.
-- Access only via service_role Edge Functions; no PostgREST client policies.
-- App/Admin never receive plaintext provider keys.

-- Ensure Owner role exists for Owner-only AI config APIs (idempotent w/ #51).
alter table public.admin_accounts
  add column if not exists role text not null default 'owner';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_accounts_role_check'
      and conrelid = 'public.admin_accounts'::regclass
  ) then
    alter table public.admin_accounts
      add constraint admin_accounts_role_check
      check (role in ('owner', 'admin', 'operator', 'readonly'));
  end if;
exception
  when duplicate_object then null;
end $$;

comment on column public.admin_accounts.role is
  'Admin RBAC role: owner | admin | operator | readonly. Owner-only for AI secrets/provider.';

-- ---------------------------------------------------------------------------
-- Encrypted secret store (ciphertext only; master key in Edge Function env)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_secrets (
  id uuid primary key default gen_random_uuid(),
  secret_ref text not null unique,
  ciphertext text not null,
  nonce text not null,
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_secrets_ref_nonempty check (char_length(trim(secret_ref)) > 0),
  constraint ai_secrets_ciphertext_nonempty check (char_length(ciphertext) > 0)
);

comment on table public.ai_secrets is
  'Server-side AI provider secrets. AES-GCM ciphertext only; never expose via Admin/App APIs.';

-- ---------------------------------------------------------------------------
-- Providers
-- ---------------------------------------------------------------------------
create table if not exists public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  protocol text not null default 'openai_compatible'
    check (protocol in ('openai_compatible')),
  base_url text not null,
  secret_ref text references public.ai_secrets (secret_ref) on delete set null,
  enabled boolean not null default true,
  request_timeout_ms integer not null default 30000
    check (request_timeout_ms between 1000 and 300000),
  max_retries integer not null default 1
    check (max_retries between 0 and 5),
  status text not null default 'unknown'
    check (status in ('unknown', 'healthy', 'degraded', 'unhealthy')),
  last_health_check_at timestamptz,
  environment text not null default 'production'
    check (environment in ('development', 'production')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_providers_name_nonempty check (char_length(trim(name)) > 0),
  constraint ai_providers_base_url_nonempty check (char_length(trim(base_url)) > 0)
);

create index if not exists ai_providers_enabled_idx on public.ai_providers (enabled);
create index if not exists ai_providers_secret_ref_idx on public.ai_providers (secret_ref);

comment on table public.ai_providers is
  'AI gateway/provider registry. Stores secret_ref only — never plaintext API keys.';

-- ---------------------------------------------------------------------------
-- Models
-- ---------------------------------------------------------------------------
create table if not exists public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.ai_providers (id) on delete cascade,
  display_name text not null,
  upstream_model_id text not null,
  enabled boolean not null default true,
  capabilities jsonb not null default '{"text":true}'::jsonb,
  context_window integer,
  max_output_tokens integer,
  cost_input_per_1m numeric(18, 6),
  cost_output_per_1m numeric(18, 6),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_models_display_name_nonempty check (char_length(trim(display_name)) > 0),
  constraint ai_models_upstream_nonempty check (char_length(trim(upstream_model_id)) > 0),
  constraint ai_models_provider_upstream_unique unique (provider_id, upstream_model_id)
);

create index if not exists ai_models_provider_id_idx on public.ai_models (provider_id);
create index if not exists ai_models_enabled_idx on public.ai_models (enabled);

comment on table public.ai_models is
  'Registered upstream models. Business code must use ai_routes.route_key, not model ids.';

-- ---------------------------------------------------------------------------
-- Logical use-case routes
-- ---------------------------------------------------------------------------
create table if not exists public.ai_routes (
  id uuid primary key default gen_random_uuid(),
  route_key text not null unique,
  primary_model_id uuid references public.ai_models (id) on delete set null,
  fallback_model_ids uuid[] not null default '{}',
  timeout_ms integer not null default 60000
    check (timeout_ms between 1000 and 300000),
  max_retries integer not null default 1
    check (max_retries between 0 and 3),
  temperature numeric(4, 3),
  max_output_tokens integer,
  structured_schema_key text,
  enabled boolean not null default true,
  reserved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_routes_key_nonempty check (char_length(trim(route_key)) > 0),
  constraint ai_routes_fallback_limit check (cardinality(fallback_model_ids) <= 3)
);

create index if not exists ai_routes_enabled_idx on public.ai_routes (enabled);

comment on table public.ai_routes is
  'Logical AI use-case routes (route_key → primary + limited fallback models).';

-- ---------------------------------------------------------------------------
-- Usage events (metadata only; no full prompt/response by default)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  route_key text not null,
  provider_id uuid references public.ai_providers (id) on delete set null,
  model_id uuid references public.ai_models (id) on delete set null,
  final_model_id uuid references public.ai_models (id) on delete set null,
  status text not null
    check (status in ('success', 'error', 'timeout', 'fallback_exhausted', 'circuit_open')),
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(18, 8),
  retry_count integer not null default 0,
  error_code text,
  attempted_models jsonb not null default '[]'::jsonb,
  user_id uuid,
  admin_id uuid,
  source_job_id text,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_request_id_nonempty check (char_length(trim(request_id)) > 0)
);

create index if not exists ai_usage_events_created_at_idx
  on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_route_key_idx
  on public.ai_usage_events (route_key);
create index if not exists ai_usage_events_provider_id_idx
  on public.ai_usage_events (provider_id);
create index if not exists ai_usage_events_request_id_idx
  on public.ai_usage_events (request_id);

comment on table public.ai_usage_events is
  'AI invocation metadata. Does not store full prompts/responses by default.';

-- ---------------------------------------------------------------------------
-- Provider health / circuit breaker state
-- ---------------------------------------------------------------------------
create table if not exists public.ai_provider_health (
  provider_id uuid primary key references public.ai_providers (id) on delete cascade,
  status text not null default 'unknown'
    check (status in ('unknown', 'healthy', 'degraded', 'unhealthy')),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  consecutive_failures integer not null default 0
    check (consecutive_failures >= 0),
  circuit_open_until timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.ai_provider_health is
  'Per-provider health + temporary circuit-open window for AIRouter.';

-- ---------------------------------------------------------------------------
-- RLS: service_role only (no anon/authenticated PostgREST access)
-- ---------------------------------------------------------------------------
alter table public.ai_secrets enable row level security;
alter table public.ai_providers enable row level security;
alter table public.ai_models enable row level security;
alter table public.ai_routes enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.ai_provider_health enable row level security;

revoke all on table public.ai_secrets from public, anon, authenticated;
revoke all on table public.ai_providers from public, anon, authenticated;
revoke all on table public.ai_models from public, anon, authenticated;
revoke all on table public.ai_routes from public, anon, authenticated;
revoke all on table public.ai_usage_events from public, anon, authenticated;
revoke all on table public.ai_provider_health from public, anon, authenticated;

grant all on table public.ai_secrets to service_role;
grant all on table public.ai_providers to service_role;
grant all on table public.ai_models to service_role;
grant all on table public.ai_routes to service_role;
grant all on table public.ai_usage_events to service_role;
grant all on table public.ai_provider_health to service_role;

-- ---------------------------------------------------------------------------
-- Seed first logical routes (models assigned later via Admin)
-- ---------------------------------------------------------------------------
insert into public.ai_routes (route_key, enabled, reserved, structured_schema_key)
values
  ('recipe_import_text', true, false, 'recipe_import_v1'),
  ('recipe_import_vision', true, false, 'recipe_import_v1'),
  ('recipe_quality_check', true, false, 'recipe_quality_v1'),
  ('assistant_default', false, true, null),
  ('assistant_vision', false, true, null)
on conflict (route_key) do nothing;
