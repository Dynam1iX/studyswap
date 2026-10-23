# StudySwap database (Supabase / PostgreSQL)

Every change to the database lives in `migrations/` as a numbered SQL file, so the schema can be reviewed, versioned and recreated from scratch.

## Migrations

| File | What it does | Status on the project |
| --- | --- | --- |
| `20261010000000_baseline.sql` | Snapshot of the schema that was created by hand in the dashboard | Applied (before tracking) |
| `20261020182414_phase1a_hardening.sql` | Data rules, least privilege, swap rules, indexes | Applied |
| `20261020190000_phase1b_cleanup.sql` | Removes duplicate policies, the old e-mail rule, 2 self-swap test rows, unused colour columns | Applied, then wiped by the reset below |
| `20261020194518_phase1c_restore.sql` | Restores phase 1a on the re-created tables | Applied |
| `20261020194600_phase1c_cleanup.sql` | Restores phase 1b, keeping the `public_read_*` policies (the only read policies after the reset) | Applied (SQL Editor) |
| `20261022120000_search_history.sql` | Recent searches: `search_history` table + `get/add/delete_recent_search(es)`, `clear_recent_searches` | Applied (SQL Editor) |
| `20261022140000_favorites.sql` | Likes: `favorites` table + `get_favorites`, `add_favorite`, `remove_favorite` | Applied (SQL Editor) |
| `20261023010000_owner_rules.sql` | Phase 2: no access without sign-in, own cards/requests only, read-only profile, Telegram handle hidden by column (`get_telegram_handles`), participants-only swap requests, `delete_my_account`, demo fallback removed | Applied (SQL Editor) |
| `20261023120000_telegram_bot.sql` | Telegram bot: one-time link tokens (`create_telegram_link`, `get_telegram_link_status`), `telegram_link_from_bot` (service role only), `unlink_my_telegram`, `users.telegram_user_id` (one Telegram account per student) | Applied (SQL Editor) |
| `20261023140000_remove_test_accounts.sql` | Removes the 2026-10-20 test accounts (profiles without a sign-in account) with their cards, requests and likes | Applied (SQL Editor) |
| `20261023180000_private_data.sql` | Part 1 (additive): `get_my_profile`, `get_post_contacts` (Telegram handle or e-mail per card), signed-in read policy for profile photos | Applied (SQL Editor) |
| `20261023190000_private_data_lock.sql` | Part 2 (after the app is live): other students see only id, name, major, year, photo path; private avatars bucket | Applied (SQL Editor) |
| `20261024010000_swap_requests.sql` | Swap requests through functions only: `send_swap_request`, `cancel_swap_request`, `respond_swap_request`, `complete_swap`, `get_my_requests`, `mark_requests_seen`; statuses cancelled/completed; accepted or completed swaps reveal Telegram | Pending |
| `20261022200000_sign_in.sql` | Only `6 digits@astanait.edu.kz` can sign up (trigger on `auth.users`); `complete_my_profile`; signed-in students never fall back to the demo account | Applied (SQL Editor) |
| `20261022180000_avatars.sql` | Storage bucket `avatars` (own-folder policies), `users.avatar_path`, `set_my_avatar`, `remove_my_avatar` | Applied (SQL Editor) |
| `20261022160000_profile_settings.sql` | `users.telegram_visibility`; `get_my_cards`, `update_my_card`, `set_my_card_status`, `delete_my_card`, `set_telegram_visibility`, `export_my_data` | Applied (SQL Editor) |

### Never re-run the setup script

On 2026-10-20 19:03 UTC the old setup script (`DROP TABLE … CASCADE`, `CREATE TABLE …`, test data) was run again from the SQL Editor. It deleted every table, so all phase 1 rules and all data created through the app were lost; phase 1c restores the rules. Change the database only through new files in `migrations/`.

### Destructive migrations

Supabase asks for confirmation before destructive statements (`DROP`, `DELETE`). Run such a migration in the [SQL Editor](https://supabase.com/dashboard/project/bepchknwwdmvugpcypgt/sql/new), confirm, then record it in `supabase_migrations.schema_migrations` with the file's version so the history matches this folder.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | AITU students: name, `@astanait.edu.kz` e-mail, optional Telegram, major, year |
| `subjects` | Course catalogue in four categories: CS & Dev, Mathematics, Humanities, Languages |
| `barter_posts` | Barter cards: needed subject + topics, offered subject + topics, contact method, status |
| `swap_requests` | A student asks a card's author to swap: `pending` → `accepted` / `declined` |
| `search_history` | Recent searches of a student (10 newest, one row per query) |
| `favorites` | Cards a student liked (one row per student and card) |

## Rules enforced by the database

**Data**
- Accounts: only `6 digits@astanait.edu.kz` can sign up (trigger on `auth.users`)
- Telegram is optional; when set: 5–32 letters, digits or `_`, without `@`
- Topic texts are required, at most 150 characters (same as the Create form)
- The two subjects of a card must differ
- One swap request per student per card; you cannot request your own card (trigger `prevent_self_swap`)
- Status, contact method, role, year and category only accept the listed values

**Access (Row Level Security, phase 2)**
- Nothing is readable or callable without signing in
- Students create cards and swap requests only as themselves; cards change only through `update_my_card` / `set_my_card_status` / `delete_my_card`
- The profile row is read-only; it changes only through functions (avatar, Telegram visibility)
- Telegram handles are not readable from the table: `get_telegram_handles` returns your own, public ones, and those of students with an accepted swap between you
- Swap requests are visible only to the sender and the card's author
- `search_history`, `favorites` and every `*_my_*` function act only on the signed-in student
- Profile photos: anyone signed in can view them; a student can change files only in `avatars/<own id>/`

## Roadmap

**Phase 2: with Microsoft sign-in**
- Link `users.id` to `auth.users.id` and create the profile automatically on first sign-in
- Remove the demo-account fallback from `private.current_user_id()` and revoke the recent-search and favorite functions from `anon`
- Owner-based rules: create, edit and close only your own cards and requests
- E-mails visible to signed-in students only
- Authors see their own completed and archived cards

**Phase 3: new tables**
- Ratings after a swap
- The subjects a student can teach, from the sign-up questionnaire

## Edge Functions

`functions/telegram-bot` is the Telegram bot's webhook (deployed with `verify_jwt = false`; it checks Telegram's `X-Telegram-Bot-Api-Secret-Token` header instead). A student opens `t.me/<bot>?start=<token>` from the site; the function links the account through `telegram_link_from_bot` and answers in the student's Telegram language (EN/RU/KZ) inside the webhook response, so it needs no bot token.

Secret: `TELEGRAM_WEBHOOK_SECRET` (Edge Functions → Secrets). The webhook is registered once with Telegram's `setWebhook` (url = `https://bepchknwwdmvugpcypgt.supabase.co/functions/v1/telegram-bot`, the same `secret_token`, `allowed_updates=["message"]`).
