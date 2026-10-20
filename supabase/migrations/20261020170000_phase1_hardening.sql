-- Phase 1: data integrity, least privilege and performance.
-- Safe to run before sign-in exists: the Feed, Create and Profile pages keep working.
-- Owner-based access rules (only edit your own cards, hide e-mails) come in phase 2
-- together with Microsoft sign-in.

-- ---------------------------------------------------------------------------
-- 1. Row Level Security clean-up
-- ---------------------------------------------------------------------------

-- Every read policy existed twice under two names; keep the descriptive ones.
drop policy if exists public_read_subjects     on public.subjects;
drop policy if exists public_read_users        on public.users;
drop policy if exists public_read_active_posts on public.barter_posts;

-- Temporary anonymous inserts (replaced by owner-based rules in phase 2):
-- at least they can no longer create closed cards or pre-accepted requests.
alter policy public_insert_posts on public.barter_posts with check (status = 'active');
alter policy public_insert_swaps on public.swap_requests with check (status = 'pending');

-- Evaluate auth.uid() once per query instead of once per row.
alter policy "Allow users to update own profile" on public.users
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- 2. Least privilege for the API roles
-- ---------------------------------------------------------------------------

-- Nobody talks to these tables through the API with TRUNCATE / TRIGGER / REFERENCES.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;

-- Visitors who are not signed in can only read, and create cards until phase 2.
revoke update, delete on all tables in schema public from anon;
revoke insert on public.users, public.subjects from anon;

-- The subject catalogue is managed by admins in the dashboard, not through the API.
revoke insert, update, delete on public.subjects from authenticated;

-- ---------------------------------------------------------------------------
-- 3. Data rules
-- ---------------------------------------------------------------------------

-- Only AITU university addresses.
alter table public.users drop constraint check_email_format;
alter table public.users add constraint check_email_format
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

-- The four categories the app knows about.
alter table public.subjects add constraint check_subject_category
  check (category in ('CS & Dev', 'Mathematics', 'Humanities', 'Languages'));

-- ---------------------------------------------------------------------------
-- 4. Swap requests: one per student per card, never to your own card
-- ---------------------------------------------------------------------------

-- Two seeded test requests were sent to the sender's own card; remove them.
delete from public.swap_requests s
using public.barter_posts p
where p.id = s.post_id and s.sender_id = p.author_id;

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

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------

-- Foreign keys used by Profile (author's cards, swaps sent).
-- swap_requests.post_id is covered by the unique (post_id, sender_id) index above.
create index if not exists idx_barter_posts_author  on public.barter_posts (author_id);
create index if not exists idx_swap_requests_sender on public.swap_requests (sender_id);

-- The Feed query: active cards, newest first.
drop index if exists public.idx_barter_posts_status;
create index if not exists idx_barter_posts_status_created on public.barter_posts (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Unused columns
-- ---------------------------------------------------------------------------

-- Colours come from the app per category (src/lib/categoryPalette.ts).
alter table public.subjects
  drop column badge_bg,
  drop column text_color,
  drop column color_hex;

-- ---------------------------------------------------------------------------
-- 7. Documentation in the database itself
-- ---------------------------------------------------------------------------
comment on table public.users         is 'AITU students. Phase 2 links id to auth.users (Microsoft sign-in).';
comment on table public.subjects      is 'Course catalogue, grouped into four categories.';
comment on table public.barter_posts  is 'Barter cards: the subject a student needs help with and the one they can teach.';
comment on table public.swap_requests is 'A student asks the author of a card to swap. One request per student per card.';
comment on function public.prevent_self_swap() is 'Blocks swap requests sent to your own card.';
