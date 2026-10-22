-- Sign-in (part A): e-mail one-time codes through Supabase Auth.
--
-- * Only student addresses can create an account: six digits @astanait.edu.kz.
-- * A signed-in student's profile row uses the auth user id as users.id, so the
--   existing functions (favorites, recent searches, my cards, avatars) act on them.
-- * The profile is created once, from the "Complete your profile" screen, through
--   complete_my_profile(); afterwards it is read-only for the student.
-- * The demo account stays only for visitors who are not signed in; a signed-in
--   student never falls back to it.

-- ---------------------------------------------------------------------------
-- Student e-mails only
-- ---------------------------------------------------------------------------
create or replace function private.check_student_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is null or lower(new.email) !~ '^[0-9]{6}@astanait\.edu\.kz$' then
    raise exception 'Only AITU student e-mails (6 digits @astanait.edu.kz) can sign up'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Supabase Auth inserts users as supabase_auth_admin, which must be able to run it.
grant usage on schema private to supabase_auth_admin;
grant execute on function private.check_student_email() to supabase_auth_admin;
revoke execute on function private.check_student_email() from public, anon, authenticated;

drop trigger if exists auth_users_student_email on auth.users;
create trigger auth_users_student_email
  before insert on auth.users
  for each row execute function private.check_student_email();

-- ---------------------------------------------------------------------------
-- Who is the current student
-- ---------------------------------------------------------------------------
create or replace function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    -- Signed in: only their own profile (null until "Complete your profile").
    when (select auth.uid()) is not null then
      (select u.id from public.users u where u.id = (select auth.uid()))
    -- Not signed in (phase 1 pages): the demo account.
    else
      (select u.id from public.users u where u.email = 'a.yerzhanuly@astanait.edu.kz')
  end;
$$;

-- ---------------------------------------------------------------------------
-- Complete your profile
-- ---------------------------------------------------------------------------
create or replace function public.complete_my_profile(
  p_full_name text,
  p_major text,
  p_study_year integer,
  p_degree text
)
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
  if p_degree not in ('Undergraduate', 'Master''s Degree') then
    raise exception 'Choose your degree' using errcode = 'check_violation';
  end if;

  insert into public.users (id, email, full_name, major, study_year, degree_level, role)
  values (v_id, v_email, v_name, btrim(p_major), p_study_year, p_degree, 'student');
end;
$$;

revoke execute on function public.complete_my_profile(text, text, integer, text) from public, anon;
grant  execute on function public.complete_my_profile(text, text, integer, text) to authenticated;
comment on function public.complete_my_profile(text, text, integer, text) is
  'Creates the signed-in student''s profile once (first sign-in).';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261022200000', 'sign_in')
on conflict (version) do nothing;
