# Companion — a calm relationship tracker

A minimalist, Apple-inspired relationship tracker. Cream-toned, editorial, and
deliberately quiet — no streaks, no scores, no notifications. Just gentle nudges
to reach out to the people who matter.

Built with **Next.js (App Router)**, **Tailwind CSS v4**, **Supabase**
(Google auth + Postgres), and **date-fns**. Designed to deploy on **Vercel**.

## Features

- **Single page.** Everything lives on one calm, scrollable screen.
- **Merged "Reach out" checklist.** Surfaces people who are overdue (based on
  your chosen cadence) _and_ people with an event coming up in the next 8 days.
  Tick the box to log an interaction.
- **Inline expansion.** Tap a name to expand their card — context notes,
  upcoming events, and controls to add notes/events or archive them.
- **Human-friendly time.** Interactions read as "2 weeks ago", never exact days.
- **Google sign-in** with per-user data isolation (Postgres row-level security).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
   tables (relationships, events, context, interactions) and row-level security.

## 2. Enable Google sign-in

1. In Supabase: **Authentication → Providers → Google → Enable**.
2. Create OAuth credentials in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (**OAuth client ID → Web application**). Add this **Authorized redirect URI**:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

3. Paste the Google **Client ID** and **Client Secret** into Supabase and save.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to your
   deployed URL (e.g. `https://your-app.vercel.app`) and add
   `http://localhost:3000` under **Redirect URLs** for local dev.

## 3. Configure environment variables

Copy the example and fill in values from **Supabase → Project Settings → API**:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project** and import the repo.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in **Project Settings → Environment
   Variables**.
4. Deploy. Then update the Supabase **Site URL** (step 2.4) to your Vercel
   domain so Google redirects resolve correctly.

## Data model

| Table             | Fields                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `relationships`   | name, photo, birthday, cadence (1/2/3 weeks), last_interaction, archived |
| `events`          | relationship_id, title, date, notes, is_birthday                      |
| `context_entries` | relationship_id, text                                                  |
| `interactions`    | relationship_id, date, type (message/call/met/video/other)            |

Every table is protected by row-level security scoped to the signed-in user.

## Project structure

```
app/
  page.tsx            # loads data, renders the dashboard
  actions.ts          # server actions (all CRUD)
  login/              # Google sign-in screen
  auth/               # OAuth callback + sign-out routes
  components/         # Dashboard, ReachOut, PersonCard, forms, etc.
lib/
  supabase/           # browser + server + middleware clients
  dates.ts            # cadence & "weeks ago" helpers
  types.ts            # shared data types
supabase/schema.sql   # database schema + RLS
```
