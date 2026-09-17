-- Recipe Service: user-owned recipes with embedded ingredients / steps / nutrition (jsonb).

create extension if not exists pg_trgm;

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  cover_image text,
  cuisine text references public.cuisines (id) on delete set null,
  category text references public.meal_categories (id) on delete set null,
  tags text[] not null default '{}',
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  cooking_time integer,
  servings integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_title_nonempty check (char_length(trim(title)) > 0),
  constraint recipes_cooking_time_nonneg check (cooking_time is null or cooking_time >= 0),
  constraint recipes_servings_positive check (servings is null or servings > 0),
  constraint recipes_ingredients_is_array check (jsonb_typeof(ingredients) = 'array'),
  constraint recipes_steps_is_array check (jsonb_typeof(steps) = 'array'),
  constraint recipes_nutrition_is_object check (jsonb_typeof(nutrition) = 'object')
);

comment on column public.recipes.ingredients is
  'JSON array of {name, amount, unit, note}.';
comment on column public.recipes.steps is
  'JSON array of {order, description, image, timer}.';
comment on column public.recipes.nutrition is
  'JSON object {calories, protein, fat, carbohydrates}.';
comment on column public.recipes.cover_image is
  'Storage object path in recipe-covers bucket.';
comment on column public.recipes.cooking_time is
  'Total cooking time in minutes.';

create index if not exists recipes_user_id_idx on public.recipes (user_id);
create index if not exists recipes_created_at_idx on public.recipes (created_at desc);
create index if not exists recipes_cuisine_idx on public.recipes (cuisine);
create index if not exists recipes_category_idx on public.recipes (category);
create index if not exists recipes_tags_gin_idx on public.recipes using gin (tags);
create index if not exists recipes_title_trgm_idx on public.recipes using gin (title gin_trgm_ops);

alter table public.recipes enable row level security;

create policy "recipes_select_own"
  on public.recipes for select to authenticated
  using (auth.uid() = user_id);

create policy "recipes_insert_own"
  on public.recipes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "recipes_update_own"
  on public.recipes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recipes_delete_own"
  on public.recipes for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.touch_recipes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.touch_recipes_updated_at();

-- Force user_id from JWT on insert so clients cannot forge ownership.
create or replace function public.recipes_set_owner()
returns trigger
language plpgsql
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists recipes_enforce_owner on public.recipes;
create trigger recipes_enforce_owner
  before insert on public.recipes
  for each row execute function public.recipes_set_owner();
