-- ============================================================
-- Fix profile creation RLS for server-side service-role flow.
-- Run this after Phase 3 migrations.
-- ============================================================

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Profile creation and plan updates are intentionally server-side only:
-- - /api/profile/ensure creates missing free profiles with the service role key.
-- - Stripe webhook routes update plan/subscription fields with the service role key.
-- The service role bypasses RLS, so no public insert/update policy is needed.
