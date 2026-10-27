-- Fixes from the 2026-10-27 bug review. Run once in the SQL Editor.
--
-- 1. Cards: students choose only what the Create form sends. id and created_at always
--    come from the database (no card dated 2099 on top of the Feed, no hand-picked id
--    that takes over another card's /c/ link). The 8-character link code is unique.
-- 2. Swap requests are gone from the app (20261024020000_no_requests): drop the table,
--    its six functions and its trigger; Telegram handles and the data export no longer
--    look at it.
-- 3. The AITU e-mail rule also applies when an account's e-mail changes, not only at
--    sign-up.

-- ---------------------------------------------------------------------------
-- 1. Cards
-- ---------------------------------------------------------------------------
revoke insert on public.barter_posts from authenticated;
grant insert (author_id, needed_subject_id, offered_subject_id, description, offered_description, contact_method, status)
  on public.barter_posts to authenticated;

create unique index if not exists barter_posts_link_code_key on public.barter_posts (left(id::text, 8));
comment on index public.barter_posts_link_code_key is 'Card links use the first 8 characters of the id (get_card_preview).';

-- ---------------------------------------------------------------------------
-- 2. Swap requests
-- ---------------------------------------------------------------------------
-- No longer reads swap_requests: a handle is visible to yourself and to everyone
-- signed in when the student shows it to everyone (the only setting now).
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
    and (u.id = (select auth.uid()) or u.telegram_visibility = 'everyone');
$$;

-- Same export as before, without the swap requests.
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select private.current_user_id() as id)
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (
      select to_jsonb(u) - 'id'
      from public.users u, me where u.id = me.id
    ),
    'cards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'needed_subject', n.name, 'offered_subject', o.name,
        'needs_help_with', p.description, 'can_teach', p.offered_description,
        'contact_method', p.contact_method, 'status', p.status, 'created_at', p.created_at
      ) order by p.created_at desc)
      from public.barter_posts p
      join public.subjects n on n.id = p.needed_subject_id
      join public.subjects o on o.id = p.offered_subject_id, me
      where p.author_id = me.id
    ), '[]'::jsonb),
    'favorites', coalesce((
      select jsonb_agg(jsonb_build_object('card_id', f.post_id, 'liked_at', f.created_at) order by f.created_at desc)
      from public.favorites f, me where f.user_id = me.id
    ), '[]'::jsonb),
    'recent_searches', coalesce((
      select jsonb_agg(jsonb_build_object('query', h.query, 'searched_at', h.created_at) order by h.created_at desc)
      from public.search_history h, me where h.user_id = me.id
    ), '[]'::jsonb)
  );
$$;

drop function if exists public.send_swap_request(uuid, text);
drop function if exists public.respond_swap_request(uuid, boolean);
drop function if exists public.complete_swap(uuid);
drop function if exists public.cancel_swap_request(uuid);
drop function if exists public.get_my_requests();
drop function if exists public.mark_requests_seen();
drop table if exists public.swap_requests;          -- also drops its trigger and policies
drop function if exists public.prevent_self_swap();

-- ---------------------------------------------------------------------------
-- 3. AITU e-mail also on e-mail change
-- ---------------------------------------------------------------------------
drop trigger if exists auth_users_student_email_change on auth.users;
create trigger auth_users_student_email_change
  before update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.check_student_email();

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261027160000', 'hardening')
on conflict (version) do nothing;
