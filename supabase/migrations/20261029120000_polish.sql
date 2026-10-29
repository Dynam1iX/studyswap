-- Small fixes from the 2026-10-27 bug review. Run once in the SQL Editor.
--
-- 1. update_my_card says so when the card does not exist (deleted in another tab)
--    instead of succeeding without changing anything.
-- 2. Topic texts: at most 150 characters as stored, not only after trimming spaces
--    (a direct insert could pad them with megabytes of whitespace).
-- 3. complete_my_profile requires a study year (1–3); null was accepted.
-- 4. Profile photos: signed-in students can read a photo only while it is someone's
--    current photo (plus every file in their own folder), not every file in the bucket.

-- 1 -------------------------------------------------------------------------
create or replace function public.update_my_card(p_id uuid, p_description text, p_offered_description text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.barter_posts
  set description = btrim(p_description), offered_description = btrim(p_offered_description)
  where id = p_id and author_id = private.current_user_id();
  if not found then
    raise exception 'This card no longer exists' using errcode = 'no_data_found';
  end if;
end;
$$;

-- 2 -------------------------------------------------------------------------
-- The Create form and update_my_card trim the text first, so real cards are unaffected.
alter table public.barter_posts drop constraint if exists check_description_length;
alter table public.barter_posts add constraint check_description_length
  check (char_length(btrim(description)) between 1 and 150 and char_length(description) <= 150);
alter table public.barter_posts drop constraint if exists check_offered_description_length;
alter table public.barter_posts add constraint check_offered_description_length
  check (char_length(btrim(offered_description)) between 1 and 150 and char_length(offered_description) <= 150);

-- 3 -------------------------------------------------------------------------
create or replace function public.complete_my_profile(p_full_name text, p_major text, p_study_year integer, p_degree text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id    uuid := (select auth.uid());
  v_email text := lower((select auth.jwt()) ->> 'email');
  v_name  text := btrim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
begin
  if v_id is null then
    raise exception 'Sign in first' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.users where id = v_id) then
    raise exception 'Your profile is already complete' using errcode = 'unique_violation';
  end if;
  if char_length(v_name) < 2 or position(' ' in v_name) = 0 then
    raise exception 'Enter your first and last name' using errcode = 'check_violation';
  end if;
  if char_length(btrim(coalesce(p_major, ''))) not between 2 and 100 then
    raise exception 'Choose your major' using errcode = 'check_violation';
  end if;
  if p_study_year is null or p_study_year not between 1 and 3 then
    raise exception 'Choose your year' using errcode = 'check_violation';
  end if;
  if p_degree not in ('Undergraduate', 'Master''s Degree') then
    raise exception 'Choose your degree' using errcode = 'check_violation';
  end if;

  insert into public.users (id, email, full_name, major, study_year, degree_level, role)
  values (v_id, v_email, v_name, btrim(p_major), p_study_year, p_degree, 'student');
end;
$$;

-- 4 -------------------------------------------------------------------------
-- avatars_select_own (own folder) stays: uploads, removal and account deletion list it.
drop policy if exists avatars_read_signed_in on storage.objects;
create policy avatars_read_current on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and exists (select 1 from public.users u where u.avatar_path = storage.objects.name)
  );

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261029120000', 'polish')
on conflict (version) do nothing;
