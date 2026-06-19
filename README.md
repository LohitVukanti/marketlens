# MarketLens - Ecommerce Product Trend Intelligence

A full-stack MVP for ecommerce sellers who want to find product trends before they go mainstream.

Built with **Next.js 14 · TypeScript · Tailwind CSS · OpenAI · Supabase · Recharts**.

---

## What It Does

Enter a product keyword, target market, and customer profile to get a product opportunity report including:

- **Market Opportunity Score** (0–100) built from 5 econometric sub-factors
- Target customer profile & psychographics
- Competitor positioning table
- Pricing strategy with specific price points
- Customer pain points
- Demand trend analysis
- Differentiation strategy
- Marketing channel recommendations
- Risk assessment
- 6-step action plan
- Export as JSON, PDF, or copy to clipboard

---
---

## Screenshots

### Landing Page

![Landing Page](public/screenshots/landing.png)

### Analysis Form

![Analysis Form](public/screenshots/analyze.png)

### Dashboard

![Dashboard](public/screenshots/dashboard.png)

### Saved Reports

![Saved Reports](public/screenshots/saved-reports.png)

---

## Project Structure

```
marketlens/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-report/route.ts   ← Secure AI backend route
│   │   │   └── reports/
│   │   │       ├── route.ts               ← GET all saved reports
│   │   │       └── [id]/route.ts          ← DELETE a report
│   │   ├── analyze/page.tsx               ← New Analysis form page
│   │   ├── dashboard/page.tsx             ← Report dashboard page
│   │   ├── saved-reports/page.tsx         ← Saved reports list
│   │   ├── layout.tsx                     ← Root layout + fonts
│   │   ├── page.tsx                       ← Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── charts/OpportunityCharts.tsx   ← Recharts visualizations
│   │   ├── layout/Navbar.tsx
│   │   └── ui/
│   │       ├── index.tsx                  ← Shared UI primitives
│   │       └── ReportDashboard.tsx        ← Full dashboard component
│   ├── lib/
│   │   ├── ai-prompt.ts                   ← Prompt builder & response parser
│   │   ├── mock-data.ts                   ← Sample report for demo mode
│   │   ├── supabase.ts                    ← Supabase client instances
│   │   └── utils.ts                       ← Utilities: export, format, etc.
│   └── types/index.ts                     ← All TypeScript types
├── scripts/
│   ├── seed.ts                            ← Seed Supabase with sample data
│   └── supabase-schema.sql               ← Run in Supabase SQL editor
├── .env.example                           ← Copy to .env.local
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/your-username/marketlens.git
cd marketlens
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required for AI generation
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Required for saving reports
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Optional — set to true to skip AI calls entirely
NEXT_PUBLIC_MOCK_MODE=false
```

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Paste and run the contents of `scripts/supabase-schema.sql`
4. Copy your project URL and keys from **Settings → API**

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Seed sample data

```bash
npx ts-node --project tsconfig.json scripts/seed.ts
```

---

## Running Without API Keys (Demo Mode)

The app works **completely without any API keys** using mock mode:

- Click **"Use mock data"** on the analysis form, OR
- Set `NEXT_PUBLIC_MOCK_MODE=true` in `.env.local`, OR
- Visit `http://localhost:3000/analyze?mock=true`

This loads a fully rendered sample report for a pet loss memorial candle product opportunity.

---

## Signal Engine

MarketLens has a multi-source signal path for `/feed`:

- `trend_signals` stores the latest product opportunity signals.
- `signal_history` stores each collector snapshot.
- `collection_jobs` records collector runs and fallback reasons.
- `/feed` reads Supabase first and falls back to the original mock feed only when Supabase is not configured, the query fails, or there are no rows.
- Google Trends remains the primary search-interest signal.
- Reddit subreddit-scoped public JSON search is used for mention growth when available. If Reddit blocks requests or `REDDIT_COLLECT_ENABLED=false`, Reddit is stored as `unavailable` and does not boost scoring.
- Etsy listing data uses the official Etsy API when `ETSY_API_KEY` is present; otherwise the collector stores deterministic fallback estimates that are labeled and capped in scoring.

### Required env vars

The report generator still uses the AI env vars above. The signal collector requires:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional source enrichment
REDDIT_USER_AGENT=MarketLensBetaSignalCollector/0.3 (contact: you@example.com)
REDDIT_COLLECT_ENABLED=true
REDDIT_REQUEST_DELAY_MS=650
ETSY_API_KEY=your_etsy_api_key_here
ETSY_COLLECT_ENABLED=true
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in the browser. It is only used by server-side code and local scripts.

### Create the Supabase tables

Run the full contents of `scripts/supabase-schema.sql` in the Supabase SQL Editor. It preserves the existing `reports` table setup and adds:

- `trend_signals`
- `signal_history`
- `collection_jobs`
- `watchlist_items`

For an existing Phase 1 database, run these migrations in order:

1. `scripts/phase-2-watchlist-items.sql`
2. `scripts/phase-a-b-signal-enrichment.sql`
3. `scripts/phase-3-monetization-foundation.sql`

The signal enrichment migration adds:

- Reddit fields: `reddit_mentions_last_7_days`, `reddit_mentions_previous_7_days`, `reddit_growth_rate`, `reddit_source`, `reddit_confidence`
- Etsy fields: `etsy_listing_count`, `etsy_competition_level`, `etsy_avg_price`, `etsy_source`, `etsy_confidence`
- scoring fields: `source_count`, `source_confidence`, `score_explanation`, `why_trending`

### Multi-source scoring

`npm run signals:update` now builds an explainable `emergence_score` from:

- 30% Google Trends acceleration
- 20% Google Trends 4-week growth
- 15% Reddit mention growth, only when real Reddit public JSON data is available
- 20% Etsy saturation inverse, only when Etsy API data is available
- 15% source agreement/confidence

Strict caps keep weak signals honest:

- demo or Google fallback signals max at 40
- one-source signals max at 60
- signals with both Reddit and Etsy unavailable/fallback max at 55
- `needs_confirmation` signals max around 60
- flat or negative Google growth cannot be labeled `emerging`

The collector also writes `why_trending`, for example: Google Trends movement, whether Reddit data is available, whether Etsy is API-backed or an estimate, and when the signal needs confirmation. `/feed` shows Google, Reddit, Etsy, and confidence details on each card.

### Source reliability and fallbacks

Real sources:

- Google Trends through local Python `pytrends`, when available.
- Reddit public JSON from ecommerce/product-relevant subreddits, when reachable and not rate-limited.
- Etsy official API, only when `ETSY_API_KEY` is configured.

Fallback sources:

- Google fallback seed data when `pytrends`, Python, network, or Google Trends fails.
- Reddit is stored as `unavailable` when disabled, blocked, rate-limited, or unavailable.
- Etsy deterministic competition estimates when `ETSY_API_KEY` is missing or the API fails. These estimates are labeled `fallback_estimate` and receive low confidence.

Fallbacks never block the collector. Failures are recorded in `collection_jobs.error_message`, and the update finishes as `completed_with_warnings`.

### Etsy API setup

To collect real Etsy listing data:

1. Create or log into an Etsy developer account at `https://www.etsy.com/developers`.
2. Create an app for MarketLens and copy the app keystring.
3. Set `ETSY_API_KEY` to that keystring.
4. Keep `ETSY_COLLECT_ENABLED=true`.
5. Run `npm run signals:update`.

Without `ETSY_API_KEY`, MarketLens still runs but Etsy values are clearly labeled as estimates and cannot produce verified signals on their own.

### Phase 2 Watchlists and Alert Thresholds

`watchlist_items` stores persistent anonymous watchlists for the retention MVP:

- `session_id` is generated in the browser and saved to `localStorage` under `marketlens_session_id`.
- The app sends that `session_id` with watchlist reads/writes and filters Supabase queries by it.
- No login is required yet. This is suitable for the public MVP, but it is not an auth boundary.
- RLS is enabled with public MVP policies that allow anon reads/writes when a non-empty `session_id` is present. Replace these with `auth.uid()` policies when full auth ships.

Watchlist SQL is included in `scripts/supabase-schema.sql` for fresh projects and `scripts/phase-2-watchlist-items.sql` for existing Phase 1 projects. If your Supabase project already has the Phase 1 tables, run:

```sql
create table if not exists public.watchlist_items (
  id                uuid primary key default gen_random_uuid(),
  session_id        text not null check (length(trim(session_id)) > 0),
  signal_id         text not null references public.trend_signals(id) on delete cascade,
  alert_threshold   integer not null default 80 check (alert_threshold between 0 and 100),
  created_at        timestamptz not null default now(),
  last_alerted_at   timestamptz,
  unique (session_id, signal_id)
);

create index if not exists watchlist_items_session_created_idx
  on public.watchlist_items (session_id, created_at desc);

create index if not exists watchlist_items_signal_idx
  on public.watchlist_items (signal_id);

create index if not exists watchlist_items_threshold_idx
  on public.watchlist_items (alert_threshold);

alter table public.watchlist_items enable row level security;

create policy "Public read watchlist items by session id"
  on public.watchlist_items for select
  using (true);

create policy "Public insert watchlist items with session id"
  on public.watchlist_items for insert
  with check (length(trim(session_id)) > 0);

create policy "Public update watchlist items with session id"
  on public.watchlist_items for update
  using (length(trim(session_id)) > 0)
  with check (length(trim(session_id)) > 0);

create policy "Public delete watchlist items with session id"
  on public.watchlist_items for delete
  using (length(trim(session_id)) > 0);
```

Manual watchlist test:

1. Run the SQL schema and confirm `trend_signals` has rows.
2. Start the app with `npm run dev`.
3. Open `/feed` and click `Add to Watchlist` on a signal.
4. Confirm the button changes to `Watching`.
5. Open `/watchlist` and confirm the same signal appears from Supabase.
6. Change the alert threshold below the signal score and confirm `Threshold triggered` appears.
7. Raise the threshold above the signal score and confirm only non-threshold badges remain.
8. Open `/briefing`; it should say `Watchlist` when watched items exist.
9. Remove all watched items and reload `/briefing`; it should use the global feed or mock fallback.

### Phase 3 Auth and Monetization Foundation

Phase 3 adds Supabase email/password auth and a simple plan model without requiring payment:

- Guests keep anonymous watchlists through `localStorage` session IDs.
- Logged-in users get a `profiles` row with `plan = free` by default.
- When a user logs in, the browser migrates anonymous watchlist rows from the current `session_id` into that user's `user_id`.
- `/watchlist` and `/briefing` load by `user_id` for logged-in users, otherwise by anonymous `session_id`.
- Free users and guests can watch up to 3 trend signals.
- Pro users have unlimited watchlist capacity. Pro can be enabled manually by updating `profiles.plan = 'pro'`.
- `/upgrade` defines the $19/month Pro offer, but Stripe checkout is intentionally disabled.

Run `scripts/phase-3-monetization-foundation.sql` to add:

- `profiles`: `user_id`, `plan`, alert preference placeholders, `created_at`
- `alert_preferences`: future daily briefing and email alert preferences
- `watchlist_items.user_id`
- user-owned and guest-compatible RLS policies

Auth uses the existing public Supabase browser client. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

Manual auth/plan test:

1. Run the Phase 3 SQL migration.
2. In Supabase Auth settings, ensure email/password auth is enabled.
3. Start the app with `npm run dev`.
4. As a guest, add up to 3 items from `/feed`.
5. Open `/login`, create an account or log in.
6. Confirm `/watchlist` still shows the previously anonymous watched items.
7. Try to add a fourth watched signal as a Free user and confirm the limit message.
8. In Supabase SQL, set your profile to Pro:

```sql
update public.profiles
set plan = 'pro'
where user_id = auth.uid();
```

For manual SQL outside an authenticated SQL context, use the user's UUID from Auth:

```sql
update public.profiles
set plan = 'pro'
where user_id = '00000000-0000-0000-0000-000000000000';
```

9. Reload the app and confirm the sidebar shows Pro and watchlist additions are unlimited.
10. Open `/upgrade` and confirm the Stripe upgrade offer is visible.

### Final Monetization: Stripe and Resend

The final monetization layer turns `/upgrade` into a real Stripe flow and adds server-side email jobs:

- `/api/stripe/checkout` creates a Stripe Checkout subscription session for the logged-in user.
- `/api/stripe/webhook` verifies Stripe signatures and updates `profiles.plan`.
- `/api/stripe/portal` opens the Stripe Billing Portal for existing Stripe customers.
- `/api/jobs/daily-briefing` sends daily briefing emails through Resend.
- `/api/jobs/alert-emails` sends Pro alert emails for breakout or threshold-triggered watchlist items.

Run the final SQL migration after Phase 3:

```bash
scripts/final-monetization-stripe-resend.sql
```

Required production env vars:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=MarketLens <briefings@your-domain.com>

# Cron protection
CRON_SECRET=generate-a-long-random-secret
```

Existing Supabase env vars are still required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Stripe setup:

1. Create a Stripe product named `MarketLens Pro`.
2. Add a recurring monthly price for `$19`.
3. Copy the price id into `STRIPE_PRO_PRICE_ID`.
4. Add a webhook endpoint:
   `https://your-domain.com/api/stripe/webhook`
5. Subscribe the webhook to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
7. Enable the Stripe Billing Portal in the Stripe Dashboard.

Resend setup:

1. Verify a sending domain in Resend.
2. Create an API key and set `RESEND_API_KEY`.
3. Set `RESEND_FROM_EMAIL` to a verified sender.
4. Keep `email_alerts_enabled` off until you are ready to send real alert emails.

Production cron options:

Vercel Cron can call:

```txt
GET /api/jobs/daily-briefing
GET /api/jobs/alert-emails
```

Set an `Authorization: Bearer $CRON_SECRET` header if your scheduler supports custom headers. If it does not, call the same endpoints from GitHub Actions with curl:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/jobs/daily-briefing
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/jobs/alert-emails
```

Recommended cadence:

- Daily briefing: once each morning.
- Alert emails: every 1-4 hours after `npm run signals:update` or a scheduled signal refresh.

Manual monetization test:

1. Run `scripts/final-monetization-stripe-resend.sql`.
2. Set Stripe test env vars.
3. Log in to MarketLens.
4. Open `/upgrade` and click `Upgrade`.
5. Complete Stripe Checkout in test mode.
6. Confirm the webhook updates `profiles.plan` to `pro`.
7. Click `Billing Portal` from `/upgrade`.
8. Set `daily_briefing_enabled = true` for a test profile and call `/api/jobs/daily-briefing`.
9. Set `plan = 'pro'`, `email_alerts_enabled = true`, and a low watchlist threshold, then call `/api/jobs/alert-emails`.
10. Confirm guest users can still browse `/feed` and keep anonymous watchlists.

### Connected Product Flow

Deep Analysis reports now become trackable trend signals:

- `/api/generate-report` still saves the report in `reports`.
- After a report is saved, the server creates or updates a matching `trend_signals` row.
- The generated trend signal is marked `source_type = 'from_analysis'`.
- The row stores `report_id`, plus `created_by_user_id` or `created_by_session_id` when available.
- If external trend enrichment is unavailable during report creation, the server creates a safe fallback trend signal from the report score and demand narrative.
- The scheduled signal collector can continue enriching system-discovered signals without disrupting analysis-created signals.

Run this migration before using the connected flow:

```bash
scripts/connect-reports-to-trend-signals.sql
```

New trend signal columns:

- `source_type`: `discovered` or `from_analysis`
- `report_id`: nullable link back to `reports`
- `created_by_user_id`: nullable authenticated owner
- `created_by_session_id`: nullable anonymous session owner

User-facing behavior:

- Deep Analysis dashboard includes `Track this product in Trend Feed`.
- Tracking creates/updates the trend signal and adds it to the current watchlist.
- Saved Reports show `Tracked` / `Not tracked`.
- Saved Reports include `Track in Feed` and `Open Trend Signal`.
- Trend Feed shows `Discovered` or `From Analysis` badges.
- Trend Feed can filter by `All`, `Discovered`, and `My Analyses`.
- Daily Briefing uses watched signals first, recently analyzed/tracked products second, and top discovered signals third.

Manual connected-flow test:

1. Run `scripts/connect-reports-to-trend-signals.sql`.
2. Run a Deep Analysis.
3. Confirm a `trend_signals` row exists with `source_type = 'from_analysis'` and `report_id` set.
4. On the report dashboard, click `Track this product in Trend Feed`.
5. Confirm it appears in `/watchlist`.
6. Open `/feed?signal=<signal_id>` or use the `My Analyses` filter.
7. Open `/saved-reports` and confirm the report shows `Tracked`.
8. Open `/briefing` and confirm watched/analyzed signals appear before discovered signals.

Email reality:

- In-app Daily Briefing works without Resend.
- Email jobs exist but only send when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.
- Users must also have email preferences enabled in Supabase.
- The in-app UI says email delivery is available after Resend setup; it does not claim emails are active by default.

### Run or seed signals

```bash
npm run signals:update
```

This command tries to collect US Google Trends data through local Python `pytrends`. If `pytrends`, Python, network access, or Google Trends fails, the script upserts deterministic fallback seed signals so the platform remains demo-safe.
It also enriches each keyword with Reddit mention growth and Etsy competition data when those sources are available.

Optional local Google Trends dependency:

```bash
python3 -m pip install pytrends
```

`npm run seed:signals` is an alias for the same safe collector.

### Verify `/feed` is using real data

1. Run the SQL schema in Supabase.
2. Confirm `.env.local` has the three Supabase variables above.
3. For Etsy real data, set `ETSY_API_KEY`; otherwise Etsy uses fallback estimates.
4. Optionally set `REDDIT_USER_AGENT` to a descriptive collector name.
5. Run `npm run signals:update`.
6. Start the app with `npm run dev`.
7. Open `/feed` and look for the source label in the filter bar:
   - `Supabase live` means rows came from `trend_signals`.
   - `Mock fallback` means Supabase returned no usable signal rows.
8. Inspect any trend card for Google velocity, Reddit mentions/growth, Etsy listing count, confidence, and `why_trending`.

### Deploy on Vercel safely

No scheduled jobs are required for Phase 1. Add the same Supabase env vars in Vercel and deploy normally. The app will read `trend_signals` at request time. Run `npm run signals:update` locally whenever you want to refresh signals, or later move that command into a scheduled job in Phase 2.

Do not run the Python collector inside the Next.js request path; it belongs in `/scripts` so Vercel builds and page requests stay stable.

---

## Deployment (Vercel — Recommended)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial MarketLens MVP"
git remote add origin https://github.com/your-username/marketlens.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`.

### 3. Update Supabase CORS

In your Supabase dashboard → **Settings → API → CORS Allowed Origins**, add your Vercel URL:

```
https://marketlens-blvjl37ul-lohitvukanti1.vercel.app/
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (for AI) | OpenAI API key for Deep Analysis |
| `OPENAI_MODEL` | No | OpenAI model for report generation, defaults to `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | No | Legacy/unused after OpenAI migration |
| `NEXT_PUBLIC_MOCK_MODE` | No | `true` to skip AI calls |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for DB) | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for DB) | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for DB writes) | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | No | App URL (for OG tags) |

---

## Scoring Methodology

The **Market Opportunity Score (0–100)** is a composite index of 5 equally-weighted factors, each scored 0–20:

| Factor | Description |
|---|---|
| **Demand Strength** | Estimated market size, search trend trajectory, and purchase frequency signals |
| **Competition (inverted)** | Higher score = less entrenched competition. Assessed by number of competitors, their resource levels, and market saturation |
| **Pricing Power** | Ability to command premium pricing based on product differentiation, customer willingness to pay, and perceived value |
| **Pain Severity** | How acute and underserved the target customer's problems are — a proxy for organic demand pull |
| **Differentiation Potential** | How many viable differentiation vectors exist (positioning, personalization, bundling, design, channel focus, etc.) |

This approach mirrors index construction methods from applied econometrics (weighted factor models), making it explainable and auditable rather than a black-box AI score.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, DM Sans + DM Serif Display |
| Charts | Recharts |
| AI | OpenAI (`gpt-4o-mini` default) via secure API route |
| Database | Supabase (PostgreSQL + JSONB) |
| PDF Export | jsPDF |
| Deployment | Vercel |

---

## Monetization Roadmap (Post-MVP)

- **Freemium**: 3 free reports/month, unlimited on Pro ($19/mo)
- **API access**: Programmatic report generation for agencies and tools
- **White-label**: Branded reports for business consultants
- **Industry verticals**: Pre-built report templates for Etsy, Shopify, POD, digital products, and handmade sellers
- **AI follow-up chat**: Ask follow-up questions on your report

---

## Contributing

PRs welcome! Please open an issue first to discuss major changes.

---

## License

MIT © MarketLens
