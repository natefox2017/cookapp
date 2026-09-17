-- Grocery List, Meal Plan, and Pantry services.

-- ---------------------------------------------------------------------------
-- Grocery / Shopping lists
-- ---------------------------------------------------------------------------
create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_lists_name_nonempty check (char_length(trim(name)) > 0)
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.grocery_lists (id) on delete cascade,
  ingredient text not null,
  quantity numeric,
  unit text,
  category text,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_items_ingredient_nonempty check (char_length(trim(ingredient)) > 0)
);

create index if not exists grocery_lists_user_id_idx on public.grocery_lists (user_id);
create index if not exists grocery_items_list_id_idx on public.grocery_items (list_id);
create index if not exists grocery_items_completed_idx on public.grocery_items (list_id, completed);

alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;

create policy "grocery_lists_select_own"
  on public.grocery_lists for select to authenticated
  using (auth.uid() = user_id);

create policy "grocery_lists_insert_own"
  on public.grocery_lists for insert to authenticated
  with check (auth.uid() = user_id);

create policy "grocery_lists_update_own"
  on public.grocery_lists for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "grocery_lists_delete_own"
  on public.grocery_lists for delete to authenticated
  using (auth.uid() = user_id);

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

create policy "grocery_items_select_own"
  on public.grocery_items for select to authenticated
  using (public.user_owns_grocery_list(list_id));

create policy "grocery_items_insert_own"
  on public.grocery_items for insert to authenticated
  with check (public.user_owns_grocery_list(list_id));

create policy "grocery_items_update_own"
  on public.grocery_items for update to authenticated
  using (public.user_owns_grocery_list(list_id))
  with check (public.user_owns_grocery_list(list_id));

create policy "grocery_items_delete_own"
  on public.grocery_items for delete to authenticated
  using (public.user_owns_grocery_list(list_id));

create or replace function public.grocery_lists_set_owner()
returns trigger
language plpgsql
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists grocery_lists_enforce_owner on public.grocery_lists;
create trigger grocery_lists_enforce_owner
  before insert on public.grocery_lists
  for each row execute function public.grocery_lists_set_owner();

create or replace function public.touch_grocery_lists_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grocery_lists_set_updated_at on public.grocery_lists;
create trigger grocery_lists_set_updated_at
  before update on public.grocery_lists
  for each row execute function public.touch_grocery_lists_updated_at();

create or replace function public.touch_grocery_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grocery_items_set_updated_at on public.grocery_items;
create trigger grocery_items_set_updated_at
  before update on public.grocery_items
  for each row execute function public.touch_grocery_items_updated_at();

revoke all on function public.user_owns_grocery_list(uuid) from public;
grant execute on function public.user_owns_grocery_list(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Meal Plan
-- ---------------------------------------------------------------------------
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plans_unique_slot unique (user_id, plan_date, meal_type, recipe_id)
);

create index if not exists meal_plans_user_date_idx on public.meal_plans (user_id, plan_date);
create index if not exists meal_plans_recipe_id_idx on public.meal_plans (recipe_id);

alter table public.meal_plans enable row level security;

create policy "meal_plans_select_own"
  on public.meal_plans for select to authenticated
  using (auth.uid() = user_id);

create policy "meal_plans_insert_own"
  on public.meal_plans for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.user_owns_recipe(recipe_id)
  );

create policy "meal_plans_update_own"
  on public.meal_plans for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.user_owns_recipe(recipe_id)
  );

create policy "meal_plans_delete_own"
  on public.meal_plans for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.meal_plans_set_owner()
returns trigger
language plpgsql
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists meal_plans_enforce_owner on public.meal_plans;
create trigger meal_plans_enforce_owner
  before insert on public.meal_plans
  for each row execute function public.meal_plans_set_owner();

create or replace function public.touch_meal_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at
  before update on public.meal_plans
  for each row execute function public.touch_meal_plans_updated_at();

-- ---------------------------------------------------------------------------
-- Pantry
-- ---------------------------------------------------------------------------
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient text not null,
  quantity numeric,
  unit text,
  expiration_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pantry_items_ingredient_nonempty check (char_length(trim(ingredient)) > 0)
);

create index if not exists pantry_items_user_id_idx on public.pantry_items (user_id);
create index if not exists pantry_items_expiration_idx on public.pantry_items (user_id, expiration_date);

alter table public.pantry_items enable row level security;

create policy "pantry_items_select_own"
  on public.pantry_items for select to authenticated
  using (auth.uid() = user_id);

create policy "pantry_items_insert_own"
  on public.pantry_items for insert to authenticated
  with check (auth.uid() = user_id);

create policy "pantry_items_update_own"
  on public.pantry_items for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pantry_items_delete_own"
  on public.pantry_items for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.pantry_items_set_owner()
returns trigger
language plpgsql
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists pantry_items_enforce_owner on public.pantry_items;
create trigger pantry_items_enforce_owner
  before insert on public.pantry_items
  for each row execute function public.pantry_items_set_owner();

create or replace function public.touch_pantry_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pantry_items_set_updated_at on public.pantry_items;
create trigger pantry_items_set_updated_at
  before update on public.pantry_items
  for each row execute function public.touch_pantry_items_updated_at();
