-- Show students only what the app needs, part 1 of 2 (additive; safe while the old app runs).
--
-- * get_my_profile(): your own full profile.
-- * get_post_contacts(): the contact of each card: the Telegram handle when the author
--   chose Telegram and lets the caller see it, otherwise the university e-mail.
-- * Signed-in students may read profile photos through signed links.
-- Part 2 (20261023190000_private_data_lock) then hides the columns and closes the bucket.

-- ---------------------------------------------------------------------------
-- Your own profile
-- ---------------------------------------------------------------------------
/** The signed-in student's own profile, with the fields others cannot read. */
create or replace function public.get_my_profile()
returns table (
  id uuid,
  email text,
  full_name text,
  major text,
  study_year integer,
  degree_level text,
  avatar_path text,
  telegram_handle text,
  telegram_visibility text
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, u.full_name::text, u.major::text, u.study_year, u.degree_level::text,
         u.avatar_path, u.telegram_handle::text, u.telegram_visibility::text
  from public.users u
  where u.id = (select auth.uid());
$$;

revoke execute on function public.get_my_profile() from public, anon;
grant  execute on function public.get_my_profile() to authenticated;
comment on function public.get_my_profile() is 'Full profile of the signed-in student.';

-- ---------------------------------------------------------------------------
-- How to contact the author of a card
-- ---------------------------------------------------------------------------
/**
 * For each card: ('telegram', handle) when the author chose Telegram and the caller may
 * see the handle (get_telegram_handles), otherwise ('email', university e-mail).
 * Active cards only, plus the caller's own.
 */
create or replace function public.get_post_contacts(p_post_ids uuid[])
returns table (post_id uuid, method text, contact text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         case when p.contact_method = 'telegram' and h.handle is not null then 'telegram' else 'email' end,
         case when p.contact_method = 'telegram' and h.handle is not null then h.handle else u.email::text end
  from public.barter_posts p
  join public.users u on u.id = p.author_id
  left join lateral (
    select t.telegram_handle as handle from public.get_telegram_handles(array[u.id]) t
  ) h on true
  where p.id = any (p_post_ids)
    and (select auth.uid()) is not null
    and (p.status = 'active' or p.author_id = (select auth.uid()));
$$;

revoke execute on function public.get_post_contacts(uuid[]) from public, anon;
grant  execute on function public.get_post_contacts(uuid[]) to authenticated;
comment on function public.get_post_contacts(uuid[]) is
  'Contact of each card: the visible Telegram handle, or the university e-mail.';

-- ---------------------------------------------------------------------------
-- Profile photos: private bucket, readable by signed-in students through signed links
-- ---------------------------------------------------------------------------
drop policy if exists avatars_read_signed_in on storage.objects;
create policy avatars_read_signed_in on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261023180000', 'private_data')
on conflict (version) do nothing;
