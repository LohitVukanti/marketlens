-- ============================================================
-- Final monetization migration: Stripe + email job metadata
-- Run this after scripts/phase-3-monetization-foundation.sql.
-- ============================================================

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists plan_current_period_end timestamptz;

create unique index if not exists profiles_stripe_customer_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_stripe_subscription_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists profiles_plan_idx
  on public.profiles (plan);

alter table public.alert_preferences
  add column if not exists daily_briefing_last_sent_at timestamptz,
  add column if not exists alert_email_last_sent_at timestamptz;
