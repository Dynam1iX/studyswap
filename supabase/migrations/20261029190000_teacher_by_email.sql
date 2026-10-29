-- Who is a teacher is decided by the e-mail, not by a button.
--
-- AITU gives students a 6-digit id e-mail (260668@astanait.edu.kz) and teachers a
-- name e-mail (a.yerzhanuly@astanait.edu.kz). So:
--   * exactly 6 digits before @  -> student (Bachelor's / Master's, with a year);
--   * anything else              -> teacher (no year).
-- complete_my_profile() sets the degree from the e-mail for a teacher and refuses
-- "Teacher" for a student e-mail; a table rule keeps it true for every row.
--
-- Run once in the Supabase SQL Editor (after 20261029180000_teachers.sql).

-- 1 -------------------------------------------------------------------------
alter table public.users drop constraint if exists check_teacher_email;
alter table public.users add constraint check_teacher_email
  check ((degree_level = 'Teacher') = (lower(email) !~ '^[0-9]{6}@astanait\.edu\.kz$'));

-- 2 -------------------------------------------------------------------------
create or replace function public.complete_my_profile(p_full_name text, p_major text, p_study_year integer, p_degree text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id      uuid := (select auth.uid());
  v_email   text := lower((select auth.jwt()) ->> 'email');
  v_name    text := btrim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
  v_teacher boolean := v_email !~ '^[0-9]{6}@astanait\.edu\.kz$';
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

  if v_teacher then
    -- A name e-mail is a teacher whatever was sent.
    p_degree := 'Teacher';
    p_study_year := null;
  else
    if p_degree is null or p_degree not in ('Undergraduate', 'Master''s Degree') then
      raise exception 'Choose your degree' using errcode = 'check_violation';
    end if;
    if p_study_year is null or p_study_year not between 1 and 3 then
      raise exception 'Choose your year' using errcode = 'check_violation';
    end if;
  end if;

  insert into public.users (id, email, full_name, major, study_year, degree_level, role)
  values (v_id, v_email, v_name, btrim(p_major), p_study_year, p_degree, 'student');
end;
$$;

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261029190000', 'teacher_by_email')
on conflict (version) do nothing;
