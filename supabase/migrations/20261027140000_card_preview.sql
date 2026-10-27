-- Card links (/c/<slug>-<code>): the link preview that Telegram (or any chat) shows.
--
-- * get_card_preview(p_code): callable WITHOUT signing in, because chat apps fetch the
--   preview anonymously. It returns only what the preview picture shows: both subjects,
--   both topic lines, the author's first name and initial, major and year. No e-mail,
--   Telegram handle, photo or ids of students.
-- * p_code is the first 8 hex characters of the card id; only active cards are found.
-- Additive: nothing else changes.

create or replace function public.get_card_preview(p_code text)
returns table (
  code text,
  needed_name text,
  needed_category text,
  needed_topic text,
  offered_name text,
  offered_category text,
  offered_topic text,
  author_name text,
  major text,
  study_year integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select left(p.id::text, 8),
         n.name::text, n.category::text, coalesce(nullif(trim(p.description), ''), n.code::text),
         o.name::text, o.category::text, coalesce(nullif(trim(p.offered_description), ''), o.code::text),
         -- "Nursat Tileuberdyuly" -> "Nursat T."
         case
           when position(' ' in trim(u.full_name)) > 0
             then split_part(trim(u.full_name), ' ', 1) || ' ' || left(split_part(trim(u.full_name), ' ', 2), 1) || '.'
           else trim(u.full_name)
         end,
         u.major::text, u.study_year
  from public.barter_posts p
  join public.subjects n on n.id = p.needed_subject_id
  join public.subjects o on o.id = p.offered_subject_id
  join public.users u on u.id = p.author_id
  where p_code ~ '^[0-9a-f]{8}$'
    and p.id::text like p_code || '%'
    and p.status = 'active'
  limit 1;
$$;

revoke execute on function public.get_card_preview(text) from public;
grant  execute on function public.get_card_preview(text) to anon, authenticated;
comment on function public.get_card_preview(text) is
  'Link preview of an active card (subjects, topics, author first name + initial, major, year). Public on purpose.';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261027140000', 'card_preview')
on conflict (version) do nothing;
