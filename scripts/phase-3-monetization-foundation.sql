-- ============================================================
-- Phase 3 migration: auth-owned watchlists, plans, alert prefs
-- Run this in Supabase SQL Editor after Phase 2 / enrichment SQL.
-- ============================================================

-- Profiles hold the simple free/pro plan until Stripe subscriptions exist.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  daily_briefing_enabled boolean not null default true,
  email_alerts_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Profile creation and plan updates happen server-side via service role.
-- Do not add public insert/update policies for profiles.

-- Future email/briefing alert settings. Not wired to delivery yet.
create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_briefing_enabled boolean not null default true,
  email_alerts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alert_preferences enable row level security;

drop policy if exists "Users read own alert preferences" on public.alert_preferences;
drop policy if exists "Users insert own alert preferences" on public.alert_preferences;
drop policy if exists "Users update own alert preferences" on public.alert_preferences;

create policy "Users read own alert preferences"
  on public.alert_preferences for select
  using (auth.uid() = user_id);

create policy "Users insert own alert preferences"
  on public.alert_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own alert preferences"
  on public.alert_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Attach existing watchlist rows to authenticated users while preserving
-- anonymous session watchlists for guests.
alter table public.watchlist_items
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists watchlist_items_user_signal_uidx
  on public.watchlist_items (user_id, signal_id);

create index if not exists watchlist_items_user_created_idx
  on public.watchlist_items (user_id, created_at desc);

drop policy if exists "Public read watchlist items by session id" on public.watchlist_items;
drop policy if exists "Public insert watchlist items with session id" on public.watchlist_items;
drop policy if exists "Public update watchlist items with session id" on public.watchlist_items;
drop policy if exists "Public delete watchlist items with session id" on public.watchlist_items;
drop policy if exists "Watchlist select owner or guest" on public.watchlist_items;
drop policy if exists "Watchlist insert owner or guest" on public.watchlist_items;
drop policy if exists "Watchlist update owner or guest" on public.watchlist_items;
drop policy if exists "Watchlist delete owner or guest" on public.watchlist_items;

create policy "Watchlist select owner or guest"
  on public.watchlist_items for select
  using (
    auth.uid() = user_id
    or (user_id is null and length(trim(session_id)) > 0)
  );

create policy "Watchlist insert owner or guest"
  on public.watchlist_items for insert
  with check (
    (auth.uid() = user_id and length(trim(session_id)) > 0)
    or (user_id is null and length(trim(session_id)) > 0)
  );

create policy "Watchlist update owner or guest"
  on public.watchlist_items for update
  using (
    auth.uid() = user_id
    or (user_id is null and length(trim(session_id)) > 0)
  )
  with check (
    (auth.uid() = user_id and length(trim(session_id)) > 0)
    or (user_id is null and length(trim(session_id)) > 0)
  );

create policy "Watchlist delete owner or guest"
  on public.watchlist_items for delete
  using (
    auth.uid() = user_id
    or (user_id is null and length(trim(session_id)) > 0)
  );
