# MarketLens v2 — Product Strategy & Transformation Document

## DIAGNOSIS: Current State

### Strengths
- Clean Next.js/TypeScript/Tailwind foundation — correct tech choices
- Secure API route pattern (keys never hit browser) — production-ready
- Good component decomposition (ReportDashboard, charts, UI primitives)
- Supabase integration is correct and scalable
- Mock mode is a smart DX decision

### Weaknesses (Critical)
1. **Single-use product**: Generate a report, read it, leave. Zero reason to return tomorrow.
2. **No persistence identity**: No user auth = no personalization, no history, no stickiness
3. **Static output**: Reports don't update. A candle market report from 6 months ago is useless.
4. **No data infrastructure**: Pure LLM hallucination — no real market signals, no live data
5. **Weak monetization surface**: Nothing to gate behind a paywall that users would pay for
6. **No distribution engine**: No shareable outputs, no SEO surface, no virality
7. **Form-first UX**: Feels like a tool, not a platform. No ambient value.
8. **No differentiation**: 50 competitors do "AI market reports." Commoditized instantly.

### What Users Actually Want (That You're Not Building)
- "Tell me what's trending RIGHT NOW before everyone else knows"
- "Alert me when something in my space moves"  
- "I want to check something daily without doing new work"
- "Show me data I can't get anywhere else assembled this way"

---

## STRATEGIC PIVOT: From "Report Generator" → "Market Intelligence Feed"

### The New Core Thesis
MarketLens becomes the **Robinhood/Bloomberg hybrid for small business and ecommerce operators** — a live intelligence dashboard they check every morning, not a form they fill out once.

### Why This Works for Monetization
- **Habit loop**: Daily briefing → users open app every morning → high retention → low churn
- **Subscription justification**: "It told me X was trending and I made $4K on it" is worth $29/mo
- **Data density**: More data shown = more perceived value = easier to justify payment
- **FOMO mechanic**: "17 people are watching this trend" creates urgency

---

## NICHE RECOMMENDATION: Ecommerce/Product Trend Intelligence

### Why Ecommerce Wins
1. **Buyers have money and urgency**: Etsy/Amazon/Shopify sellers lose real money from bad timing
2. **Natural recurring use**: Trends change weekly — they MUST come back
3. **Willingness to pay**: Sellers earning $5K/mo will pay $49/mo for an edge
4. **Distribution fit**: Huge Reddit communities (r/Etsy, r/AmazonFBA, r/dropship), YouTube tutorials, TikTok seller community
5. **Underserved**: Existing tools (Jungle Scout, Semrush) are expensive and complex. A focused, beautiful, affordable alternative wins.
6. **Viral content**: "This tool told me feather lamps were trending 6 weeks before they blew up" = viral tweet
7. **SEO surface**: "Etsy trending products 2026", "Amazon FBA opportunity finder" = high intent, high volume

### Runner-up: Creator/Content Trend Intelligence
Similar dynamics but harder to monetize directly.

---

## THE NEW PLATFORM: 5 Core Systems

### 1. TREND FEED (Replaces "New Analysis" as entry point)
A live, scrollable feed of trending niches, products, and market signals — like Twitter but for market opportunities. Each card shows: trend name, momentum score, 7-day velocity, category, and a 1-line AI summary. Free users see 10/day, Pro sees all.

**Why it drives retention**: Opens like a news feed. Something new every time. FOMO built in.

### 2. INTELLIGENCE REPORTS (Evolved from current core)
Kept but repositioned: not a one-off form, but a deep-dive attached to a watchlist item. When you add a niche to your watchlist, you can generate a full report. Reports refresh weekly with new data.

**Why it drives retention**: Watchlist items create a reason to return — "how is my niche doing this week?"

### 3. WATCHLIST + ALERTS  
Users add niches/markets to a personal watchlist. The system monitors those niches and sends alerts when:
- Momentum score changes significantly (+/- 15 pts)
- A new competitor enters the space
- A pricing shift is detected
- The AI detects a breaking opportunity

**Why it drives monetization**: Alerts are the #1 feature users will pay for. "Don't miss a move."

### 4. DAILY BRIEFING (The habit loop engine)
A personalized, AI-generated morning briefing (email or in-app) summarizing:
- Top 3 movements in your watchlist
- 5 emerging trends in your categories
- One deep-dive "Opportunity of the Day"
- A market risk flag if applicable

**Why it drives retention**: Email open rates for "your briefing is ready" are 40-60%. This is the hook.

### 5. OPPORTUNITY SCANNER (New premium feature)
A grid/list view showing niches ranked by opportunity score with filters:
- Category (home decor, apparel, food, digital, services...)
- Score threshold
- Trend velocity (rising/falling/stable)
- Competition level
- Price range viability

**Why it drives monetization**: This is the most addictive feature. Users will spend hours filtering this.

---

## MONETIZATION ARCHITECTURE

### Free Tier (Lead generation, not a real product)
- 3 intelligence reports/month
- See trend feed (10 items, delayed 48 hours)
- 1 watchlist item
- No alerts
- No daily briefing
- No export

### Pro Tier — $19/month (Target: the serious Etsy/Amazon seller)
- Unlimited reports
- Full real-time trend feed
- 10 watchlist items  
- Email alerts (instant)
- Daily AI briefing
- PDF/JSON export
- Priority AI model

### Business Tier — $49/month (Target: agencies, serious operators)
- Everything in Pro
- Unlimited watchlist
- Slack/Discord alert integration
- Shareable report links (white-label ready)
- API access (100 calls/month)
- Historical trend data (6 months)
- Competitor tracking across niches

### Revenue Math
- 100 Pro users = $1,900/mo (realistic in 6 months with good distribution)
- 20 Business users = $980/mo
- Total: ~$2,880/mo → $34K ARR as a solo developer side project
- Scale to 500 Pro + 100 Business = $14K/mo → $168K ARR

---

## DISTRIBUTION & VIRAL MECHANICS

### Content Hooks (TikTok/X/Reddit)
1. **"This niche was a 34/100 score 8 weeks ago. Today it's 91."** — Show the chart. Pure FOMO.
2. **"Top 5 rising Etsy trends this week"** — Weekly content series pulling from the feed
3. **"I used an AI to find a $200K/year niche before anyone else knew"** — Case study format
4. **Shareable opportunity cards** — Beautiful OG images with trend data users can screenshot and post

### SEO Surface (Auto-generated pages)
- `/trends/etsy-home-decor` — live trend page for each category
- `/trends/rising-today` — daily updated page
- `/opportunity/[niche-slug]` — public version of each report (gated deeper)
These pages create thousands of indexed pages driving organic traffic.

### Reddit Distribution
- r/Etsy, r/AmazonFBA, r/dropshipping, r/smallbusiness, r/Entrepreneur
- Post weekly trend roundups with genuine data — not spam, actual value
- "Built a tool that tracks this, here's what it's showing..."

### Referral System
- "Share your report, give a friend 1 free Pro week" 
- Shareable report URLs with brand watermark

---

## PHASE ROADMAP

### Phase 1 (Now — 4 weeks): Habit Loop Foundation
Priority: Build the things that make users come back tomorrow.
1. ✅ Add user auth (Supabase Auth — email magic link, dead simple)
2. ✅ Build Trend Feed page with AI-generated trend cards (even AI-simulated data is fine for v1)
3. ✅ Build Watchlist system (add/remove niches, basic tracking)
4. ✅ Redesign landing page around the new "intelligence platform" positioning
5. ✅ Add Daily Briefing page (in-app version, email later)
6. ✅ New Navbar with platform navigation structure

### Phase 2 (Month 2-3): Monetization Layer
1. Add Stripe subscriptions (use Lemon Squeezy for simplicity — no code needed)
2. Gate: alerts, full feed, watchlist beyond 1 item
3. Add Opportunity Scanner with filters
4. Add shareable report URLs
5. Add SEO-optimized public trend pages
6. Add email briefing via Resend (simple transactional email)

### Phase 3 (Month 3-6): Data & Distribution
1. Real data integrations: Google Trends API, Reddit API for social signal
2. Slack/Discord bot integration
3. Referral system
4. Public API for Business tier
5. Historical trend charts (store weekly snapshots in Supabase)

---

## UI/UX TRANSFORMATION

### Visual Direction: "Financial Terminal meets Consumer App"
- Dark sidebar navigation (like Linear, Vercel, Notion)
- Dense data display without feeling cluttered
- Real-time feeling: animated numbers, live indicators, pulse dots
- Color system: Dark bg (#0f1117) + bright accent (indigo/violet) + semantic colors (green=up, red=down, amber=caution)
- Typography: monospace for numbers/scores, clean sans for text
- Cards with subtle borders, not heavy shadows

### Key UX Patterns to Steal
- **Robinhood**: Clean score display, trend sparklines, color-coded movement
- **Linear**: Sidebar nav, keyboard shortcuts feel, density without overwhelm  
- **Product Hunt**: Feed with upvote/momentum scores, category filters
- **Bloomberg Terminal**: Data density, multiple panes, always something moving

### Addictive Daily Use Pattern
Morning: Open app → See briefing badge (new) → Read briefing → Check watchlist movements → Browse 2-3 trend cards → Close (satisfied, will return tomorrow)

This is the loop. Everything in Phase 1 serves this loop.
