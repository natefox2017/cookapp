-- Single recipes table: system_recommended vs user_owned (Issue #104)
-- Owner decision: do NOT split system vs user into separate tables.
-- Discriminate with library_kind + publish status; Admin never exposes user recipe bodies.

-- library_kind: who owns the row
alter table public.recipes
  add column if not exists library_kind text not null default 'user_owned'
    check (library_kind in ('user_owned', 'system_recommended'));

-- Publish lifecycle for system recipes (user rows stay 'user' / unused for publish)
alter table public.recipes
  add column if not exists publish_status text not null default 'draft'
    check (publish_status in ('draft', 'published', 'archived', 'user'));

-- Provenance for system / import rows
alter table public.recipes
  add column if not exists source_url text;

alter table public.recipes
  add column if not exists source_platform text;

alter table public.recipes
  add column if not exists source_attribution text;

alter table public.recipes
  add column if not exists import_job_id uuid
    references public.recipe_import_jobs (id) on delete set null;

alter table public.recipes
  add column if not exists published_at timestamptz;

alter table public.recipes
  add column if not exists created_by_admin_id uuid
    references public.admin_accounts (id) on delete set null;

-- System recipes do not forge a user owner; allow null user_id for system_recommended.
alter table public.recipes
  alter column user_id drop not null;

-- Existing rows are user-owned personal recipes.
update public.recipes
set
  library_kind = 'user_owned',
  publish_status = 'user'
where library_kind = 'user_owned'
  and publish_status = 'draft'
  and user_id is not null;

-- Integrity: user_owned requires user_id; system_recommended forbids user_id.
alter table public.recipes
  drop constraint if exists recipes_library_kind_owner_chk;

alter table public.recipes
  add constraint recipes_library_kind_owner_chk check (
    (library_kind = 'user_owned' and user_id is not null and publish_status = 'user')
    or (library_kind = 'system_recommended' and user_id is null and publish_status in ('draft', 'published', 'archived'))
  );

create index if not exists recipes_library_kind_idx
  on public.recipes (library_kind);

create index if not exists recipes_publish_status_idx
  on public.recipes (publish_status)
  where library_kind = 'system_recommended';

create index if not exists recipes_system_source_url_idx
  on public.recipes (source_url)
  where library_kind = 'system_recommended' and source_url is not null;

-- RLS: users still only see own recipes; published system recipes readable for Discover.
drop policy if exists "recipes_select_own" on public.recipes;
create policy "recipes_select_own_or_published_system"
  on public.recipes for select to authenticated
  using (
    auth.uid() = user_id
    or (library_kind = 'system_recommended' and publish_status = 'published')
  );

-- Inserts from JWT clients remain user-owned only (trigger still sets user_id).
drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own"
  on public.recipes for insert to authenticated
  with check (
    auth.uid() = user_id
    and library_kind = 'user_owned'
    and publish_status = 'user'
  );

drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own"
  on public.recipes for update to authenticated
  using (auth.uid() = user_id and library_kind = 'user_owned')
  with check (auth.uid() = user_id and library_kind = 'user_owned' and publish_status = 'user');

drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own"
  on public.recipes for delete to authenticated
  using (auth.uid() = user_id and library_kind = 'user_owned');

-- Owner trigger: JWT inserts force user ownership; service_role can insert system rows.
create or replace function public.recipes_set_owner()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.user_id = auth.uid();
    new.library_kind = 'user_owned';
    new.publish_status = 'user';
  end if;
  return new;
end;
$$;

comment on column public.recipes.library_kind is
  'user_owned = private user library; system_recommended = platform ops content. Issue #104.';
comment on column public.recipes.publish_status is
  'System recipes: draft|published|archived. User recipes: user.';

-- Admin import destination default (shared pipeline → system library when destination null).
insert into public.runtime_config (key, value, description) values
  (
    'admin_import_destination',
    '"system_recommended"'::jsonb,
    'Admin AI Import writes library_kind=system_recommended (never a user library)'
  ),
  (
    'ai_import_confidence_threshold',
    '0.75'::jsonb,
    'Minimum overall confidence for auto-import without review'
  ),
  (
    'maintenance_mode',
    'false'::jsonb,
    'When true, clients should show maintenance; Admin can still operate'
  ),
  (
    'supported_import_sources',
    '["web","tiktok","instagram","youtube"]'::jsonb,
    'Admin-supported import source platforms'
  )
on conflict (key) do nothing;
