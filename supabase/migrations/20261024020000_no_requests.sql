-- Swap requests and ratings are not part of the app (decided 2026-10-24): students
-- contact each other directly. The "Telegram only after I accept a request" setting
-- therefore no longer means anything: every linked Telegram is visible to signed-in
-- students again. The column, the swap_requests table and the functions stay for now,
-- unused, so nothing else breaks.

update public.users set telegram_visibility = 'everyone' where telegram_visibility <> 'everyone';
alter table public.users alter column telegram_visibility set default 'everyone';

-- The app no longer changes the setting.
revoke execute on function public.set_telegram_visibility(text) from authenticated;

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261024020000', 'no_requests')
on conflict (version) do nothing;
