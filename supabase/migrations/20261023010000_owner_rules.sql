-- Phase 2: owner-based rules now that students sign in.
--
-- * Nothing is readable or callable without signing in (the anon key gets nothing).
-- * Students create cards and swap requests only as themselves.
-- * The profile row is read-only for its owner; it changes only through the
--   functions (avatar, Telegram visibility), never by a direct UPDATE.
-- * A Telegram handle is visible only when its owner allows it: to everyone, or
--   only to students whose swap request they accepted (and always to themselves).
-- * Swap requests are visible only to the two students involved.
-- * The demo account is no longer used by any function.
-- * Delete account works.

-- ---------------------------------------------------------------------------
-- Current student: signed-in only
-- ---------------------------------------------------------------------------
create or replace function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from public.users u where u.id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- No access without signing in
-- ---------------------------------------------------------------------------
revoke all on public.users, public.subjects, public.barter_posts, public.swap_requests from anon;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'add_favorite', 'remove_favorite', 'get_favorites',
        'add_recent_search', 'delete_recent_search', 'clear_recent_searches', 'get_recent_searches',
        'get_my_cards', 'update_my_card', 'set_my_card_status', 'delete_my_card',
        'set_telegram_visibility', 'export_my_data',
        'my_student_id', 'set_my_avatar', 'remove_my_avatar'
      )
  loop
    execute format('revoke execute on function %s from anon', f.sig);
  end loop;
end $$;

-- Read policies: signed-in students only.
drop policy if exists public_read_subjects on public.subjects;
create policy students_read_subjects on public.subjects
  for select to authenticated using (true);

drop policy if exists public_read_users on public.users;
create policy students_read_users on public.users
  for select to authenticated using (true);

drop policy if exists public_read_active_posts on public.barter_posts;
create policy students_read_posts on public.barter_posts
  for select to authenticated
  using (status = 'active' or author_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Cards and swap requests: only as yourself
-- ---------------------------------------------------------------------------
drop policy if exists public_insert_posts on public.barter_posts;
create policy students_create_own_posts on public.barter_posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'active');

-- Changing or deleting a card goes through update_my_card / set_my_card_status / delete_my_card.
revoke update, delete on public.barter_posts from authenticated;

drop policy if exists public_read_swaps on public.swap_requests;
create policy participants_read_swaps on public.swap_requests
  for select to authenticated
  using (
    sender_id = (select auth.uid())
    or exists (select 1 from public.barter_posts p where p.id = post_id and p.author_id = (select auth.uid()))
  );

drop policy if exists public_insert_swaps on public.swap_requests;
create policy students_send_own_swaps on public.swap_requests
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and status = 'pending');

revoke update, delete on public.swap_requests from authenticated;

-- ---------------------------------------------------------------------------
-- Profile: read-only for its owner, Telegram handle hidden by column
-- ---------------------------------------------------------------------------
drop policy if exists "Allow users to update own profile" on public.users;
revoke insert, update, delete on public.users from authenticated;

-- Every column except telegram_handle; handles come from get_telegram_handles().
revoke select on public.users from authenticated;
grant select (id, email, full_name, role, major, study_year, degree_level, created_at, avatar_path, telegram_visibility)
  on public.users to authenticated;

/**
 * Telegram handles of the given students, where the caller may see them:
 * their own, students who show it to everyone, and students with an accepted
 * swap request between the two of them.
 */
create or replace function public.get_telegram_handles(p_ids uuid[])
returns table (id uuid, telegram_handle text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.telegram_handle::text
  from public.users u
  where u.id = any (p_ids)
    and u.telegram_handle is not null
    and (select auth.uid()) is not null
    and (
      u.id = (select auth.uid())
      or u.telegram_visibility = 'everyone'
      or exists (
        select 1
        from public.swap_requests s
        join public.barter_posts p on p.id = s.post_id
        where s.status = 'accepted'
          and (
            (s.sender_id = (select auth.uid()) and p.author_id = u.id)
            or (s.sender_id = u.id and p.author_id = (select auth.uid()))
          )
      )
    );
$$;

revoke execute on function public.get_telegram_handles(uuid[]) from public, anon;
grant  execute on function public.get_telegram_handles(uuid[]) to authenticated;
comment on function public.get_telegram_handles(uuid[]) is
  'Telegram handles the signed-in student may see (own, public, or after an accepted swap).';

-- ---------------------------------------------------------------------------
-- Profile photos: signed-in students only
-- ---------------------------------------------------------------------------
alter policy avatars_insert_own on storage.objects to authenticated;
alter policy avatars_update_own on storage.objects to authenticated;
alter policy avatars_delete_own on storage.objects to authenticated;
alter policy avatars_select_own on storage.objects to authenticated;

-- ---------------------------------------------------------------------------
-- Delete account
-- ---------------------------------------------------------------------------
/**
 * Deletes the signed-in student: their profile, cards (with requests and likes on
 * them), likes, searches and swap requests, then the sign-in account itself.
 * The app removes the profile photo file first (Storage files are not deleted by SQL).
 */
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
begin
  if v_id is null then
    raise exception 'Sign in first' using errcode = 'insufficient_privilege';
  end if;
  delete from public.users where id = v_id;
  delete from auth.users where id = v_id;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;
comment on function public.delete_my_account() is 'Deletes the signed-in student and everything they own.';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261023010000', 'owner_rules')
on conflict (version) do nothing;
