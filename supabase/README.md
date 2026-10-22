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
- E-mail must be `…@astanait.edu.kz`
- Telegram is optional; when set: 5–32 letters, digits or `_`, without `@`
- Topic texts are required, at most 150 characters (same as the Create form)
- The two subjects of a card must differ
- One swap request per student per card; you cannot request your own card (trigger `prevent_self_swap`)
- Status, contact method, role, year and category only accept the listed values

**Access (Row Level Security)**
- Anyone can read subjects, active cards and swap requests
- Visitors can create active cards only (temporary, until sign-in); they cannot update, delete or create users
- The API roles have no `TRUNCATE`, `TRIGGER` or `REFERENCES` rights; only admins edit the subject catalogue
- `search_history` and `favorites` have no table rights for the API roles; it is reached only through `SECURITY DEFINER` functions that act on the current student (the Supabase advisor flags these as callable without sign-in: intended until phase 2)

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
