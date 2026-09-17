-- Security hardening from Supabase advisors:
-- 1) Fix mutable search_path on trigger helpers
-- 2) Revoke EXECUTE on SECURITY DEFINER helpers from anon/public
-- 3) Keep ownership helpers callable only by authenticated (for RLS)

-- ---------------------------------------------------------------------------
-- search_path on trigger / helper functions
-- ---------------------------------------------------------------------------
create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_ingredients_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_recipes_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.recipes_set_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.collections_set_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.touch_collections_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.grocery_lists_set_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.touch_grocery_lists_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_grocery_items_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.meal_plans_set_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.touch_meal_plans_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.pantry_items_set_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.touch_pantry_items_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_subscription_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.storage_object_belongs_to_user(object_name text)
returns boolean
language sql
stable
set search_path = public
as $$
  select split_part(object_name, '/', 1) = auth.uid()::text;
$$;

-- ---------------------------------------------------------------------------
-- Revoke public/anon EXECUTE on privileged / trigger-oriented functions
-- ---------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_updated() from public, anon, authenticated;
-- Triggers run as owner; no client RPC needed.

revoke all on function public.upsert_subscription_from_revenuecat(
  uuid, text, text, text, text, text, text, timestamptz, boolean, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.upsert_subscription_from_revenuecat(
  uuid, text, text, text, text, text, text, timestamptz, boolean, text, text, jsonb
) to service_role;

-- Ownership helpers used inside RLS policies: authenticated only (not anon).
revoke all on function public.user_owns_collection(uuid) from public, anon;
revoke all on function public.user_owns_recipe(uuid) from public, anon;
revoke all on function public.user_owns_grocery_list(uuid) from public, anon;
grant execute on function public.user_owns_collection(uuid) to authenticated;
grant execute on function public.user_owns_recipe(uuid) to authenticated;
grant execute on function public.user_owns_grocery_list(uuid) to authenticated;

revoke all on function public.storage_object_belongs_to_user(text) from public, anon;
grant execute on function public.storage_object_belongs_to_user(text) to authenticated;

-- Move pg_trgm out of public when possible (advisor: extension_in_public).
create schema if not exists extensions;
do $$
begin
  if exists (
    select 1 from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_trgm' and n.nspname = 'public'
  ) then
    alter extension pg_trgm set schema extensions;
  end if;
exception
  when others then
    -- Keep usable if relocate is blocked on this plan; index already created.
    raise notice 'pg_trgm schema move skipped: %', sqlerrm;
end;
$$;
