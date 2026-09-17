-- Expand profiles to full User Profile shape (Auth + User Service).
-- email is synced from auth.users; third-party OAuth tokens are never stored.

alter table public.profiles
  add column if not exists email text,
  add column if not exists avatar text,
  add column if not exists locale text,
  add column if not exists timezone text;

comment on table public.profiles is 'User profile; owned by auth.users.id. No third-party OAuth tokens.';
comment on column public.profiles.avatar is 'Storage object path or signed URL reference for user avatar.';
comment on column public.profiles.locale is 'BCP 47 locale, e.g. en-US.';
comment on column public.profiles.timezone is 'IANA timezone, e.g. Asia/Tokyo.';

create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();

-- Keep profile in sync on signup (email + display name from provider metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar)
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
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar = coalesce(public.profiles.avatar, excluded.avatar),
    updated_at = now();
  return new;
end;
$$;

-- Sync email when auth.users.email changes.
create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_updated();

-- Clients may update own profile fields except id (PK) — email is best-effort sync only.
-- No delete policy: account deletion goes through delete-account Edge Function (service role).
