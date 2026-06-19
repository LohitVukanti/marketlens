-- ============================================================
-- Fix existing Trend Feed credibility rows before public beta.
-- Standalone cleanup; do not run full schema.
-- ============================================================

begin;

-- Remove stale seed examples from feed artifacts. Saved reports are untouched.
delete from public.trend_signals
where lower(keyword) in (
  'sourdough starter kit',
  'crochet cup holder',
  'mushroom lamp'
);

-- Recalculate real source counts from source columns instead of trusting old rows.
update public.trend_signals
set source_count = greatest(
  1,
  (case when signal_source = 'google_trends' then 1 else 0 end) +
  (case when reddit_source = 'reddit_public_json' then 1 else 0 end) +
  (case when etsy_source = 'etsy_api' then 1 else 0 end)
);

-- Demo/fallback rows are only rows where the primary Google signal is fallback/demo.
update public.trend_signals
set is_demo_data = true
where signal_source = 'fallback_seed' or data_quality = 'demo';

-- Re-label data quality conservatively.
update public.trend_signals
set data_quality = case
  when coalesce(is_demo_data, false) or signal_source = 'fallback_seed' then 'demo'
  when coalesce(source_type, 'discovered') = 'from_analysis'
    and (
      (case when signal_source = 'google_trends' then 1 else 0 end) +
      (case when reddit_source = 'reddit_public_json' then 1 else 0 end) +
      (case when etsy_source = 'etsy_api' then 1 else 0 end)
    ) < 2 then 'needs_confirmation'
  when coalesce(google_growth_4w, 0) <= 0 and coalesce(acceleration_score, 0) <= 0 then 'needs_confirmation'
  when coalesce(source_count, 1) < 2 then 'needs_confirmation'
  when reddit_source is distinct from 'reddit_public_json'
    and etsy_source is distinct from 'etsy_api' then 'needs_confirmation'
  when coalesce(source_confidence, 0) >= 68
    and coalesce(source_count, 1) >= 2
    and (
      (case when signal_source = 'google_trends' then 1 else 0 end) +
      (case when reddit_source = 'reddit_public_json' then 1 else 0 end) +
      (case when etsy_source = 'etsy_api' then 1 else 0 end)
    ) >= 2
    and (coalesce(google_growth_4w, 0) > 0 or coalesce(acceleration_score, 0) > 0) then 'verified'
  when coalesce(source_count, 1) >= 2
    and (coalesce(google_growth_4w, 0) > 0 or coalesce(acceleration_score, 0) > 0)
    and not coalesce(is_demo_data, false) then 'emerging'
  else 'needs_confirmation'
end;

-- Apply hard caps to both emergence_score and opportunity_score so old rows
-- cannot rank above better sourced rows even if older UI/orders use either field.
update public.trend_signals
set emergence_score = least(
  coalesce(emergence_score, opportunity_score, 0),
  case when coalesce(is_demo_data, false) then 40 else 100 end,
  case when coalesce(source_count, 1) < 2 then 60 else 100 end,
  case
    when reddit_source is distinct from 'reddit_public_json'
      and etsy_source is distinct from 'etsy_api' then 55
    else 100
  end,
  case when data_quality = 'needs_confirmation' then 60 else 100 end,
  case
    when coalesce(source_type, 'discovered') = 'from_analysis'
      and (
        (case when signal_source = 'google_trends' then 1 else 0 end) +
        (case when reddit_source = 'reddit_public_json' then 1 else 0 end) +
        (case when etsy_source = 'etsy_api' then 1 else 0 end)
      ) < 2 then 55
    else 100
  end,
  case when coalesce(google_growth_4w, 0) <= 0 and coalesce(acceleration_score, 0) <= 0 then 50 else 100 end
);

update public.trend_signals
set opportunity_score = least(opportunity_score, coalesce(emergence_score, opportunity_score));

-- Rewrite old source copy that treated fallback estimates as facts.
update public.trend_signals
set why_trending = concat(
  case
    when coalesce(is_demo_data, false) or signal_source = 'fallback_seed'
      then 'Demo/fallback signal. Google Trends collection is unavailable, so this row uses fallback seed data. '
    when coalesce(google_growth_4w, 0) > 0 or coalesce(acceleration_score, 0) > 0
      then 'Google Trends shows positive movement for this keyword. '
    else 'Google Trends does not show clear positive movement. '
  end,
  case
    when reddit_source = 'reddit_public_json'
      then 'Reddit public data is available. '
    else 'Reddit confirmation is unavailable. '
  end,
  case
    when etsy_source = 'etsy_api'
      then 'Etsy API data is available. '
    else 'Etsy competition is estimated only because Etsy API is not configured or unavailable. '
  end,
  case
    when coalesce(source_count, 1) < 2 or data_quality = 'needs_confirmation'
      then 'Needs confirmation before acting.'
    else 'Review the evidence before acting.'
  end
)
where
  coalesce(is_demo_data, false)
  or coalesce(source_count, 1) < 2
  or data_quality = 'needs_confirmation'
  or reddit_source is distinct from 'reddit_public_json'
  or etsy_source is distinct from 'etsy_api';

commit;

-- Verification query:
-- select
--   keyword,
--   emergence_score,
--   data_quality,
--   source_count,
--   source_confidence,
--   reddit_source,
--   reddit_confidence,
--   etsy_source,
--   etsy_confidence,
--   source_type,
--   is_demo_data,
--   why_trending
-- from trend_signals
-- order by emergence_score desc
-- limit 20;
