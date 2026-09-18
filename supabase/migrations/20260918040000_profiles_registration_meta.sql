-- Admin Users (#44): registration IP / provider / device on profiles.
-- Live Admin path reads these columns via admin-users Edge Function.
-- Never store third-party OAuth tokens — provider label only.

alter table public.profiles
  add column if not exists registration_ip text,
  add column if not exists registration_provider text
    check (
      registration_provider is null
      or registration_provider in ('apple', 'google', 'email', 'unknown')
    ),
  add column if not exists device_type text
    check (
      device_type is null
      or device_type in ('ios', 'android', 'web', 'unknown')
    ),
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deleted'));

comment on column public.profiles.registration_ip is
  'Client IP observed at registration when legally captured; null if unknown. Not App Store territory.';
comment on column public.profiles.registration_provider is
  'Auth provider used at signup: apple | google | email | unknown. No OAuth tokens stored.';
comment on column public.profiles.device_type is
  'Device class at registration / first session: ios | android | web | unknown.';
comment on column public.profiles.account_status is
  'Admin-facing account status: active | suspended | deleted.';

create index if not exists profiles_registration_provider_idx
  on public.profiles (registration_provider);
create index if not exists profiles_device_type_idx
  on public.profiles (device_type);
create index if not exists profiles_account_status_idx
  on public.profiles (account_status);

-- Capture provider on signup from Supabase Auth app metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text;
  v_device text;
begin
  v_provider := lower(coalesce(new.raw_app_meta_data ->> 'provider', ''));
  if v_provider not in ('apple', 'google', 'email') then
    v_provider := 'unknown';
  end if;

  v_device := lower(coalesce(new.raw_user_meta_data ->> 'device_type', ''));
  if v_device not in ('ios', 'android', 'web') then
    v_device := 'unknown';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    avatar,
    registration_provider,
    device_type
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    v_provider,
    v_device
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar = coalesce(public.profiles.avatar, excluded.avatar),
    registration_provider = coalesce(
      public.profiles.registration_provider,
      excluded.registration_provider
    ),
    device_type = coalesce(public.profiles.device_type, excluded.device_type),
    updated_at = now();
  return new;
end;
$$;

-- Clients may set device_type / registration_ip once (first write wins).
-- Email remains auth-synced only (see coderabbit_backend_hardening).
create or replace function public.capture_registration_meta(
  p_device_type text default null,
  p_registration_ip text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_device text;
  v_row public.profiles;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_device := lower(nullif(trim(coalesce(p_device_type, '')), ''));
  if v_device is not null and v_device not in ('ios', 'android', 'web', 'unknown') then
    raise exception 'invalid device_type';
  end if;

  update public.profiles
  set
    device_type = coalesce(device_type, v_device, device_type),
    registration_ip = coalesce(registration_ip, nullif(trim(coalesce(p_registration_ip, '')), '')),
    updated_at = now()
  where id = v_uid
  returning * into v_row;

  if v_row.id is null then
    raise exception 'profile not found';
  end if;

  return v_row;
end;
$$;

revoke all on function public.capture_registration_meta(text, text) from public;
grant execute on function public.capture_registration_meta(text, text) to authenticated;
