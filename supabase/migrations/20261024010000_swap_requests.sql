-- RESTORED FOR HISTORY (2026-10-27): this migration was applied from the SQL Editor on
-- 2026-10-24 but its file was never committed. Rebuilt from the live database
-- (pg_get_functiondef, table definition). Do NOT run it again: 20261027160000_hardening
-- removes everything it added.
--
-- What it did: swap requests in the app — extra columns and statuses on swap_requests,
-- six functions to send / answer / complete / cancel / list requests, and Telegram
-- handles visible to both students of an accepted or completed swap.

alter table public.swap_requests
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists sender_seen boolean not null default true;
alter table public.swap_requests drop constraint if exists check_request_status;
alter table public.swap_requests add constraint check_request_status
  check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed'));
-- Requests are created only through send_swap_request().
drop policy if exists students_send_own_swaps on public.swap_requests;
revoke insert on public.swap_requests from authenticated;

create or replace function public.send_swap_request(p_post_id uuid, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare
  v_me      uuid := private.current_user_id();
  v_author  uuid;
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_id      uuid;
  v_status  text;
begin
  if v_me is null then
    raise exception 'Sign in first' using errcode = 'insufficient_privilege';
  end if;
  select author_id into v_author from public.barter_posts where id = p_post_id and status = 'active';
  if v_author is null then
    raise exception 'This card is no longer available' using errcode = 'no_data_found';
  end if;
  if v_author = v_me then
    raise exception 'You cannot send a request to your own card' using errcode = 'check_violation';
  end if;
  if char_length(coalesce(v_message, '')) > 200 then
    raise exception 'The message is too long' using errcode = 'check_violation';
  end if;

  select id, status into v_id, v_status from public.swap_requests where post_id = p_post_id and sender_id = v_me;
  if v_id is not null and v_status in ('pending', 'accepted', 'completed') then
    raise exception 'You already sent a request for this card' using errcode = 'unique_violation';
  end if;

  if v_id is null then
    insert into public.swap_requests (post_id, sender_id, message, status)
    values (p_post_id, v_me, v_message, 'pending')
    returning id into v_id;
  else
    update public.swap_requests
    set status = 'pending', message = v_message, created_at = now(), updated_at = now(), sender_seen = true
    where id = v_id;
  end if;
  return v_id;
end;
$function$;

create or replace function public.respond_swap_request(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $function$
begin
  update public.swap_requests s
  set status = case when p_accept then 'accepted' else 'declined' end,
      updated_at = now(),
      sender_seen = false
  from public.barter_posts p
  where s.id = p_id
    and p.id = s.post_id
    and p.author_id = private.current_user_id()
    and s.status = 'pending';
  if not found then
    raise exception 'This request cannot be answered' using errcode = 'check_violation';
  end if;
end;
$function$;

create or replace function public.complete_swap(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $function$
declare
  v_me uuid := private.current_user_id();
begin
  update public.swap_requests s
  set status = 'completed', updated_at = now(),
      sender_seen = (s.sender_id = v_me)
  from public.barter_posts p
  where s.id = p_id
    and p.id = s.post_id
    and (s.sender_id = v_me or p.author_id = v_me)
    and s.status = 'accepted';
  if not found then
    raise exception 'This swap cannot be completed' using errcode = 'check_violation';
  end if;
end;
$function$;

create or replace function public.cancel_swap_request(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $function$
begin
  update public.swap_requests
  set status = 'cancelled', updated_at = now()
  where id = p_id and sender_id = private.current_user_id() and status = 'pending';
  if not found then
    raise exception 'This request cannot be cancelled' using errcode = 'check_violation';
  end if;
end;
$function$;

create or replace function public.get_my_requests()
returns table (id uuid, direction text, status text, message text, created_at timestamptz,
  updated_at timestamptz, unseen boolean, post_id uuid, needed_name text, needed_category text,
  offered_name text, offered_category text, other_id uuid, other_name text, other_major text,
  other_year integer, other_avatar text, contact_method text, contact text)
language sql stable security definer set search_path = '' as $function$
  with me as (select private.current_user_id() as id)
  select s.id,
         case when s.sender_id = me.id then 'outgoing' else 'incoming' end,
         s.status::text,
         s.message::text,
         s.created_at,
         s.updated_at,
         case when s.sender_id = me.id then not s.sender_seen else s.status = 'pending' end,
         p.id,
         n.name::text, n.category::text,
         o.name::text, o.category::text,
         other.id, other.full_name::text, other.major::text, other.study_year, other.avatar_path,
         case when s.status in ('accepted', 'completed')
              then case when other.telegram_handle is not null then 'telegram' else 'email' end end,
         case when s.status in ('accepted', 'completed')
              then coalesce(other.telegram_handle::text, other.email::text) end
  from me
  join public.swap_requests s on true
  join public.barter_posts p on p.id = s.post_id
  join public.subjects n on n.id = p.needed_subject_id
  join public.subjects o on o.id = p.offered_subject_id
  join public.users other on other.id = case when s.sender_id = me.id then p.author_id else s.sender_id end
  where me.id is not null
    and (s.sender_id = me.id or p.author_id = me.id)
    -- Withdrawn requests are not shown to the card owner.
    and not (s.status = 'cancelled' and s.sender_id <> me.id)
  order by s.updated_at desc;
$function$;

create or replace function public.mark_requests_seen()
returns void language sql security definer set search_path = '' as $function$
  update public.swap_requests set sender_seen = true
  where sender_id = private.current_user_id() and not sender_seen;
$function$;

create or replace function public.get_telegram_handles(p_ids uuid[])
returns table (id uuid, telegram_handle text)
language sql stable security definer set search_path = '' as $function$
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
        where s.status in ('accepted', 'completed')
          and (
            (s.sender_id = (select auth.uid()) and p.author_id = u.id)
            or (s.sender_id = u.id and p.author_id = (select auth.uid()))
          )
      )
    );
$function$;

revoke execute on function public.send_swap_request(uuid, text), public.respond_swap_request(uuid, boolean),
  public.complete_swap(uuid), public.cancel_swap_request(uuid), public.get_my_requests(),
  public.mark_requests_seen() from public, anon;
grant execute on function public.send_swap_request(uuid, text), public.respond_swap_request(uuid, boolean),
  public.complete_swap(uuid), public.cancel_swap_request(uuid), public.get_my_requests(),
  public.mark_requests_seen() to authenticated;

insert into supabase_migrations.schema_migrations (version, name)
values ('20261024010000', 'swap_requests')
on conflict (version) do nothing;
