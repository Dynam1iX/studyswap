-- Another student's profile page (/u/[id]).
--
-- * get_student_profile(p_id): what the page shows in its header: name, major, year, photo
--   path and how to reach the student. The contact follows the same rules as the cards
--   (get_post_contacts): the Telegram handle when the caller may see it, otherwise the
--   university e-mail. The e-mail is given only for students with an active card (or for
--   yourself), so no e-mail is readable here that the Feed does not already show.
-- Additive: nothing else changes.

create or replace function public.get_student_profile(p_id uuid)
returns table (
  id uuid,
  full_name text,
  major text,
  study_year integer,
  avatar_path text,
  contact_method text,
  contact text
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.full_name::text, u.major::text, u.study_year, u.avatar_path,
         case
           when h.handle is not null then 'telegram'
           when shown.ok then 'email'
         end,
         case
           when h.handle is not null then h.handle
           when shown.ok then u.email::text
         end
  from public.users u
  left join lateral (
    select t.telegram_handle as handle from public.get_telegram_handles(array[u.id]) t
  ) h on true
  cross join lateral (
    select u.id = (select auth.uid())
        or exists (select 1 from public.barter_posts p where p.author_id = u.id and p.status = 'active') as ok
  ) shown
  where u.id = p_id
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.get_student_profile(uuid) from public, anon;
grant  execute on function public.get_student_profile(uuid) to authenticated;
comment on function public.get_student_profile(uuid) is
  'Header of another student''s profile: name, major, year, photo and contact (Telegram or university e-mail).';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261027120000', 'student_profile')
on conflict (version) do nothing;
