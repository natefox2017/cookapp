-- Storage Service: private buckets with per-user path isolation.
-- Path convention: {user_id}/{object_name}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'recipe-covers',
    'recipe-covers',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'recipe-images',
    'recipe-images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Helper: first path segment must equal auth.uid()
create or replace function public.storage_object_belongs_to_user(object_name text)
returns boolean
language sql
stable
as $$
  select split_part(object_name, '/', 1) = auth.uid()::text;
$$;

drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "recipe_covers_select_own" on storage.objects;
drop policy if exists "recipe_covers_insert_own" on storage.objects;
drop policy if exists "recipe_covers_update_own" on storage.objects;
drop policy if exists "recipe_covers_delete_own" on storage.objects;
drop policy if exists "recipe_images_select_own" on storage.objects;
drop policy if exists "recipe_images_insert_own" on storage.objects;
drop policy if exists "recipe_images_update_own" on storage.objects;
drop policy if exists "recipe_images_delete_own" on storage.objects;

create policy "avatars_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.storage_object_belongs_to_user(name));

create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.storage_object_belongs_to_user(name));

create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.storage_object_belongs_to_user(name))
  with check (bucket_id = 'avatars' and public.storage_object_belongs_to_user(name));

create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.storage_object_belongs_to_user(name));

create policy "recipe_covers_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'recipe-covers' and public.storage_object_belongs_to_user(name));

create policy "recipe_covers_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-covers' and public.storage_object_belongs_to_user(name));

create policy "recipe_covers_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-covers' and public.storage_object_belongs_to_user(name))
  with check (bucket_id = 'recipe-covers' and public.storage_object_belongs_to_user(name));

create policy "recipe_covers_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-covers' and public.storage_object_belongs_to_user(name));

create policy "recipe_images_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'recipe-images' and public.storage_object_belongs_to_user(name));

create policy "recipe_images_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and public.storage_object_belongs_to_user(name));

create policy "recipe_images_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and public.storage_object_belongs_to_user(name))
  with check (bucket_id = 'recipe-images' and public.storage_object_belongs_to_user(name));

create policy "recipe_images_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-images' and public.storage_object_belongs_to_user(name));

revoke all on function public.storage_object_belongs_to_user(text) from public;
grant execute on function public.storage_object_belongs_to_user(text) to authenticated;
