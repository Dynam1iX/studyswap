-- Phase 1c: restores phase 1a after the database was re-created by the old setup
-- script (run from the SQL Editor on 2026-10-20 19:03 UTC: DROP TABLE … CASCADE,
-- CREATE TABLE …, test data). Written for the state that script leaves behind:
-- only the public_* policies, no "Allow …" policies, no phase 1 rules.
-- Applied on the project as version 20261020194518. Destructive part: phase 1c cleanup.

-- RLS: temporary anonymous inserts can only create active cards and pending requests.
alter policy public_insert_posts on public.barter_posts with check (status = 'active');
alter policy public_insert_swaps on public.swap_requests with check (status = 'pending');

-- Students edit only their own profile (used from phase 2, with sign-in).
create policy "Allow users to update own profile" on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Least privilege for the API roles.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;
revoke update, delete on all tables in schema public from anon;
revoke insert on public.users, public.subjects from anon;
revoke insert, update, delete on public.subjects from authenticated;

-- Only AITU university addresses (the old Gmail rule is dropped in the cleanup).
alter table public.users add constraint check_email_university
  check (email ~* '^[a-z0-9._%+-]+@astanait\.edu\.kz$');
alter table public.users add constraint check_full_name_length
  check (char_length(btrim(full_name)) between 2 and 100);

-- Telegram is optional; when set it is a valid username, stored without "@".
alter table public.users alter column telegram_handle drop not null;
alter table public.users add constraint check_telegram_handle
  check (telegram_handle is null or telegram_handle ~ '^[A-Za-z0-9_]{5,32}$');

-- Topic texts: required and at most 150 characters, the same limit as the Create form.
alter table public.barter_posts alter column offered_description drop default;
alter table public.barter_posts add constraint check_description_length
  check (char_length(btrim(description)) between 1 and 150);
alter table public.barter_posts add constraint check_offered_description_length
  check (char_length(btrim(offered_description)) between 1 and 150);

alter table public.swap_requests add constraint check_message_length
  check (message is null or char_length(message) <= 500);

alter table public.subjects add constraint check_subject_category
  check (category in ('CS & Dev', 'Mathematics', 'Humanities', 'Languages'));

-- Swap requests: one per student per card, never to your own card.
alter table public.swap_requests add constraint swap_requests_post_sender_key unique (post_id, sender_id);

-- A CHECK cannot look at another table, so a trigger enforces "not your own card".
-- SECURITY DEFINER so the check also sees cards hidden from the caller by RLS.
create or replace function public.prevent_self_swap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.barter_posts p
    where p.id = new.post_id and p.author_id = new.sender_id
  ) then
    raise exception 'You cannot send a swap request to your own card'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_self_swap() from public, anon, authenticated;

create trigger swap_requests_no_self_swap
  before insert or update of post_id, sender_id on public.swap_requests
  for each row execute function public.prevent_self_swap();

-- Indexes: foreign keys used by Profile, and the Feed query (active, newest first).
create index if not exists idx_barter_posts_author  on public.barter_posts (author_id);
create index if not exists idx_swap_requests_sender on public.swap_requests (sender_id);
create index if not exists idx_barter_posts_status_created on public.barter_posts (status, created_at desc);

comment on table public.users         is 'AITU students. Phase 2 links id to auth.users (Microsoft sign-in).';
comment on table public.subjects      is 'Course catalogue, grouped into four categories.';
comment on table public.barter_posts  is 'Barter cards: the subject a student needs help with and the one they can teach.';
comment on table public.swap_requests is 'A student asks the author of a card to swap. One request per student per card.';
comment on function public.prevent_self_swap() is 'Blocks swap requests sent to your own card.';
