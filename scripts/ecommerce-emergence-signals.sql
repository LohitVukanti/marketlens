-- ============================================================
-- Ecommerce emergence signal fields
-- Adds evidence and data-quality fields for "Exploding Topics
-- for ecommerce products" positioning.
-- ============================================================

alter table public.trend_signals
  add column if not exists emergence_score integer check (emergence_score is null or emergence_score between 0 and 100),
  add column if not exists data_quality text not null default 'needs_confirmation'
    check (data_quality in ('verified', 'emerging', 'needs_confirmation', 'demo')),
  add column if not exists trend_age_weeks integer check (trend_age_weeks is null or trend_age_weeks >= 0),
  add column if not exists first_detected_at timestamptz,
  add column if not exists google_growth_4w numeric,
  add column if not exists google_growth_8w numeric,
  add column if not exists etsy_saturation_score integer check (etsy_saturation_score is null or etsy_saturation_score between 0 and 100),
  add column if not exists is_demo_data boolean not null default false;

update public.trend_signals
set
  emergence_score = coalesce(emergence_score, opportunity_score),
  first_detected_at = coalesce(first_detected_at, detected_at),
  trend_age_weeks = coalesce(trend_age_weeks, greatest(0, floor(extract(epoch from (now() - detected_at)) / 604800)::integer)),
  is_demo_data = coalesce(is_demo_data, signal_source = 'fallback_seed'),
  data_quality = case
    when coalesce(is_demo_data, false) or signal_source = 'fallback_seed' then 'demo'
    when confidence_score >= 72 and source_count >= 2 then 'verified'
    when confidence_score >= 45 then 'emerging'
    else 'needs_confirmation'
  end;

create index if not exists trend_signals_emergence_score_idx
  on public.trend_signals (emergence_score desc);

create index if not exists trend_signals_data_quality_idx
  on public.trend_signals (data_quality);

create index if not exists trend_signals_demo_idx
  on public.trend_signals (is_demo_data);

create table if not exists public.candidate_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  category text not null,
  source text not null default 'curated_seed',
  status text not null default 'candidate'
    check (status in ('candidate', 'collecting', 'verified', 'rejected')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_keywords enable row level security;

drop policy if exists "Public read verified candidate keywords" on public.candidate_keywords;
create policy "Public read verified candidate keywords"
  on public.candidate_keywords for select
  using (status = 'verified');

drop policy if exists "Service role manages candidate keywords" on public.candidate_keywords;
create policy "Service role manages candidate keywords"
  on public.candidate_keywords for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
