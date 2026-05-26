# Unlinked

An anonymous, behavior-driven social platform for raw emotional honesty.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open SQL Editor, paste `supabase/schema.sql`, and run it.
3. Copy your project URL and anon key from Project Settings > API.
4. In Supabase Auth settings, enable email/password authentication.

### 3. Configure environment variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

This repo includes `vercel.json` for the Next.js build. Add the same environment variables in Vercel Project Settings before deploying.

## Architecture

```text
app/
├── login/          -> Password login and signup
├── onboarding/     -> Alias, avatar, interests, compact
├── feed/           -> Trust-weighted, infinite scroll feed
├── post/new/       -> Composer with pre-moderation gate
├── profile/        -> Private profile and streaks
├── admin/          -> Moderation dashboard
└── api/
    ├── posts/      -> CRUD and visibility weighting
    ├── moderate/   -> Local moderation classifier
    ├── react/      -> Reactions
    ├── report/     -> Rate-limited reporting
    └── auth/       -> Onboarding, signout, callback
```

## Key Features

| Feature | Description |
|---|---|
| Password auth | Supabase email/password login and signup |
| Light/dark mode | User-selectable theme stored in the browser |
| Trust Score | Behavior-driven scoring that controls feed visibility |
| Pre-post moderation | Local classifier with friction and block states |
| Anonymous avatars | DiceBear `bottts-neutral` avatars from aliases |
| Streaks | Private 48-hour streak counter with milestones |
| Reporting | Rate-limited reports, auto-hide at 3 reports |
| Admin dashboard | Flagged post queue with approve/remove/restore |

## Making yourself Admin

In Supabase SQL Editor:

```sql
update public.users set is_admin = true where alias = 'YourAlias';
```

## Tech Stack

- Next.js 16.2 App Router
- TypeScript
- Supabase Auth and PostgreSQL
- Tailwind CSS
- DiceBear avatars
