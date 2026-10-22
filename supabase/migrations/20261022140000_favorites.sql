-- Favorites: barter cards a student liked in the Feed or Search.
--
-- Same model as search_history: the table is closed to the API roles (no table
-- privileges, RLS without policies) and the app reaches it only through
-- SECURITY DEFINER functions that act on the current student.
-- Until Microsoft sign-in (phase 2) the current student is the demo account,
-- see private.current_user_id() in 20261022120000_search_history.sql.

create table public.favorites (
  user_id    uuid not null references public.users (id) on delete cascade,
  post_id    uuid not null references public.barter_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index idx_favorites_user_created on public.favorites (user_id, created_at desc);
create index idx_favorites_post on public.favorites (post_id);

alter table public.favorites enable row level security;
revoke all on public.favorites from anon, authenticated;

comment on table public.favorites is 'Cards a student liked. Only reachable through the *_favorite(s) functions.';

/** The current student's liked cards, newest like first. */
create or replace function public.get_favorites()
returns table (post_id uuid, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select f.post_id, f.created_at
  from public.favorites f
  where f.user_id = private.current_user_id()
  order by f.created_at desc;
$$;

/** Likes a card (no-op if it is already liked). */
create or replace function public.add_favorite(p_post_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.favorites (user_id, post_id)
  select private.current_user_id(), p_post_id
  where private.current_user_id() is not null
  on conflict (user_id, post_id) do nothing;
$$;

/** Removes a like. */
create or replace function public.remove_favorite(p_post_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.favorites f
  where f.user_id = private.current_user_id() and f.post_id = p_post_id;
$$;

revoke execute on function public.get_favorites()        from public;
revoke execute on function public.add_favorite(uuid)     from public;
revoke execute on function public.remove_favorite(uuid)  from public;
grant  execute on function public.get_favorites()        to anon, authenticated;
grant  execute on function public.add_favorite(uuid)     to anon, authenticated;
grant  execute on function public.remove_favorite(uuid)  to anon, authenticated;

comment on function public.get_favorites()       is 'Liked cards of the current student, newest first.';
comment on function public.add_favorite(uuid)    is 'Likes a card for the current student.';
comment on function public.remove_favorite(uuid) is 'Removes a like of the current student.';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261022140000', 'favorites')
on conflict (version) do nothing;
