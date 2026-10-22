-- Profile photos.
--
-- Files live in the public Storage bucket "avatars" as <student id>/<file>,
-- 256×256 WebP (or JPEG where the browser cannot encode WebP), at most 512 KB.
-- Anyone can view them (they appear on Feed cards); a student can only add,
-- replace or delete files in their own folder. users.avatar_path points to the
-- current file and is changed only through set_my_avatar / remove_my_avatar.

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Who is the current student (usable in Storage policies)
-- ---------------------------------------------------------------------------
-- Storage policies run as the caller (anon / authenticated), which cannot call
-- private.current_user_id() directly, so this thin wrapper exposes only the id.
create or replace function public.my_student_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_id();
$$;

revoke execute on function public.my_student_id() from public;
grant  execute on function public.my_student_id() to anon, authenticated;
comment on function public.my_student_id() is 'Id of the current student (demo account until sign-in). Used by the avatars Storage policies.';

-- ---------------------------------------------------------------------------
-- Storage policies: own folder only
-- ---------------------------------------------------------------------------
create policy avatars_insert_own on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.my_student_id()::text);

create policy avatars_update_own on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.my_student_id()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.my_student_id()::text);

create policy avatars_delete_own on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.my_student_id()::text);

-- Listing / reading through the API: own folder only (public URLs work for everyone).
create policy avatars_select_own on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.my_student_id()::text);

-- ---------------------------------------------------------------------------
-- users.avatar_path
-- ---------------------------------------------------------------------------
alter table public.users
  add column avatar_path text,
  add constraint check_avatar_path check (avatar_path is null or avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$');

comment on column public.users.avatar_path is 'Path of the profile photo in the avatars bucket, or null for initials.';

/** Points my profile at a photo I uploaded to my own folder. */
create or replace function public.set_my_avatar(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.current_user_id();
begin
  if v_user is null or p_path is null or split_part(p_path, '/', 1) <> v_user::text then
    raise exception 'The photo must be in your own folder' using errcode = 'check_violation';
  end if;
  update public.users set avatar_path = p_path where id = v_user;
end;
$$;

/** Back to initials (the app deletes the file itself). */
create or replace function public.remove_my_avatar()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.users set avatar_path = null where id = private.current_user_id();
$$;

revoke execute on function public.set_my_avatar(text) from public;
revoke execute on function public.remove_my_avatar()  from public;
grant  execute on function public.set_my_avatar(text) to anon, authenticated;
grant  execute on function public.remove_my_avatar()  to anon, authenticated;

comment on function public.set_my_avatar(text) is 'Sets the current student''s profile photo.';
comment on function public.remove_my_avatar()  is 'Removes the current student''s profile photo.';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261022180000', 'avatars')
on conflict (version) do nothing;
