# Smart Bookmark App

A bookmark manager built with Next.js App Router, Supabase Auth/Database/Realtime, and Tailwind CSS.

## Features

- Google OAuth login (no email/password)
- Add bookmarks (`title + url`)
- Bookmarks are private per user (RLS policies)
- Realtime sync across tabs
- Delete own bookmarks

## Tech Stack

- Next.js 16 (App Router)
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Tailwind CSS
- Vercel (deployment target)

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. In Supabase SQL editor, run:
   - `supabase/schema.sql`
5. In Supabase dashboard:
   - Authentication -> Providers -> Google: enable Google provider
   - Add redirect URL(s):
     - `http://localhost:3000/auth/callback`
     - `https://YOUR_VERCEL_DOMAIN/auth/callback`

6. Run dev server:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. In Supabase Google OAuth settings, ensure Vercel callback URL is whitelisted.

## Database and Privacy Design

- `bookmarks` table stores `user_id`, `title`, `url`, and timestamp.
- Row Level Security is enabled.
- Policies ensure each user can only read/write/delete their own rows.
- Realtime subscription is filtered by `user_id`, so each tab only receives that user's events.

## Problems I Ran Into and How I Solved Them

1. Google login worked, but session handling was tricky at first
- What happened: after OAuth redirect, login state was not always stable.
- How I solved it: I added an auth callback route (`app/auth/callback/route.ts`) to exchange the code for a session, and used Supabase SSR cookie handling so auth stays consistent.

2. RLS blocked inserts in the beginning
- What happened: I got a `row violates row-level security policy` error when adding bookmarks.
- How I solved it: I made sure `user_id` is correctly set on insert and also set a default `auth.uid()` at DB level. After that, inserts worked correctly.

3. Realtime felt inconsistent during local testing
- What happened: updates across tabs were sometimes delayed or missed in dev.
- How I solved it: I kept realtime subscription as primary, and added a light fallback sync only when channel status is unhealthy. This keeps reads low while still feeling reliable.

4. UI actions felt slow on weaker network
- What happened: add/delete felt delayed because UI waited for server response.
- How I solved it: I added optimistic UI (instant add/remove), loading spinners, and rollback on error. This made interactions feel much smoother.

5. Deployment/environment mismatches
- What happened: a few issues came from env setup, OAuth redirect URLs, and newer Next.js behavior.
- How I solved it: I aligned package versions, updated lint/build config, verified Vercel env vars, and added the exact Supabase redirect URLs for local + production.

## Submission Checklist

- Live Vercel URL: _add after deploy_
- Public GitHub repo: _add after push_
- README with challenges/solutions: included
