-- ============================================================
-- Phase 2 migration: persistent anonymous watchlists + alerts
-- Run this in Supabase SQL Editor after Phase 1 tables exist.
-- ============================================================

create table if not exists public.watchlist_items (
  id                uuid primary key default gen_random_uuid(),
  session_id        text not null check (length(trim(session_id)) > 0),
  signal_id         text not null references public.trend_signals(id) on delete cascade,
  alert_threshold   integer not null default 80 check (alert_threshold between 0 and 100),
  created_at        timestamptz not null default now(),
  last_alerted_at   timestamptz,
  unique (session_id, signal_id)
);

create index if not exists watchlist_items_session_created_idx
  on public.watchlist_items (session_id, created_at desc);

create index if not exists watchlist_items_signal_idx
  on public.watchlist_items (signal_id);

create index if not exists watchlist_items_threshold_idx
  on public.watchlist_items (alert_threshold);

alter table public.watchlist_items enable row level security;

create policy "Public read watchlist items by session id"
  on public.watchlist_items for select
  using (true);

create policy "Public insert watchlist items with session id"
  on public.watchlist_items for insert
  with check (length(trim(session_id)) > 0);

create policy "Public update watchlist items with session id"
  on public.watchlist_items for update
  using (length(trim(session_id)) > 0)
  with check (length(trim(session_id)) > 0);

create policy "Public delete watchlist items with session id"
  on public.watchlist_items for delete
  using (length(trim(session_id)) > 0);
