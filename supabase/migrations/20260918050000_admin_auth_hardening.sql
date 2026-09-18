-- Admin auth hardening (Issue #51 / Backend V2 P0-1)
-- Production must not rely on default admin/admin; roles reserved for RBAC.

alter table public.admin_accounts
  add column if not exists role text not null default 'owner'
    check (role in ('owner', 'admin', 'operator', 'readonly')),
  add column if not exists is_default_seed boolean not null default false,
  add column if not exists must_change_password boolean not null default false;

comment on column public.admin_accounts.role is
  'Admin RBAC role: owner | admin | operator | readonly. Owner-only for secrets/financial.';
comment on column public.admin_accounts.is_default_seed is
  'True while account is the local/dev default seed and has not been bootstrapped.';
comment on column public.admin_accounts.must_change_password is
  'Force password rotation after seed/bootstrap or admin reset.';

-- Existing seeded admin remains the default seed until bootstrapped / password changed.
update public.admin_accounts
set
  role = coalesce(nullif(role, ''), 'owner'),
  is_default_seed = true,
  must_change_password = true
where username = 'admin';

create or replace function public.admin_password_is_strong(p_password text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_password is null or char_length(p_password) < 12 then
    return false;
  end if;
  if p_password !~ '[A-Z]' then
    return false;
  end if;
  if p_password !~ '[a-z]' then
    return false;
  end if;
  if p_password !~ '[0-9]' then
    return false;
  end if;
  if lower(p_password) in ('admin', 'password', 'password123', 'cookappadmin') then
    return false;
  end if;
  return true;
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
  if not public.admin_password_is_strong(p_new_password) then
    raise exception 'new password does not meet strength policy' using errcode = '22023';
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
    password_hash = crypt(p_new_password, gen_salt('bf')),
    is_default_seed = false,
    must_change_password = false,
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

-- Bootstrap / replace default seed credentials (no prior session).
-- Verifies optional current default password when a seed row exists.
create or replace function public.admin_bootstrap_owner(
  p_username text,
  p_new_password text,
  p_current_password text default null
)
returns table (id uuid, username text, role text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  seed public.admin_accounts%rowtype;
  uname text := lower(trim(p_username));
begin
  if uname is null or char_length(uname) < 3 then
    raise exception 'invalid username' using errcode = '22023';
  end if;
  if not public.admin_password_is_strong(p_new_password) then
    raise exception 'new password does not meet strength policy' using errcode = '22023';
  end if;

  select * into seed
  from public.admin_accounts a
  where a.is_default_seed = true
  order by a.created_at
  limit 1;

  if found then
    if p_current_password is null
      or seed.password_hash is distinct from crypt(p_current_password, seed.password_hash) then
      raise exception 'current default password required' using errcode = '22023';
    end if;

    update public.admin_accounts
    set
      username = uname,
      password_hash = crypt(p_new_password, gen_salt('bf')),
      role = 'owner',
      is_default_seed = false,
      must_change_password = false,
      updated_at = now()
    where id = seed.id;

    update public.admin_sessions
    set revoked_at = now()
    where admin_id = seed.id
      and revoked_at is null;

    return query
    select a.id, a.username, a.role
    from public.admin_accounts a
    where a.id = seed.id;
    return;
  end if;

  -- No seed: only allow bootstrap when zero accounts exist.
  if exists (select 1 from public.admin_accounts) then
    raise exception 'bootstrap not available' using errcode = '22023';
  end if;

  insert into public.admin_accounts (
    username, password_hash, role, is_default_seed, must_change_password
  ) values (
    uname, crypt(p_new_password, gen_salt('bf')), 'owner', false, false
  )
  returning
    public.admin_accounts.id,
    public.admin_accounts.username,
    public.admin_accounts.role
  into id, username, role;

  return next;
end;
$$;

revoke all on function public.admin_password_is_strong(text) from public;
revoke all on function public.admin_bootstrap_owner(text, text, text) from public;
grant execute on function public.admin_password_is_strong(text) to service_role;
grant execute on function public.admin_change_password(uuid, text, text) to service_role;
grant execute on function public.admin_bootstrap_owner(text, text, text) to service_role;
