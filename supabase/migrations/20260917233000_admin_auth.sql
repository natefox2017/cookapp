-- Admin dashboard auth (Issue #32)
-- Local Admin Console credentials — separate from end-user Supabase Auth.
-- Access only via service_role Edge Functions; no PostgREST policies for clients.

create extension if not exists pgcrypto;

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_accounts_username_nonempty check (char_length(trim(username)) > 0)
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_accounts (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint admin_sessions_expires_after_created check (expires_at > created_at)
);

create index if not exists admin_sessions_admin_id_idx on public.admin_sessions (admin_id);
create index if not exists admin_sessions_expires_at_idx on public.admin_sessions (expires_at);

alter table public.admin_accounts enable row level security;
alter table public.admin_sessions enable row level security;

-- Intentionally no policies: anon/authenticated cannot read or write via PostgREST.
-- Edge Functions use service_role which bypasses RLS.

create or replace function public.admin_verify_credentials(
  p_username text,
  p_password text
)
returns table (id uuid, username text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select a.id, a.username
  from public.admin_accounts a
  where a.username = lower(trim(p_username))
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$;

create or replace function public.admin_change_password(
  p_admin_id uuid,
  p_current_password text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
begin
  if p_new_password is null or char_length(p_new_password) < 4 then
    raise exception 'new password too short' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.admin_accounts a
    where a.id = p_admin_id
      and a.password_hash = crypt(p_current_password, a.password_hash)
  ) into ok;

  if not ok then
    return false;
  end if;

  update public.admin_accounts
  set
    password_hash = crypt(p_new_password, gen_salt('bf', 12)),
    updated_at = now()
  where id = p_admin_id;

  update public.admin_sessions
  set revoked_at = now()
  where admin_id = p_admin_id
    and revoked_at is null
    and expires_at > now();

  return true;
end;
$$;

revoke all on function public.admin_verify_credentials(text, text) from public;
revoke all on function public.admin_change_password(uuid, text, text) from public;
grant execute on function public.admin_verify_credentials(text, text) to service_role;
grant execute on function public.admin_change_password(uuid, text, text) to service_role;

revoke all on table public.admin_accounts from public, anon, authenticated;
revoke all on table public.admin_sessions from public, anon, authenticated;
grant all on table public.admin_accounts to service_role;
grant all on table public.admin_sessions to service_role;

insert into public.admin_accounts (username, password_hash)
values ('admin', crypt('admin', gen_salt('bf', 12)))
on conflict (username) do nothing;

comment on table public.admin_accounts is
  'Local Admin Dashboard operators. Not end-user Auth. Managed by admin-auth Edge Function.';
comment on table public.admin_sessions is
  'Bearer sessions for Admin Dashboard. token_hash is sha256 of presented token.';
