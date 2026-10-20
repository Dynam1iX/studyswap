-- Phase 1b: removals that phase 1a made possible.
-- NOT APPLIED YET: Supabase asks for confirmation on destructive statements.
-- Run it once in the Supabase SQL Editor (see supabase/README.md).

-- Every read policy existed twice under two names; keep the descriptive ones.
drop policy if exists public_read_subjects     on public.subjects;
drop policy if exists public_read_users        on public.users;
drop policy if exists public_read_active_posts on public.barter_posts;

-- Old e-mail rule allowed @gmail.com; check_email_university replaces it.
alter table public.users drop constraint if exists check_email_format;

-- Two seeded test requests were sent to the sender's own card.
delete from public.swap_requests s
using public.barter_posts p
where p.id = s.post_id and s.sender_id = p.author_id;

-- Replaced by idx_barter_posts_status_created.
drop index if exists public.idx_barter_posts_status;

-- Colours come from the app per category (src/lib/categoryPalette.ts).
alter table public.subjects
  drop column if exists badge_bg,
  drop column if exists text_color,
  drop column if exists color_hex;
