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
    create/               /create   Create a barter offer
    profile/              /profile  Student profile
    layout.tsx            Fonts, metadata
    globals.css           Design tokens (colours, fonts, animations)
  components/
    layout/               AppHeader, BottomNav, MobileShell: used on every page
    barter/               BarterCard: the "Needs help / Can teach" card
    ui/                   Generic UI: BottomSheet (accessible modal / bottom sheet)
    feed/ create/ profile/  Components used by one page only
  lib/
    supabase.ts           Supabase client
    categoryPalette.ts    Colours for each subject category (the only place they live)
    format.ts             Small text helpers (initials, short names)
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

Row Level Security is on. The public key can read only `active` barter posts.

## Team

- Alzhan Yerzhanuly: Lead UI/UX Designer & Project Lead
- Nursat Tileuberdyuly: Cloud & Systems Architecture Engineer
- Amanzhan Nurash: Business Analyst & Lead Presenter
