-- Unlinked — Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable extensions
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table if not exists public.users (
  id            uuid references auth.users(id) on delete cascade primary key,
  alias         text unique not null,
  avatar_seed   text not null default '',
  trust_score   float not null default 50,
  streak_count  int not null default 0,
  streak_last_at timestamptz,
  interests     text[] default '{}',
  is_admin      boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Posts
create table if not exists public.posts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users(id) on delete cascade not null,
  content             text not null check (char_length(content) between 5 and 1000),
  category            text not null check (category in ('confession','opinion','story','hottake')),
  trust_score_at_post float not null default 50,
  visibility_weight   float not null default 0.5,
  report_count        int not null default 0,
  status              text not null default 'live' check (status in ('live','hidden','removed')),
  prompt_id           uuid,
  created_at          timestamptz not null default now()
);

-- Reactions
create table if not exists public.reactions (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid references public.posts(id) on delete cascade not null,
  user_id   uuid references public.users(id) on delete cascade not null,
  type      text not null check (type in ('relatable','insightful','respect')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- Reports
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.posts(id) on delete cascade not null,
  reporter_id uuid references public.users(id) on delete cascade not null,
  reason      text not null check (reason in ('harassment','real_person_named','spam','harmful_content','legal_violation')),
  created_at  timestamptz not null default now(),
  unique(post_id, reporter_id)
);

-- Trust events log
create table if not exists public.trust_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  delta      float not null,
  created_at timestamptz not null default now()
);

-- Weekly prompts
create table if not exists public.prompts (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  week_of    date not null,
  active     boolean not null default false,
  created_at timestamptz not null default now()
);

-- Comments (for future)
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public.posts(id) on delete cascade not null,
  user_id    uuid references public.users(id) on delete cascade not null,
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper RPC: update_trust_score (clamps 0–100)
-- ============================================================
create or replace function public.update_trust_score(p_user_id uuid, p_delta float)
returns void
language plpgsql
security definer
as $$
begin
  update public.users
  set trust_score = greatest(0, least(100, trust_score + p_delta))
  where id = p_user_id;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users    enable row level security;
alter table public.posts    enable row level security;
alter table public.reactions enable row level security;
alter table public.reports  enable row level security;
alter table public.trust_events enable row level security;
alter table public.prompts  enable row level security;
alter table public.comments enable row level security;

-- USERS policies
create policy "Users can read all public fields" on public.users
  for select using (true);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- POSTS policies
create policy "Anyone can read live posts" on public.posts
  for select using (status = 'live' or auth.uid() = user_id);
create policy "Authenticated users can insert" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = user_id);

-- REACTIONS policies
create policy "Anyone can read reactions" on public.reactions
  for select using (true);
create policy "Auth users can insert reactions" on public.reactions
  for insert with check (auth.uid() = user_id);
create policy "Auth users can delete own reactions" on public.reactions
  for delete using (auth.uid() = user_id);
create policy "Auth users can update own reactions" on public.reactions
  for update using (auth.uid() = user_id);

-- REPORTS policies
create policy "Auth users can submit reports" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "Users can see own reports" on public.reports
  for select using (auth.uid() = reporter_id);

-- TRUST EVENTS — read own only
create policy "Users can read own trust events" on public.trust_events
  for select using (auth.uid() = user_id);
create policy "Service role can write trust events" on public.trust_events
  for all using (true);

-- PROMPTS — public read
create policy "Anyone can read active prompts" on public.prompts
  for select using (active = true);

-- COMMENTS
create policy "Anyone can read comments" on public.comments
  for select using (true);
create policy "Auth users can insert comments" on public.comments
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
create index if not exists posts_visibility_created on public.posts(visibility_weight desc, created_at desc)
  where status = 'live';
create index if not exists posts_category on public.posts(category) where status = 'live';
create index if not exists posts_user_id on public.posts(user_id);
create index if not exists reactions_post_id on public.reactions(post_id);
create index if not exists reports_post_id on public.reports(post_id);
create index if not exists trust_events_user_id on public.trust_events(user_id, created_at desc);

-- ============================================================
-- Seed: Initial weekly prompt
-- ============================================================
insert into public.prompts (text, week_of, active)
values (
  'The thing you pretended didn''t hurt — but it did.',
  current_date,
  true
);
