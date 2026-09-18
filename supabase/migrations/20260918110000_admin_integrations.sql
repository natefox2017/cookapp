-- Issue #63: Admin Integrations connection status
-- Health + non-secret config + encrypted secrets (write-only; never returned plaintext).

create table if not exists public.integration_configs (
  integration_id text primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint integration_configs_id_nonempty check (char_length(trim(integration_id)) > 0)
);

comment on table public.integration_configs is
  'Non-secret integration knobs (issuer ids, key ids). Secrets live in integration_secrets.';

create table if not exists public.integration_secrets (
  secret_ref text primary key,
  integration_id text not null,
  ciphertext text not null,
  nonce text not null,
  key_version integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint integration_secrets_ref_nonempty check (char_length(trim(secret_ref)) > 0),
  constraint integration_secrets_ciphertext_nonempty check (char_length(ciphertext) > 0),
  constraint integration_secrets_nonce_nonempty check (char_length(nonce) > 0)
);

create index if not exists integration_secrets_integration_id_idx
  on public.integration_secrets (integration_id);

comment on table public.integration_secrets is
  'Server-side integration secrets (ASC API key, optional RC API key). AES-GCM ciphertext only.';

create table if not exists public.integration_health (
  integration_id text primary key,
  status text not null
    check (status in ('connected', 'not_configured', 'degraded', 'future_reserved')),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  last_checked_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.integration_health is
  'Last known connection probe results for Admin Integrations (#63). Never stores secrets.';

-- Seed known integrations (status recomputed live; rows track last probe only)
insert into public.integration_health (integration_id, status, details)
values
  ('supabase', 'not_configured', '{"source":"seed"}'::jsonb),
  ('revenuecat', 'not_configured', '{"source":"seed"}'::jsonb),
  ('app_store_connect', 'not_configured', '{"source":"seed"}'::jsonb),
  ('ai_gateway', 'not_configured', '{"source":"seed"}'::jsonb),
  ('google_play', 'future_reserved', '{"source":"seed","reserved":true}'::jsonb)
on conflict (integration_id) do nothing;

alter table public.integration_configs enable row level security;
alter table public.integration_secrets enable row level security;
alter table public.integration_health enable row level security;

revoke all on table public.integration_configs from public, anon, authenticated;
revoke all on table public.integration_secrets from public, anon, authenticated;
revoke all on table public.integration_health from public, anon, authenticated;

grant all on table public.integration_configs to service_role;
grant all on table public.integration_secrets to service_role;
grant all on table public.integration_health to service_role;
