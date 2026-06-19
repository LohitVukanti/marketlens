-- ============================================================
-- Public beta feedback table
-- Standalone migration for in-app beta feedback collection.
-- ============================================================

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  session_id text null,
  email text null,
  feedback_type text not null
    check (feedback_type in ('bug', 'data_issue', 'confusing_ux', 'feature_request', 'would_pay', 'would_not_pay', 'other')),
  message text not null,
  page_url text null,
  user_agent text null,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'planned', 'closed', 'spam')),
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

drop policy if exists "Anyone can submit beta feedback" on public.beta_feedback;
create policy "Anyone can submit beta feedback"
  on public.beta_feedback for insert
  to anon, authenticated
  with check (
    length(trim(message)) between 5 and 4000
    and (email is null or length(email) <= 254)
    and (page_url is null or length(page_url) <= 1000)
    and (session_id is null or length(session_id) <= 200)
  );

drop policy if exists "Service role manages beta feedback" on public.beta_feedback;
create policy "Service role manages beta feedback"
  on public.beta_feedback for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists beta_feedback_created_at_idx
  on public.beta_feedback (created_at desc);

create index if not exists beta_feedback_status_idx
  on public.beta_feedback (status, created_at desc);

create index if not exists beta_feedback_type_idx
  on public.beta_feedback (feedback_type, created_at desc);
