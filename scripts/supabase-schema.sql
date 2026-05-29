-- ============================================================
-- scripts/supabase-schema.sql
-- Run this in your Supabase SQL editor to create the reports table.
-- ============================================================

-- Enable UUID generation (Supabase has this by default)
create extension if not exists "pgcrypto";

-- ---- Reports table ------------------------------------------
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- Input fields from the analysis form
  niche           text not null,
  location        text not null,
  target_customer text not null,
  product_type    text not null,
  price_range     text,
  competitors_input text,

  -- Full AI-generated report as JSONB for flexibility
  report_data     jsonb not null,

  -- Flag for mock/demo reports
  is_mock         boolean not null default false
);

-- ---- Index for fast sorting ---------------------------------
create index if not exists reports_created_at_idx
  on public.reports (created_at desc);

-- ---- Row Level Security -------------------------------------
-- By default, allow public read/write (suitable for MVP without auth).
-- In production, add user_id and filter by authenticated user.
alter table public.reports enable row level security;

-- Allow anyone to read reports (MVP — no auth yet)
create policy "Public read access"
  on public.reports for select
  using (true);

-- Allow anyone to insert (MVP — add auth in production)
create policy "Public insert access"
  on public.reports for insert
  with check (true);

-- Allow anyone to delete (MVP — restrict to owner in production)
create policy "Public delete access"
  on public.reports for delete
  using (true);

-- ---- Trend signal enum guards -------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trend_state') then
    create type public.trend_state as enum (
      'emerging',
      'rising',
      'breakout',
      'cooling',
      'saturated'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'signal_source') then
    create type public.signal_source as enum (
      'google_trends',
      'fallback_seed',
      'mock'
    );
  end if;
end $$;

-- ---- Current trend signals ----------------------------------
create table if not exists public.trend_signals (
  id                    text primary key,
  keyword               text not null unique,
  name                  text not null,
  niche                 text not null,
  category              text not null,
  current_trend_value   integer not null check (current_trend_value between 0 and 100),
  baseline_trend_value  integer not null check (baseline_trend_value between 0 and 100),
  velocity_score        integer not null check (velocity_score between -100 and 100),
  acceleration_score    integer not null check (acceleration_score between -100 and 100),
  opportunity_score     integer not null check (opportunity_score between 0 and 100),
  confidence_score      integer not null check (confidence_score between 0 and 100),
  reddit_mentions_last_7_days integer not null default 0 check (reddit_mentions_last_7_days >= 0),
  reddit_mentions_previous_7_days integer not null default 0 check (reddit_mentions_previous_7_days >= 0),
  reddit_growth_rate    numeric not null default 0,
  reddit_source         text not null default 'unavailable',
  reddit_confidence     integer not null default 0 check (reddit_confidence between 0 and 100),
  etsy_listing_count    integer check (etsy_listing_count is null or etsy_listing_count >= 0),
  etsy_competition_level text check (etsy_competition_level is null or etsy_competition_level in ('low', 'medium', 'high')),
  etsy_avg_price        text,
  etsy_source           text not null default 'unavailable',
  etsy_confidence       integer not null default 0 check (etsy_confidence between 0 and 100),
  source_count          integer not null default 1 check (source_count between 1 and 3),
  source_confidence     integer not null default 0 check (source_confidence between 0 and 100),
  score_explanation     jsonb not null default '{}'::jsonb,
  why_trending          text,
  trend_state           public.trend_state not null,
  summary               text not null,
  tags                  text[] not null default '{}',
  platforms             text[] not null default '{}',
  avg_price             text,
  competition_level     text not null check (competition_level in ('low', 'medium', 'high')),
  signal_source         public.signal_source not null default 'fallback_seed',
  sparkline             integer[] not null default '{}',
  detected_at           timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists trend_signals_score_idx
  on public.trend_signals (opportunity_score desc);

create index if not exists trend_signals_state_idx
  on public.trend_signals (trend_state);

create index if not exists trend_signals_reddit_growth_idx
  on public.trend_signals (reddit_growth_rate desc);

create index if not exists trend_signals_etsy_competition_idx
  on public.trend_signals (etsy_competition_level);

create index if not exists trend_signals_source_count_idx
  on public.trend_signals (source_count desc);

alter table public.trend_signals enable row level security;

create policy "Public read trend signals"
  on public.trend_signals for select
  using (true);

create policy "Service role writes trend signals"
  on public.trend_signals for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---- Historical snapshots -----------------------------------
create table if not exists public.signal_history (
  id                    uuid primary key default gen_random_uuid(),
  signal_id             text references public.trend_signals(id) on delete cascade,
  keyword               text not null,
  trend_value           integer not null check (trend_value between 0 and 100),
  baseline_value        integer not null check (baseline_value between 0 and 100),
  velocity_score        integer not null check (velocity_score between -100 and 100),
  acceleration_score    integer not null check (acceleration_score between -100 and 100),
  opportunity_score     integer not null check (opportunity_score between 0 and 100),
  confidence_score      integer not null check (confidence_score between 0 and 100),
  trend_state           public.trend_state not null,
  signal_source         public.signal_source not null default 'fallback_seed',
  collected_at          timestamptz not null default now()
);

create index if not exists signal_history_keyword_collected_idx
  on public.signal_history (keyword, collected_at desc);

alter table public.signal_history enable row level security;

create policy "Public read signal history"
  on public.signal_history for select
  using (true);

create policy "Service role writes signal history"
  on public.signal_history for insert
  with check (auth.role() = 'service_role');

-- ---- Collection job audit log -------------------------------
create table if not exists public.collection_jobs (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null default 'google_trends',
  status              text not null check (
    status in ('running', 'completed', 'completed_with_warnings', 'failed')
  ),
  signals_collected   integer not null default 0,
  error_message       text,
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists collection_jobs_started_idx
  on public.collection_jobs (started_at desc);

alter table public.collection_jobs enable row level security;

create policy "Public read collection jobs"
  on public.collection_jobs for select
  using (true);

create policy "Service role writes collection jobs"
  on public.collection_jobs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---- Profiles and alert preferences -------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  plan_current_period_end timestamptz,
  daily_briefing_enabled boolean not null default true,
  email_alerts_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_stripe_customer_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_stripe_subscription_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists profiles_plan_idx
  on public.profiles (plan);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_briefing_enabled boolean not null default true,
  email_alerts_enabled boolean not null default false,
  daily_briefing_last_sent_at timestamptz,
  alert_email_last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alert_preferences enable row level security;

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

-- ---- Anonymous and user-owned watchlists --------------------
create table if not exists public.watchlist_items (
  id                uuid primary key default gen_random_uuid(),
  session_id        text not null check (length(trim(session_id)) > 0),
  user_id           uuid references auth.users(id) on delete cascade,
  signal_id         text not null references public.trend_signals(id) on delete cascade,
  alert_threshold   integer not null default 80 check (alert_threshold between 0 and 100),
  created_at        timestamptz not null default now(),
  last_alerted_at   timestamptz,
  unique (session_id, signal_id),
  unique (user_id, signal_id)
);

create index if not exists watchlist_items_session_created_idx
  on public.watchlist_items (session_id, created_at desc);

create index if not exists watchlist_items_signal_idx
  on public.watchlist_items (signal_id);

create index if not exists watchlist_items_threshold_idx
  on public.watchlist_items (alert_threshold);

create index if not exists watchlist_items_user_created_idx
  on public.watchlist_items (user_id, created_at desc);

alter table public.watchlist_items enable row level security;

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

-- ============================================================
-- PRODUCTION UPGRADE PATH (add when you implement auth):
-- ============================================================
--
-- 1. Add user_id column:
--    alter table public.reports add column user_id uuid references auth.users;
--
-- 2. Replace policies with user-scoped ones:
--    create policy "User owns their reports"
--      on public.reports for all
--      using (auth.uid() = user_id)
--      with check (auth.uid() = user_id);
--
-- ============================================================
