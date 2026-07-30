# TropeQuest Web

Next.js web app for TropeQuest — discover books by trope, browse series/author pages, track a shelf/TBR, and get personalized recommendations.

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres + Auth + Storage) via `@supabase/ssr` and `@supabase/supabase-js`
- Tailwind CSS
- Google Gemini (`@google/generative-ai`) for admin-side content generation
- Resend for transactional email
- Deployed on Vercel (region pinned to `sin1`)

## Structure

- `app/` — routes (App Router). Notable areas: `books/`, `series/`, `author/`, `tropes/`, `search/`, `because/`, `books-like/`, `shelf/`, `tbr/`, `blog/`, `admin/`, `auth/`, `api/`
- `components/` — shared UI components
- `lib/` — Supabase clients, search helpers, taxonomy, utils
- `content/` — MDX blog content
- `supabase/` — SQL migrations/config
- `public/` — static assets, `llms.txt`

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys
npm run dev
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — start production build
- `npm run lint` — lint

## Notes

- Data comes directly from Supabase (Postgres), not from `tropequest-api`.
- Book enrichment (tropes, genres, covers, prices) is produced by [tropequest-pipeline](../tropequest-pipeline) and written to the same Supabase project.
