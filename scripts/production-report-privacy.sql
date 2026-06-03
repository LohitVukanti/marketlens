-- ============================================================
-- Production report privacy migration.
-- Adds ownership to reports and removes old public MVP access.
-- Legacy reports with no user_id/session_id remain in the table but are
-- hidden from normal app users.
-- ============================================================

alter table public.reports
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists session_id text;

create index if not exists reports_user_created_idx
  on public.reports (user_id, created_at desc);

create index if not exists reports_session_created_idx
  on public.reports (session_id, created_at desc)
  where user_id is null;

alter table public.reports enable row level security;

drop policy if exists "Public read access" on public.reports;
drop policy if exists "Public insert access" on public.reports;
drop policy if exists "Public delete access" on public.reports;
drop policy if exists "Users read own reports" on public.reports;
drop policy if exists "Users insert own reports" on public.reports;
drop policy if exists "Users update own reports" on public.reports;
drop policy if exists "Users delete own reports" on public.reports;

create policy "Users read own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users update own reports"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- Guest report access is intentionally handled only by server API routes
-- using the service role key plus the browser's anonymous session_id.
-- Do not add public session_id read policies for reports.
