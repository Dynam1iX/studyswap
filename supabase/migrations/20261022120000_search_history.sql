-- Recent searches on the Search page.
--
-- The table is closed to the API roles: no table privileges and RLS without policies.
-- The app reaches it only through four SECURITY DEFINER functions that act on the
-- current student, so a visitor can never read or delete another student's searches.
--
-- Until Microsoft sign-in exists (phase 2) the current student is the demo account
-- the pages already use (src/lib/currentUser.ts). With sign-in, private.current_user_id()
-- returns auth.uid() and the fallback below is removed.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.search_history (
  id         uuid primary key default extensions.uuid_generate_v4(),
  user_id    uuid not null references public.users (id) on delete cascade,
  query      varchar(100) not null,
  created_at timestamptz  not null default now(),
  constraint check_search_query_length check (char_length(btrim(query)) between 1 and 100)
);

-- One row per query per student (case-insensitive): searching again moves it to the top.
create unique index search_history_user_query_key on public.search_history (user_id, lower(query));
create index idx_search_history_user_created on public.search_history (user_id, created_at desc);

alter table public.search_history enable row level security;
revoke all on public.search_history from anon, authenticated;

comment on table public.search_history is 'Recent searches per student. Only reachable through the *_recent_search(es) functions.';

-- ---------------------------------------------------------------------------
-- Who is searching
-- ---------------------------------------------------------------------------
create or replace function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.id from public.users u where u.id = (select auth.uid())),
    -- Phase 1 only: demo account, same as CURRENT_USER_EMAIL in the app.
    (select u.id from public.users u where u.email = 'a.yerzhanuly@astanait.edu.kz')
  );
$$;

revoke execute on function private.current_user_id() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- API used by the app
-- ---------------------------------------------------------------------------

/** Newest first, at most p_limit (1 to 20). */
create or replace function public.get_recent_searches(p_limit integer default 10)
returns table (id uuid, query text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.query::text, h.created_at
  from public.search_history h
  where h.user_id = private.current_user_id()
  order by h.created_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 20);
$$;

/** Saves a query (or moves an existing one to the top) and keeps the 10 newest. */
create or replace function public.add_recent_search(p_query text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := private.current_user_id();
  v_query text := btrim(regexp_replace(coalesce(p_query, ''), '\s+', ' ', 'g'));
begin
  if v_user is null or v_query = '' then
    return;
  end if;
  if char_length(v_query) > 100 then
    raise exception 'Search query is longer than 100 characters' using errcode = 'check_violation';
  end if;

  insert into public.search_history (user_id, query)
  values (v_user, v_query)
  on conflict (user_id, lower(query))
  do update set query = excluded.query, created_at = now();

  delete from public.search_history h
  where h.user_id = v_user
    and h.id not in (
      select k.id from public.search_history k
      where k.user_id = v_user
      order by k.created_at desc
      limit 10
    );
end;
$$;

/** Removes one of the current student's searches. */
create or replace function public.delete_recent_search(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.search_history h
  where h.id = p_id and h.user_id = private.current_user_id();
$$;

/** Removes all of the current student's searches. */
create or replace function public.clear_recent_searches()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.search_history h
  where h.user_id = private.current_user_id();
$$;

revoke execute on function public.get_recent_searches(integer)  from public;
revoke execute on function public.add_recent_search(text)         from public;
revoke execute on function public.delete_recent_search(uuid)      from public;
revoke execute on function public.clear_recent_searches()         from public;
grant  execute on function public.get_recent_searches(integer)  to anon, authenticated;
grant  execute on function public.add_recent_search(text)         to anon, authenticated;
grant  execute on function public.delete_recent_search(uuid)      to anon, authenticated;
grant  execute on function public.clear_recent_searches()         to anon, authenticated;

comment on function public.get_recent_searches(integer) is 'Recent searches of the current student, newest first.';
comment on function public.add_recent_search(text)      is 'Saves a search for the current student; keeps the 10 newest.';
comment on function public.delete_recent_search(uuid)   is 'Deletes one search of the current student.';
comment on function public.clear_recent_searches()      is 'Deletes all searches of the current student.';
