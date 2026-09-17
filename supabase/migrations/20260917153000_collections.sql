-- Collection Service: named recipe collections owned by the user.

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  cover text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_name_nonempty check (char_length(trim(name)) > 0)
);

create table if not exists public.collection_recipes (
  collection_id uuid not null references public.collections (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, recipe_id)
);

create index if not exists collections_user_id_idx on public.collections (user_id);
create index if not exists collection_recipes_recipe_id_idx on public.collection_recipes (recipe_id);

alter table public.collections enable row level security;
alter table public.collection_recipes enable row level security;

create policy "collections_select_own"
  on public.collections for select to authenticated
  using (auth.uid() = user_id);

create policy "collections_insert_own"
  on public.collections for insert to authenticated
  with check (auth.uid() = user_id);

create policy "collections_update_own"
  on public.collections for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "collections_delete_own"
  on public.collections for delete to authenticated
  using (auth.uid() = user_id);

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

create policy "collection_recipes_select_own"
  on public.collection_recipes for select to authenticated
  using (public.user_owns_collection(collection_id));

create policy "collection_recipes_insert_own"
  on public.collection_recipes for insert to authenticated
  with check (
    public.user_owns_collection(collection_id)
    and public.user_owns_recipe(recipe_id)
  );

create policy "collection_recipes_delete_own"
  on public.collection_recipes for delete to authenticated
  using (public.user_owns_collection(collection_id));

create or replace function public.collections_set_owner()
returns trigger
language plpgsql
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists collections_enforce_owner on public.collections;
create trigger collections_enforce_owner
  before insert on public.collections
  for each row execute function public.collections_set_owner();

create or replace function public.touch_collections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.touch_collections_updated_at();

revoke all on function public.user_owns_collection(uuid) from public;
revoke all on function public.user_owns_recipe(uuid) from public;
grant execute on function public.user_owns_collection(uuid) to authenticated;
grant execute on function public.user_owns_recipe(uuid) to authenticated;
