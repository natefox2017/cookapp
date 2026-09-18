-- Admin audit log + observability foundation (Issue #57)
-- Privileged Admin actions only. Never store secret values in diffs.
-- Service-role Edge Functions write; no client PostgREST access.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_accounts (id) on delete set null,
  actor_username text,
  action text not null,
  object_type text not null,
  object_id text,
  before_diff jsonb,
  after_diff jsonb,
  request_id text,
  correlation_id text,
  job_id text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint admin_audit_logs_action_nonempty check (char_length(trim(action)) > 0),
  constraint admin_audit_logs_object_type_nonempty check (char_length(trim(object_type)) > 0)
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_admin_id_idx
  on public.admin_audit_logs (actor_admin_id);
create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs (action);
create index if not exists admin_audit_logs_object_idx
  on public.admin_audit_logs (object_type, object_id);
create index if not exists admin_audit_logs_request_id_idx
  on public.admin_audit_logs (request_id)
  where request_id is not null;
create index if not exists admin_audit_logs_correlation_id_idx
  on public.admin_audit_logs (correlation_id)
  where correlation_id is not null;
create index if not exists admin_audit_logs_job_id_idx
  on public.admin_audit_logs (job_id)
  where job_id is not null;

alter table public.admin_audit_logs enable row level security;
-- Intentionally no policies: anon/authenticated cannot read or write via PostgREST.

revoke all on table public.admin_audit_logs from public, anon, authenticated;
grant all on table public.admin_audit_logs to service_role;

comment on table public.admin_audit_logs is
  'Append-only audit of privileged Admin actions. Diffs must be secret-redacted. Issue #57.';
comment on column public.admin_audit_logs.before_diff is
  'Safe JSON snapshot/diff before mutation. Secrets redacted to [REDACTED].';
comment on column public.admin_audit_logs.after_diff is
  'Safe JSON snapshot/diff after mutation. Secrets redacted to [REDACTED].';
comment on column public.admin_audit_logs.request_id is
  'Per-request id (X-Request-Id) for log correlation.';
comment on column public.admin_audit_logs.correlation_id is
  'Cross-service correlation id (X-Correlation-Id); defaults to request_id.';
comment on column public.admin_audit_logs.job_id is
  'Optional async job / sync run id (X-Job-Id) for import/provider webhooks.';
