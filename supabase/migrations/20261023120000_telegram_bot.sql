-- Telegram bot: students link their Telegram username through a one-time link.
--
-- * The site asks for a link (create_telegram_link) and opens t.me/<bot>?start=<token>.
-- * The bot (Edge Function telegram-bot, service role) calls telegram_link_from_bot with
--   the token and the Telegram account; the result is kept on the link so the site,
--   which checks get_telegram_link_status every few seconds, can show it.
-- * Links work for 10 minutes. One Telegram account belongs to one student.
-- * unlink_my_telegram removes the handle; students then get e-mails again.

alter table public.users add column if not exists telegram_user_id bigint unique;
-- Not readable by students: the column grant from owner_rules covers listed columns only.
comment on column public.users.telegram_user_id is 'Telegram account id, set by the bot when the student links Telegram.';

create table if not exists private.telegram_links (
  token      text primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  status     text not null default 'pending'
             check (status in ('pending', 'linked', 'no_username', 'taken')),
  created_at timestamptz not null default now()
);
alter table private.telegram_links enable row level security;
create index if not exists telegram_links_user_id_idx on private.telegram_links (user_id);

-- ---------------------------------------------------------------------------
-- Site: start a link, watch it, unlink
-- ---------------------------------------------------------------------------
/** New one-time link token for the signed-in student (older ones stop working). */
create or replace function public.create_telegram_link()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id    uuid := private.current_user_id();
  v_token text := replace(gen_random_uuid()::text, '-', '');
begin
  if v_id is null then
    raise exception 'Sign in first' using errcode = 'insufficient_privilege';
  end if;
  delete from private.telegram_links where user_id = v_id or created_at < now() - interval '1 day';
  insert into private.telegram_links (token, user_id) values (v_token, v_id);
  return v_token;
end;
$$;

/** pending / linked / no_username / taken / expired, for the signed-in student's own link. */
create or replace function public.get_telegram_link_status(p_token text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select case
              when l.status in ('pending', 'no_username') and l.created_at < now() - interval '10 minutes' then 'expired'
              else l.status
            end
     from private.telegram_links l
     where l.token = p_token and l.user_id = private.current_user_id()),
    'expired');
$$;

/** Removes the signed-in student's Telegram. */
create or replace function public.unlink_my_telegram()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := private.current_user_id();
begin
  if v_id is null then
    raise exception 'Sign in first' using errcode = 'insufficient_privilege';
  end if;
  update public.users set telegram_handle = null, telegram_user_id = null where id = v_id;
  delete from private.telegram_links where user_id = v_id;
end;
$$;

revoke execute on function public.create_telegram_link() from public, anon;
revoke execute on function public.get_telegram_link_status(text) from public, anon;
revoke execute on function public.unlink_my_telegram() from public, anon;
grant  execute on function public.create_telegram_link() to authenticated;
grant  execute on function public.get_telegram_link_status(text) to authenticated;
grant  execute on function public.unlink_my_telegram() to authenticated;

-- ---------------------------------------------------------------------------
-- Bot: finish a link (service role only)
-- ---------------------------------------------------------------------------
/**
 * Called by the telegram-bot Edge Function when a student opens the bot with a link.
 * Returns linked / no_username / taken / expired.
 */
create or replace function public.telegram_link_from_bot(p_token text, p_telegram_id bigint, p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link private.telegram_links%rowtype;
begin
  select * into v_link from private.telegram_links where token = p_token for update;
  if not found or v_link.status in ('linked', 'taken') or v_link.created_at < now() - interval '10 minutes' then
    return 'expired';
  end if;

  if p_username is null or p_username !~ '^[A-Za-z0-9_]{5,32}$' then
    update private.telegram_links set status = 'no_username' where token = p_token;
    return 'no_username';
  end if;

  if exists (select 1 from public.users where telegram_user_id = p_telegram_id and id <> v_link.user_id) then
    update private.telegram_links set status = 'taken' where token = p_token;
    return 'taken';
  end if;

  -- A Telegram username belongs to one account: drop it from rows that only had it typed in.
  update public.users set telegram_handle = null
  where lower(telegram_handle) = lower(p_username) and id <> v_link.user_id and telegram_user_id is null;

  update public.users set telegram_handle = p_username, telegram_user_id = p_telegram_id where id = v_link.user_id;
  update private.telegram_links set status = 'linked' where token = p_token;
  return 'linked';
end;
$$;

revoke execute on function public.telegram_link_from_bot(text, bigint, text) from public, anon, authenticated;
grant  execute on function public.telegram_link_from_bot(text, bigint, text) to service_role;

comment on function public.create_telegram_link() is 'One-time Telegram link token for the signed-in student.';
comment on function public.get_telegram_link_status(text) is 'State of the signed-in student''s Telegram link.';
comment on function public.unlink_my_telegram() is 'Removes the signed-in student''s Telegram.';
comment on function public.telegram_link_from_bot(text, bigint, text) is 'Telegram bot: links the Telegram account to the student who made the token.';

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261023120000', 'telegram_bot')
on conflict (version) do nothing;
