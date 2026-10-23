-- Removes the test accounts created on 2026-10-20 (student_4…student_25, the demo
-- account and the other seeded profiles) before the launch.
--
-- A test account is a profile without a sign-in account: since phase 2 every real
-- student's profile is created from their auth user, so real students are never matched.
-- Their cards, swap requests (sent and received), likes and searches go with them
-- through ON DELETE CASCADE.
--
-- Storage is not cleaned here (SQL cannot delete Storage files): remove the demo
-- avatar folder 11111111-1111-1111-1111-111111111111/ in Storage → avatars by hand.

do $$
declare
  v_users integer;
  v_cards integer;
begin
  select count(*) into v_cards
  from public.barter_posts p
  where not exists (select 1 from auth.users a where a.id = p.author_id);

  delete from public.users u
  where not exists (select 1 from auth.users a where a.id = u.id);
  get diagnostics v_users = row_count;

  raise notice 'Removed % test accounts and % of their cards', v_users, v_cards;
end $$;

-- Record this migration in the history (applied from the SQL Editor).
insert into supabase_migrations.schema_migrations (version, name)
values ('20261023140000', 'remove_test_accounts')
on conflict (version) do nothing;
