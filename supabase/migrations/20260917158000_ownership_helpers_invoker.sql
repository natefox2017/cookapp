-- Ownership helpers as SECURITY INVOKER (clear advisor WARN on definer RPC exposure).
-- Safe: they only check auth.uid() against caller-visible rows under RLS.

create or replace function public.user_owns_collection(p_collection_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.collections c
    where c.id = p_collection_id and c.user_id = auth.uid()
  );
$$;

create or replace function public.user_owns_recipe(p_recipe_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = p_recipe_id and r.user_id = auth.uid()
  );
$$;

create or replace function public.user_owns_grocery_list(p_list_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.grocery_lists g
    where g.id = p_list_id and g.user_id = auth.uid()
  );
$$;

revoke all on function public.user_owns_collection(uuid) from public, anon;
revoke all on function public.user_owns_recipe(uuid) from public, anon;
revoke all on function public.user_owns_grocery_list(uuid) from public, anon;
grant execute on function public.user_owns_collection(uuid) to authenticated;
grant execute on function public.user_owns_recipe(uuid) to authenticated;
grant execute on function public.user_owns_grocery_list(uuid) to authenticated;
