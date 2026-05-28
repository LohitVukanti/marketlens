// ============================================================
// src/lib/mock-data.ts
// Sample report for demo mode and development without API keys.
// This matches the full ReportData schema exactly.
// ============================================================

import type { ReportData, SavedReport } from "@/types";

export const MOCK_REPORT_DATA: ReportData = {
  marketScore: 74,

  summary:
    "The handmade soy candle market in Tampa, FL presents a strong opportunity for a well-positioned artisan brand. Consumer demand for natural, non-toxic home fragrance products has grown consistently since 2020, driven by wellness trends, 'nesting' behaviors, and rising distrust of synthetic ingredients in mass-market products. The Tampa Bay metro area's expanding millennial homeowner demographic represents an ideal primary buyer cohort.\n\nWhile national incumbents (Yankee Candle, Bath & Body Works) dominate shelf space, they are systematically weak on authenticity, local identity, and customization — the exact levers where an artisan brand can win. The Etsy marketplace shows fragmented competition locally, with no dominant Tampa-based candle brand occupying the top results. This is the white-space opportunity.\n\nA brand built around hyperlocal scent narratives ('Gulf Coast Morning', 'Ybor City Espresso'), premium soy-beeswax blends, and a subscription model can realistically capture $80K–$180K in Year 1 revenue with modest Etsy + farmers market + corporate gifting distribution. Margin structure is favorable at 68–74% gross margin on direct sales.",

  targetCustomer:
    "Primary: Millennial women aged 25–38, Tampa Bay metro, household income $55K–$110K. Homeowners or renters in Seminole Heights, South Tampa, Westchase, or Carrollwood. Heavily influenced by Instagram and TikTok for home décor discovery. Values small businesses, sustainability, and aesthetic intentionality. Buys candles for self-care rituals, home staging, and gifting. Average spend per order: $32–$58. High retention if brand voice resonates.\n\nSecondary: Corporate gifting coordinators at Tampa-area tech companies, law firms, and hospitality groups. Seek curated, locally-branded gift sets for employee appreciation and client onboarding. Order sizes: $300–$2,500. Seasonal concentration in Q4 and Q1.",

  competitorPositioning:
    "National players (Yankee Candle, Bath & Body Works) dominate on convenience and brand recognition but are structurally unable to offer local identity, customization, or craft narrative. They compete on volume and distribution, not authenticity. Local boutiques carry artisan candles as secondary SKUs with limited digital investment. The Etsy landscape in Tampa is fragmented — the top sellers are in other cities, creating an SEO and identity gap a local brand can fill with targeted optimization.",

  pricingRecommendation:
    "Position at $26–$48 for standard 8oz candles — premium of 40–60% above mass market, justified by soy-beeswax blend and craft story. Offer a 4oz sampler at $14–$16 to lower the acquisition threshold. Bundle 3-pack at $65 (vs. $78 individual) signals value without discounting brand. Launch a monthly subscription box at $42/month (2 candles + exclusive scent) for recurring revenue. Corporate gift sets: $85–$180 with custom labeling. Avoid competing below $18 — it telegraphs commodity quality to your exact target buyer.",

  customerPainPoints: [
    "Synthetic fragrances and paraffin wax trigger headaches and respiratory sensitivity in health-conscious consumers who have no mass-market alternative",
    "Candles feel impersonal — buyers seeking gifts or self-care want a brand with a real story and human maker, not a corporation",
    "No prominent local Tampa candle brand exists for consumers who specifically seek to support local small businesses",
    "Poor burn quality and tunneling waste money — premium buyers want a candle that performs consistently through its full burn life",
    "Mass-market scents are trend-driven and generic — customers cannot find hyper-local, regional, or personalized scents",
    "Corporate gift-givers struggle to find curated, locally-branded gift options at premium price points without dealing with large minimum orders",
  ],

  demandTrend:
    "Upward trajectory. The US scented candle market grew from $3.4B in 2020 to an estimated $5.2B by 2026 (CAGR ~7.3%). Google Trends data for 'soy candles' and 'handmade candles' shows consistent YoY growth with Q4 spikes of 180–240% above baseline (November–December gift season). Etsy reported a 38% increase in candle-category searches from 2021 to 2023. Post-pandemic 'home nesting' behaviors have held above pre-2020 baseline. Florida specifically over-indexes on home fragrance relative to national averages due to climate (no fireplace culture → candles fill the ambiance gap year-round).",

  differentiationStrategy:
    "Lead with a 'Made in Tampa' identity — develop 5–8 signature scents tied to specific Tampa landmarks and experiences (Ybor City, Bayshore, Cigar City, Gulf sunsets). This emotional specificity is impossible for national brands to replicate. Invest in short-form video content showing the pour process — TikTok and Reels content of candle-making converts at 3–5x the rate of static posts. Launch a 'Candle of the Month Club' subscription in Month 3 to build predictable revenue. Develop a corporate gifting vertical targeting Tampa's tech, legal, and hospitality sectors for high-AOV B2B orders. Offer custom label printing for weddings and corporate events as a premium upsell.",

  marketingChannels: [
    "TikTok & Instagram Reels — pour process videos, scent reveal content, behind-the-scenes; organic reach is exceptional in this category",
    "Etsy SEO — optimize listings for 'Tampa candles', 'Florida soy candles', 'custom soy candle gift'; long-tail search is high-intent",
    "Tampa farmers markets & pop-ups — Armature Works, Hyde Park Village, Ybor City Saturday Market for direct customer acquisition",
    "Pinterest — home décor boards and gift guide pins drive significant long-tail traffic to Etsy and Shopify",
    "Email list — capture via 15% discount popup; nurture with scent education and new drop announcements",
    "Local press & micro-influencers — Tampa Bay Business Journal, Voyage Tampa, local lifestyle bloggers with 5K–50K followers",
    "Corporate gifting outreach — direct LinkedIn and email prospecting to office managers at top 200 Tampa employers",
  ],

  risks: [
    "Raw material cost volatility: soy wax and fragrance oils fluctuated 20–35% in 2022–2023; lock in supplier relationships early and consider price escalation clauses",
    "Etsy algorithm dependency: a single algorithm change or fee increase can sharply reduce organic discovery — build owned channels (email, Shopify) from day one",
    "Low barriers to entry: a competitor with more capital can copy the brand concept quickly — invest in brand identity and customer relationships as moats",
    "Seasonal revenue concentration: Q4 may represent 40–55% of annual sales; manage cash flow and inventory accordingly",
    "Production scaling bottleneck: handmade production is difficult to scale past ~300 units/month without hiring; plan staffing threshold before demand arrives",
    "Shipping damage and fragrance fade in warm Florida climate can generate returns and negative reviews if packaging is not engineered for heat",
  ],

  actionPlan: [
    "Week 1–2: Register LLC, open business bank account, purchase initial supplies (NatureWax C-3, CandleScience fragrance oils, 8oz vessels). Budget: ~$800.",
    "Week 2–3: Develop 5 signature scents, conduct burn tests, photograph final products professionally on clean white and lifestyle backgrounds.",
    "Week 3–4: Open Etsy shop with 8–12 optimized listings. Set up Shopify store as owned channel. Write 'About' story centered on Tampa identity.",
    "Month 1: Post 3x/week on TikTok and Instagram (pour videos, scent reveals, packaging ASMR). Apply to 2 Tampa farmers markets for Month 2.",
    "Month 2: Launch email list with 15% first-order discount. Begin corporate gifting outreach to 20 local businesses. Target first $5K revenue month.",
    "Month 3+: Introduce subscription box ('Tampa Candle Club'). Hire part-time production assistant. Evaluate wholesale to 3–5 local boutiques.",
  ],

  competitorTable: [
    {
      name: "Yankee Candle",
      positioning: "Heritage mass-market brand, widest retail distribution",
      estimatedPriceRange: "$14–$32",
      strength: "Massive brand recognition, retail footprint in every mall",
      weakness: "Paraffin-based, no local identity, impersonal, trend-lagging",
    },
    {
      name: "Bath & Body Works",
      positioning: "Trend-driven, high-velocity seasonal drops",
      estimatedPriceRange: "$9–$27",
      strength: "Marketing machine, loyalty program, frequent new launches",
      weakness: "Synthetic fragrance, no craft story, feels disposable",
    },
    {
      name: "Local Etsy Sellers (Tampa area)",
      positioning: "Artisan, small-batch, variable quality",
      estimatedPriceRange: "$14–$55",
      strength: "Authenticity, niche scents, personal connection",
      weakness: "Inconsistent branding, low SEO investment, no local identity anchor",
    },
    {
      name: "Tampa Boutique Resellers",
      positioning: "Curated gift retail, aesthetic-driven curation",
      estimatedPriceRange: "$28–$65",
      strength: "Local credibility, foot traffic, gift occasion capture",
      weakness: "Limited online reach, low inventory turns, no direct-to-consumer",
    },
    {
      name: "DW Home / Target Private Label",
      positioning: "Affordable aesthetic, mass retail accessible",
      estimatedPriceRange: "$8–$22",
      strength: "Price point, availability, design-forward packaging",
      weakness: "No craft story, paraffin-based, undifferentiated from private label",
    },
  ],

  chartData: {
    opportunityFactors: [
      {
        label: "Demand Strength",
        value: 16,
        description: "Strong and growing consumer demand for natural home fragrance, validated by market size data and search trend growth.",
      },
      {
        label: "Competition (inverted)",
        value: 12,
        description: "National competition is intense, but the artisan-local niche has meaningful white space with no dominant Tampa brand.",
      },
      {
        label: "Pricing Power",
        value: 15,
        description: "High perceived value of craft and natural ingredients supports premium pricing 40–60% above mass market.",
      },
      {
        label: "Pain Severity",
        value: 17,
        description: "Health concerns around synthetic candles and demand for local identity create genuine, unmet pain points.",
      },
      {
        label: "Differentiation Potential",
        value: 14,
        description: "Hyperlocal scent narrative, subscription model, and corporate gifting provide multiple defensible differentiation vectors.",
      },
    ],
  },
};

/** A fully hydrated SavedReport object using mock data */
export const MOCK_SAVED_REPORT: SavedReport = {
  id: "mock-report-001",
  created_at: new Date().toISOString(),
  niche: "Handmade Soy Candles",
  location: "Tampa, FL",
  target_customer: "Millennial women 25–38, home décor and wellness focused",
  product_type: "E-commerce / Etsy / Shopify",
  price_range: "$26–$48 per candle",
  competitors_input: "Yankee Candle, Bath & Body Works, local boutiques",
  report_data: MOCK_REPORT_DATA,
  is_mock: true,
};
