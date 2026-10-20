# StudySwap database (Supabase / PostgreSQL)

Every change to the database lives in `migrations/` as a numbered SQL file, so the schema can be reviewed, versioned and recreated from scratch.

## Migrations

| File | What it does | Status on the project |
| --- | --- | --- |
| `20261010000000_baseline.sql` | Snapshot of the schema that was created by hand in the dashboard | Applied (before tracking) |
| `20261020182414_phase1a_hardening.sql` | Data rules, least privilege, swap rules, indexes | Applied |
| `20261020190000_phase1b_cleanup.sql` | Removes duplicate policies, the old e-mail rule, 2 self-swap test rows, unused colour columns | Applied (SQL Editor) |

### Destructive migrations

Supabase asks for confirmation before destructive statements (`DROP`, `DELETE`). Run such a migration in the [SQL Editor](https://supabase.com/dashboard/project/bepchknwwdmvugpcypgt/sql/new), confirm, then record it in `supabase_migrations.schema_migrations` with the file's version so the history matches this folder.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | AITU students: name, `@astanait.edu.kz` e-mail, optional Telegram, major, year |
| `subjects` | Course catalogue in four categories: CS & Dev, Mathematics, Humanities, Languages |
| `barter_posts` | Barter cards: needed subject + topics, offered subject + topics, contact method, status |
| `swap_requests` | A student asks a card's author to swap: `pending` → `accepted` / `declined` |

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

## Roadmap

**Phase 2: with Microsoft sign-in**
- Link `users.id` to `auth.users.id` and create the profile automatically on first sign-in
- Owner-based rules: create, edit and close only your own cards and requests
- E-mails visible to signed-in students only
- Authors see their own completed and archived cards

**Phase 3: new tables**
- Favorites (likes are stored only in the browser today)
- Ratings after a swap
- The subjects a student can teach, from the sign-up questionnaire
