-- Baseline: the schema as it existed in Supabase before migrations were tracked
-- (created by hand in the dashboard, captured on 2026-10-20).
--
-- On the existing project this is ALREADY APPLIED. To recreate the database from
-- scratch (e.g. a new Supabase project or `supabase db reset`), run the migrations
-- in this folder in order.

create extension if not exists "uuid-ossp" with schema extensions;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table public.users (
  id              uuid primary key default extensions.uuid_generate_v4(),
  email           varchar(255) not null unique,
  full_name       varchar(100) not null,
  telegram_handle varchar(50)  not null,
  role            varchar(20)  not null default 'student',
  major           varchar(100) not null default 'Software Engineering',
  study_year      integer      not null default 1,
  degree_level    varchar(50)  not null default 'Undergraduate',
  created_at      timestamptz  not null default now(),
  constraint check_email_format  check (email like '%@astanait.edu.kz' or email like '%@gmail.com'),
  constraint check_role_type     check (role in ('student', 'moderator', 'admin')),
  constraint check_study_year    check (study_year between 1 and 3),
  constraint check_degree_level  check (degree_level in ('Undergraduate', 'Master''s Degree', 'PhD'))
);

-- ---------------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------------
create table public.subjects (
  id         serial primary key,
  code       varchar(20)  not null unique,
  name       varchar(100) not null,
  category   varchar(50)  not null,
  department varchar(100) not null,
  badge_bg   varchar(10)  not null,
  text_color varchar(10)  not null,
  color_hex  varchar(10)  not null
);

-- ---------------------------------------------------------------------------
-- barter_posts
-- ---------------------------------------------------------------------------
create table public.barter_posts (
  id                  uuid primary key default extensions.uuid_generate_v4(),
  author_id           uuid    not null references public.users (id) on delete cascade,
  needed_subject_id   integer not null references public.subjects (id) on delete restrict,
  offered_subject_id  integer not null references public.subjects (id) on delete restrict,
  description         text    not null,
  offered_description text    not null default '',
  contact_method      varchar(20) not null default 'email',
  status              varchar(20) not null default 'active',
  created_at          timestamptz not null default now(),
  constraint check_distinct_subjects check (needed_subject_id <> offered_subject_id),
  constraint check_status_valid      check (status in ('active', 'completed', 'archived')),
  constraint check_contact_method    check (contact_method in ('email', 'telegram'))
);

create index idx_barter_posts_needed  on public.barter_posts (needed_subject_id);
create index idx_barter_posts_offered on public.barter_posts (offered_subject_id);
create index idx_barter_posts_status  on public.barter_posts (status);

-- ---------------------------------------------------------------------------
-- swap_requests
-- ---------------------------------------------------------------------------
create table public.swap_requests (
  id         uuid primary key default extensions.uuid_generate_v4(),
  post_id    uuid not null references public.barter_posts (id) on delete cascade,
  sender_id  uuid not null references public.users (id) on delete cascade,
  status     varchar(20) not null default 'pending',
  message    text,
  created_at timestamptz not null default now(),
  constraint check_request_status check (status in ('pending', 'accepted', 'declined'))
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users         enable row level security;
alter table public.subjects      enable row level security;
alter table public.barter_posts  enable row level security;
alter table public.swap_requests enable row level security;

create policy "Allow public read on users profile info" on public.users for select using (true);
create policy public_read_users on public.users for select using (true);
create policy "Allow users to update own profile" on public.users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Allow public read on subjects" on public.subjects for select using (true);
create policy public_read_subjects on public.subjects for select using (true);

create policy "Allow public read on active barter posts" on public.barter_posts for select using (status = 'active');
create policy public_read_active_posts on public.barter_posts for select using (status = 'active');
create policy "Allow insert barter posts with valid distinct subjects" on public.barter_posts for insert to authenticated
  with check (needed_subject_id <> offered_subject_id);
create policy public_insert_posts on public.barter_posts for insert with check (true);

create policy public_read_swaps on public.swap_requests for select using (true);
create policy public_insert_swaps on public.swap_requests for insert with check (true);
