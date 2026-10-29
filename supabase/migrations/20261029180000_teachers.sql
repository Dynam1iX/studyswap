-- Teachers and any AITU e-mail.
--
-- 1. Sign-up: any address @astanait.edu.kz (before: only 6 digits, the student id).
--    The same check runs for e-mail codes, Microsoft sign-in and e-mail change.
-- 2. "Teacher" next to Bachelor's / Master's: degree_level = 'Teacher' and no year
--    (study_year is null). Other users only see study_year, so a null year shows
--    "Teacher" instead of "Year N" everywhere (feed, profiles, link preview).
-- 3. complete_my_profile() accepts a teacher without a year.
--
-- Run once in the Supabase SQL Editor.

-- 1 -------------------------------------------------------------------------
create or replace function private.check_student_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is null or lower(new.email) !~ '^[a-z0-9._%+-]+@astanait\.edu\.kz$' then
    raise exception 'Only AITU e-mails (@astanait.edu.kz) can sign up'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- 2 -------------------------------------------------------------------------
alter table public.users drop constraint if exists check_degree_level;
alter table public.users add constraint check_degree_level
  check (degree_level in ('Undergraduate', 'Master''s Degree', 'PhD', 'Teacher'));

alter table public.users alter column study_year drop not null;

alter table public.users drop constraint if exists check_study_year;
alter table public.users add constraint check_study_year
  check (
    case when degree_level = 'Teacher'
      then study_year is null
      else study_year between 1 and 3
    end
  );

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
  if p_degree is null or p_degree not in ('Undergraduate', 'Master''s Degree', 'Teacher') then
    raise exception 'Choose your degree' using errcode = 'check_violation';
  end if;
  if p_degree = 'Teacher' then
    p_study_year := null;
  elsif p_study_year is null or p_study_year not between 1 and 3 then
    raise exception 'Choose your year' using errcode = 'check_violation';
  end if;

  insert into public.users (id, email, full_name, major, study_year, degree_level, role)
  values (v_id, v_email, v_name, btrim(p_major), p_study_year, p_degree, 'student');
end;
$$;

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261029180000', 'teachers')
on conflict (version) do nothing;
