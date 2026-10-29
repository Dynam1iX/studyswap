-- Files on a card: photos or PDFs with the exact tasks a student is stuck on
-- ("Needs help" side only).
--
-- * Storage bucket card-files (private): photos (compressed on the phone to WebP/JPEG)
--   and PDFs, at most 10 MB each. Path: <student id>/<random uuid>.<webp|jpg|pdf>.
-- * Table card_files links a file to a card: at most 3 per card.
-- * Who sees them: signed-in students, for cards they can see (active cards, and their
--   own). The public link preview (get_card_preview) does not show files.
-- * Only the author adds or removes them. Deleting a card or the account deletes the
--   rows (cascade); the app removes the Storage files (SQL cannot).
--
-- Run once in the Supabase SQL Editor.

-- 1. Bucket ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-files', 'card-files', false, 10485760, array['image/webp', 'image/jpeg', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Table -------------------------------------------------------------------
create table if not exists public.card_files (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.barter_posts(id) on delete cascade,
  author_id  uuid not null default public.my_student_id() references public.users(id) on delete cascade,
  path       text not null unique
             constraint check_card_file_path check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|pdf)$'),
  name       text not null
             constraint check_card_file_name check (char_length(btrim(name)) between 1 and 120),
  kind       text not null
             constraint check_card_file_kind check (kind in ('image', 'pdf')),
  size_bytes integer not null
             constraint check_card_file_size check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(),
  -- The file lies in the author's own folder.
  constraint check_card_file_owner check (split_part(path, '/', 1) = author_id::text)
);

create index if not exists card_files_post_id_idx on public.card_files (post_id);
create index if not exists card_files_author_id_idx on public.card_files (author_id);

alter table public.card_files enable row level security;

revoke all on public.card_files from anon, authenticated;
grant select, insert, delete on public.card_files to authenticated;

-- Files of cards the student can see (barter_posts rules apply inside: active or own).
drop policy if exists card_files_read on public.card_files;
create policy card_files_read on public.card_files
  for select to authenticated
  using (exists (select 1 from public.barter_posts p where p.id = card_files.post_id));

-- Only on your own card, from your own folder.
drop policy if exists card_files_insert_own on public.card_files;
create policy card_files_insert_own on public.card_files
  for insert to authenticated
  with check (
    author_id = (select public.my_student_id())
    and exists (
      select 1 from public.barter_posts p
      where p.id = card_files.post_id and p.author_id = (select public.my_student_id())
    )
  );

drop policy if exists card_files_delete_own on public.card_files;
create policy card_files_delete_own on public.card_files
  for delete to authenticated
  using (author_id = (select public.my_student_id()));

-- At most 3 files per card (the card row is locked so two uploads cannot both pass).
create or replace function public.card_files_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.barter_posts where id = new.post_id for update;
  if (select count(*) from public.card_files where post_id = new.post_id) >= 3 then
    raise exception 'At most 3 files per card' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke execute on function public.card_files_limit() from public, anon, authenticated;

drop trigger if exists card_files_limit on public.card_files;
create trigger card_files_limit
  before insert on public.card_files
  for each row execute function public.card_files_limit();

-- 3. Storage rules -----------------------------------------------------------
drop policy if exists card_files_upload_own on storage.objects;
create policy card_files_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'card-files'
    and (storage.foldername(name))[1] = (select public.my_student_id())::text
  );

-- Your own folder, or a file attached to a card you can see.
drop policy if exists card_files_read_visible on storage.objects;
create policy card_files_read_visible on storage.objects
  for select to authenticated
  using (
    bucket_id = 'card-files'
    and (
      (storage.foldername(name))[1] = (select public.my_student_id())::text
      or exists (select 1 from public.card_files f where f.path = objects.name)
    )
  );

drop policy if exists card_files_delete_own on storage.objects;
create policy card_files_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'card-files'
    and (storage.foldername(name))[1] = (select public.my_student_id())::text
  );

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261029200000', 'card_files')
on conflict (version) do nothing;
