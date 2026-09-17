-- Category Service: cuisine / meal category / tags (read-only reference data for clients).

create table if not exists public.cuisines (
  id text primary key,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.meal_categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.tags (
  id text primary key,
  name text not null,
  sort_order integer not null default 0
);

alter table public.cuisines enable row level security;
alter table public.meal_categories enable row level security;
alter table public.tags enable row level security;

create policy "cuisines_select_authenticated"
  on public.cuisines for select to authenticated using (true);

create policy "meal_categories_select_authenticated"
  on public.meal_categories for select to authenticated using (true);

create policy "tags_select_authenticated"
  on public.tags for select to authenticated using (true);

insert into public.cuisines (id, name, sort_order) values
  ('american', 'American', 1),
  ('italian', 'Italian', 2),
  ('french', 'French', 3),
  ('mexican', 'Mexican', 4),
  ('chinese', 'Chinese', 5),
  ('japanese', 'Japanese', 6),
  ('korean', 'Korean', 7),
  ('thai', 'Thai', 8),
  ('indian', 'Indian', 9),
  ('mediterranean', 'Mediterranean', 10)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.meal_categories (id, name, sort_order) values
  ('breakfast', 'Breakfast', 1),
  ('lunch', 'Lunch', 2),
  ('dinner', 'Dinner', 3),
  ('dessert', 'Dessert', 4),
  ('snack', 'Snack', 5),
  ('drink', 'Drink', 6)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.tags (id, name, sort_order) values
  ('vegetarian', 'Vegetarian', 1),
  ('vegan', 'Vegan', 2),
  ('gluten_free', 'Gluten Free', 3),
  ('high_protein', 'High Protein', 4),
  ('quick_meal', 'Quick Meal', 5)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

-- Ingredient catalog (shared vocabulary; user-scoped custom ingredients allowed).
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text,
  alternative_name text,
  user_id uuid references auth.users (id) on delete cascade,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_name_nonempty check (char_length(trim(name)) > 0)
);

create index if not exists ingredients_name_idx on public.ingredients (lower(name));
create index if not exists ingredients_user_id_idx on public.ingredients (user_id);
create index if not exists ingredients_category_idx on public.ingredients (category);

alter table public.ingredients enable row level security;

-- System ingredients: readable by all authenticated; not writable by clients.
-- User ingredients: full CRUD for owner only.
create policy "ingredients_select_visible"
  on public.ingredients for select to authenticated
  using (is_system = true or user_id = auth.uid());

create policy "ingredients_insert_own"
  on public.ingredients for insert to authenticated
  with check (user_id = auth.uid() and is_system = false);

create policy "ingredients_update_own"
  on public.ingredients for update to authenticated
  using (user_id = auth.uid() and is_system = false)
  with check (user_id = auth.uid() and is_system = false);

create policy "ingredients_delete_own"
  on public.ingredients for delete to authenticated
  using (user_id = auth.uid() and is_system = false);

create or replace function public.touch_ingredients_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ingredients_set_updated_at on public.ingredients;
create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.touch_ingredients_updated_at();
