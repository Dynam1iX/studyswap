-- Profile settings: managing your own cards, Telegram visibility, data export.
--
-- Same model as search_history / favorites: every function is SECURITY DEFINER
-- and acts only on the current student (private.current_user_id(), the demo
-- account until Microsoft sign-in in phase 2).

-- ---------------------------------------------------------------------------
-- Who can see a student's Telegram
-- ---------------------------------------------------------------------------
alter table public.users
  add column telegram_visibility varchar(20) not null default 'everyone',
  add constraint check_telegram_visibility check (telegram_visibility in ('everyone', 'accepted'));

comment on column public.users.telegram_visibility is
  'everyone: any student sees the Telegram handle; accepted: only after a swap request is accepted (the app shows e-mail instead until then).';

create or replace function public.set_telegram_visibility(p_visibility text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_visibility not in ('everyone', 'accepted') then
    raise exception 'Unknown Telegram visibility: %', p_visibility using errcode = 'check_violation';
  end if;
  update public.users set telegram_visibility = p_visibility where id = private.current_user_id();
end;
$$;

-- ---------------------------------------------------------------------------
-- My cards (RLS only shows active cards to the API, so Profile reads them here)
-- ---------------------------------------------------------------------------

/** All of the current student's cards, any status, newest first, with both subjects. */
create or replace function public.get_my_cards()
returns table (
  id uuid,
  status text,
  created_at timestamptz,
  description text,
  offered_description text,
  needed jsonb,
  offered jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.status::text,
    p.created_at,
    p.description,
    p.offered_description,
    jsonb_build_object('id', n.id, 'code', n.code, 'name', n.name, 'category', n.category),
    jsonb_build_object('id', o.id, 'code', o.code, 'name', o.name, 'category', o.category)
  from public.barter_posts p
  join public.subjects n on n.id = p.needed_subject_id
  join public.subjects o on o.id = p.offered_subject_id
  where p.author_id = private.current_user_id()
  order by p.created_at desc;
$$;

/** Changes the two topic texts of one of my cards (subjects cannot change). */
create or replace function public.update_my_card(p_id uuid, p_description text, p_offered_description text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.barter_posts
  set description = btrim(p_description), offered_description = btrim(p_offered_description)
  where id = p_id and author_id = private.current_user_id();
$$;

/** Active ⇄ inactive (archived). */
create or replace function public.set_my_card_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('active', 'archived') then
    raise exception 'A card can only be set to active or archived' using errcode = 'check_violation';
  end if;
  update public.barter_posts
  set status = p_status
  where id = p_id and author_id = private.current_user_id();
end;
$$;

/** Deletes one of my cards (its swap requests and likes go with it). */
create or replace function public.delete_my_card(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.barter_posts
  where id = p_id and author_id = private.current_user_id();
$$;

-- ---------------------------------------------------------------------------
-- Download my data
-- ---------------------------------------------------------------------------

/** Everything stored about the current student, as one JSON document. */
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
    'swap_requests_sent', coalesce((
      select jsonb_agg(jsonb_build_object('status', s.status, 'message', s.message, 'created_at', s.created_at)
        order by s.created_at desc)
      from public.swap_requests s, me where s.sender_id = me.id
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

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function public.set_telegram_visibility(text)          from public;
revoke execute on function public.get_my_cards()                         from public;
revoke execute on function public.update_my_card(uuid, text, text)       from public;
revoke execute on function public.set_my_card_status(uuid, text)         from public;
revoke execute on function public.delete_my_card(uuid)                   from public;
revoke execute on function public.export_my_data()                       from public;
grant  execute on function public.set_telegram_visibility(text)          to anon, authenticated;
grant  execute on function public.get_my_cards()                         to anon, authenticated;
grant  execute on function public.update_my_card(uuid, text, text)       to anon, authenticated;
grant  execute on function public.set_my_card_status(uuid, text)         to anon, authenticated;
grant  execute on function public.delete_my_card(uuid)                   to anon, authenticated;
grant  execute on function public.export_my_data()                       to anon, authenticated;

comment on function public.get_my_cards()                   is 'All cards of the current student, any status.';
comment on function public.update_my_card(uuid, text, text) is 'Edits the topic texts of one of my cards.';
comment on function public.set_my_card_status(uuid, text)   is 'Sets one of my cards to active or archived.';
comment on function public.delete_my_card(uuid)             is 'Deletes one of my cards.';
comment on function public.export_my_data()                 is 'Everything stored about the current student, as JSON.';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261022160000', 'profile_settings')
on conflict (version) do nothing;
