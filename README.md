# StudySwap

Peer-to-peer academic barter platform for AITU students: a student offers help with one subject in exchange for help with another. ICT Project, SE-2625.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL) · Vercel

## Getting started

```bash
cp .env.example .env.local   # then fill in the Supabase URL and anon key
npm install
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Project structure

```
src/
  app/                    Pages (one folder per route)
    page.tsx              /         Feed
    login/                /login    Sign in: code to the university e-mail, or Microsoft (AITU accounts)
    welcome/              /welcome  Complete your profile (first sign-in; Microsoft fills in the name)
    create/               /create   Create a barter offer
    profile/              /profile  Student profile; profile/edit: Telegram + student details
    search/               /search   Search: categories, filters, recent searches, results
    favorites/            /favorites Liked cards, with Undo
    layout.tsx            Fonts, metadata
    globals.css           Design tokens (colours, fonts, animations)
  components/
    layout/               AppHeader, BottomNav, MobileShell: used on every page
    auth/                 AuthGate (redirects to /login or /welcome), login page parts
    barter/               BarterCard: the "Needs help / Can teach" card
    ui/                   Generic UI: BottomSheet (accessible modal / bottom sheet)
    feed/ create/ profile/ search/ favorites/  Components used by one page only
  lib/
    supabase.ts           Supabase client
    categoryPalette.ts    Colours for each subject category (the only place they live)
    search.ts             Search filters, AITU programs, recent-search functions
    favorites.ts          Likes: Supabase functions + useFavoriteIds (shared by Feed and Search)
    avatar.ts             Profile photos: crop to 256×256 WebP/JPEG, upload, public URL
    format.ts             Small text helpers (initials, short names)
    auth.ts               Sign-in: e-mail codes, Microsoft, current student, complete profile
    telegram.ts           Telegram linking through the bot: link token, status, unlink
    theme.ts              Light / dark theme: saved choice, applied before paint, circle reveal
  types/
    database.ts           Row types of the Supabase tables
public/                   Logo and icons
```

### Conventions

- **Colours and fonts** come from the tokens in `globals.css` (`bg-page`, `text-ink`, `text-muted`, `border-line`, `font-bricolage`…) and from `categoryPalette.ts` for subjects. No hard-coded copies in pages.
- **Spacing:** page content has 16px side padding; blocks are 16px apart.
- **Data** is loaded in the page and passed down to components as props; components do not call Supabase.
- **Types:** database rows live in `src/types/database.ts`; page-specific shapes live next to the page.

## Database (Supabase)

| Table | Purpose |
| --- | --- |
| `users` | Students: name, university email, Telegram handle, major, year |
| `subjects` | Course catalogue with a category (CS & Dev, Mathematics, Humanities, Languages) |
| `barter_posts` | Barter cards: needed subject, offered subject, topics, contact method, status |
| `swap_requests` | Requests between students on a card |
| `search_history` | Recent searches per student (only through RPC functions) |
| `favorites` | Cards a student liked (only through RPC functions) |

Row Level Security is on. Schema, migrations and the rules the database enforces: see [`supabase/README.md`](supabase/README.md).

## Team

- Alzhan Yerzhanuly: Lead UI/UX Designer & Project Lead
- Nursat Tileuberdyuly: Cloud & Systems Architecture Engineer
- Amanzhan Nurash: Business Analyst & Lead Presenter
