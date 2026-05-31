-- ============================================================
-- Connect Deep Analysis reports to Trend Feed signals.
-- Run after signal enrichment / monetization migrations.
-- ============================================================

alter table public.trend_signals
  add column if not exists source_type text not null default 'discovered'
    check (source_type in ('discovered', 'from_analysis')),
  add column if not exists report_id uuid references public.reports(id) on delete set null,
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by_session_id text;

create index if not exists trend_signals_source_type_idx
  on public.trend_signals (source_type);

create index if not exists trend_signals_report_id_idx
  on public.trend_signals (report_id);

create index if not exists trend_signals_created_by_user_idx
  on public.trend_signals (created_by_user_id, updated_at desc);

create index if not exists trend_signals_created_by_session_idx
  on public.trend_signals (created_by_session_id, updated_at desc);

-- Keep existing public read behavior for MVP feed visibility.
-- Writes remain server-side through service role routes and collectors.
alter table public.trend_signals enable row level security;

drop policy if exists "Public read trend signals" on public.trend_signals;
create policy "Public read trend signals"
  on public.trend_signals for select
  using (true);

drop policy if exists "Service role writes trend signals" on public.trend_signals;
create policy "Service role writes trend signals"
  on public.trend_signals for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
