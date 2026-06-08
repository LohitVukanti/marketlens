-- ============================================================
-- Production launch hardening
-- - Stripe webhook idempotency
-- - Private analysis-derived trend signals
-- - No broad anonymous watchlist table access
--
-- Run after the existing schema and monetization migrations.
-- ============================================================

-- ---- Stripe webhook idempotency -----------------------------
create table if not exists public.processed_stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;

drop policy if exists "Service role manages processed stripe events" on public.processed_stripe_events;
create policy "Service role manages processed stripe events"
  on public.processed_stripe_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---- Trend signal privacy -----------------------------------
-- Discovered/global signals remain public. Analysis-derived
-- signals are readable only by their authenticated owner through
-- RLS, or by server routes using the service role for guest
-- session ownership checks.
drop policy if exists "Public read trend signals" on public.trend_signals;
drop policy if exists "Public read discovered trend signals" on public.trend_signals;
drop policy if exists "Users read own analysis trend signals" on public.trend_signals;

create policy "Public read discovered trend signals"
  on public.trend_signals for select
  using (coalesce(source_type, 'discovered') <> 'from_analysis');

create policy "Users read own analysis trend signals"
  on public.trend_signals for select
  using (
    source_type = 'from_analysis'
    and auth.uid() = created_by_user_id
  );

-- ---- Watchlist privacy --------------------------------------
-- Anonymous watchlists are now accessed through /api/watchlist
-- using the caller's session id header. Do not allow broad anon
-- reads/writes directly against the table.
drop policy if exists "Public read watchlist items by session id" on public.watchlist_items;
drop policy if exists "Public insert watchlist items with session id" on public.watchlist_items;
drop policy if exists "Public update watchlist items with session id" on public.watchlist_items;
drop policy if exists "Public delete watchlist items with session id" on public.watchlist_items;
drop policy if exists "Watchlist select owner or guest" on public.watchlist_items;
drop policy if exists "Watchlist insert owner or guest" on public.watchlist_items;
drop policy if exists "Watchlist update owner or guest" on public.watchlist_items;
drop policy if exists "Watchlist delete owner or guest" on public.watchlist_items;
drop policy if exists "Users read own watchlist items" on public.watchlist_items;
drop policy if exists "Users insert own watchlist items" on public.watchlist_items;
drop policy if exists "Users update own watchlist items" on public.watchlist_items;
drop policy if exists "Users delete own watchlist items" on public.watchlist_items;
drop policy if exists "Service role manages watchlist items" on public.watchlist_items;

create policy "Users read own watchlist items"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "Users insert own watchlist items"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id and length(trim(session_id)) > 0);

create policy "Users update own watchlist items"
  on public.watchlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and length(trim(session_id)) > 0);

create policy "Users delete own watchlist items"
  on public.watchlist_items for delete
  using (auth.uid() = user_id);

create policy "Service role manages watchlist items"
  on public.watchlist_items for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
