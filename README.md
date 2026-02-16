# Smart Bookmark App

A bookmark manager built with Next.js App Router, Supabase Auth/Database/Realtime, and Tailwind CSS.

## Features

- Google OAuth login (no email/password)
- Add bookmarks (`title + url`)
- Bookmarks are private per user (RLS policies)
- Realtime sync across tabs
- Delete own bookmarks

## Tech Stack

- Next.js 14 (App Router)
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

1. OAuth callback session exchange
- Problem: Google OAuth returns with a code that must be exchanged server-side.
- Fix: Added `app/auth/callback/route.ts` to call `supabase.auth.exchangeCodeForSession(code)` and redirect home.

2. Session consistency between client and server routes
- Problem: Session cookies can drift without middleware refresh.
- Fix: Added `middleware.ts` + `lib/supabase/middleware.ts` using `@supabase/ssr` `updateSession` pattern.

3. Realtime updates and user isolation
- Problem: Realtime can include unrelated events if channel is too broad.
- Fix: Subscribed to `postgres_changes` with `filter: user_id=eq.<currentUserId>` and also enforced RLS at database level.

4. URL validation UX
- Problem: users often enter URLs without protocol.
- Fix: Auto-prefix `https://` and validate with `new URL(...)` before insert.

## Submission Checklist

- Live Vercel URL: _add after deploy_
- Public GitHub repo: _add after push_
- README with challenges/solutions: included