-- Show students only what the app needs, part 2 of 2. Run after the app that uses
-- get_my_profile / get_post_contacts / signed photo links is live.
--
-- * Other students: only id, name, major, year and photo path are readable
--   (no e-mail, role, degree, sign-up date or Telegram setting).
-- * Profile photos: the bucket is private; links come from createSignedUrls.

revoke select on public.users from authenticated;
grant select (id, full_name, major, study_year, avatar_path) on public.users to authenticated;

update storage.buckets set public = false where id = 'avatars';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261023190000', 'private_data_lock')
on conflict (version) do nothing;
