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
