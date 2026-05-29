-- ============================================================
-- Phase A/B migration: Reddit + Etsy signal enrichment
-- Run this in Supabase SQL Editor before npm run signals:update
-- to persist the new multi-source signal fields.
-- ============================================================

alter table public.trend_signals
  add column if not exists reddit_mentions_last_7_days integer not null default 0 check (reddit_mentions_last_7_days >= 0),
  add column if not exists reddit_mentions_previous_7_days integer not null default 0 check (reddit_mentions_previous_7_days >= 0),
  add column if not exists reddit_growth_rate numeric not null default 0,
  add column if not exists reddit_source text not null default 'unavailable',
  add column if not exists reddit_confidence integer not null default 0 check (reddit_confidence between 0 and 100),
  add column if not exists etsy_listing_count integer check (etsy_listing_count is null or etsy_listing_count >= 0),
  add column if not exists etsy_competition_level text check (etsy_competition_level is null or etsy_competition_level in ('low', 'medium', 'high')),
  add column if not exists etsy_avg_price text,
  add column if not exists etsy_source text not null default 'unavailable',
  add column if not exists etsy_confidence integer not null default 0 check (etsy_confidence between 0 and 100),
  add column if not exists source_count integer not null default 1 check (source_count between 1 and 3),
  add column if not exists source_confidence integer not null default 0 check (source_confidence between 0 and 100),
  add column if not exists score_explanation jsonb not null default '{}'::jsonb,
  add column if not exists why_trending text;

create index if not exists trend_signals_reddit_growth_idx
  on public.trend_signals (reddit_growth_rate desc);

create index if not exists trend_signals_etsy_competition_idx
  on public.trend_signals (etsy_competition_level);

create index if not exists trend_signals_source_count_idx
  on public.trend_signals (source_count desc);
