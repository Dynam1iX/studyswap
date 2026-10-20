-- Phase 1c cleanup: the destructive half of the restore.
-- Run in the Supabase SQL Editor (destructive statements need confirmation there);
-- the last statement records it in the migration history as version 20261020194600.
-- Unlike phase 1b, the public_read_* policies are KEPT: after the reset they are the
-- only read policies.

-- Old e-mail rule allowed @gmail.com; check_email_university replaces it.
alter table public.users drop constraint if exists check_email_format;

-- Seeded test requests sent to the sender's own card.
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

-- Record this migration in the history.
insert into supabase_migrations.schema_migrations (version, name)
values ('20261020194600', 'phase1c_cleanup')
on conflict (version) do nothing;
