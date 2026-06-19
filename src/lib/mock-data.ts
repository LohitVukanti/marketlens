// ============================================================
// src/lib/mock-data.ts
// Sample report for demo mode and development without API keys.
// This matches the full ReportData schema exactly.
// ============================================================

import type { ReportData, SavedReport } from "@/types";

export const MOCK_REPORT_DATA: ReportData = {
  marketScore: 72,
  verdict: "Needs more validation",
  dataConfidence:
    "This sample report uses demo data. No live Google Trends, Reddit, or Etsy API evidence is attached to this mock analysis. Treat the conclusions as AI reasoning and product-research prompts, not verified demand or sales data.",

  summary:
    "Pet loss memorial candles are a directional ecommerce opportunity for sellers who can combine sympathy gifting, personalization, and tasteful design. The product sits at the intersection of pet ownership, memorial keepsakes, and handmade home fragrance - a niche where buyers are often searching for something more thoughtful than a generic condolence gift.\n\nMarketplace competition exists, especially on Etsy, but many listings lean on similar paw-print artwork and generic sympathy copy. The opportunity is not simply to list another candle; it is to validate search demand, watch saturation, and differentiate through personalization, packaging, scent positioning, and emotional specificity.\n\nThis demo report uses sample data for product-analysis UX. It should be treated as a directional example, not verified sales or revenue intelligence.",

  targetCustomer:
    "Primary: Online buyers in the US purchasing a sympathy gift for a friend, family member, or coworker who recently lost a pet. They are likely browsing Etsy, Google, Pinterest, or gift guides with intent-driven phrases such as 'pet loss gift', 'dog memorial candle', or 'personalized pet sympathy gift'. They value tactful design, personalization, fast shipping, and reviews that signal the seller handles emotional orders carefully.\n\nSecondary: Pet owners buying a keepsake for themselves after loss. This buyer is more likely to care about customization, scent notes, packaging, and a product page that feels compassionate rather than gimmicky.",

  competitorPositioning:
    "The main competitors are Etsy memorial gift shops, personalized candle sellers, sympathy gift bundles, and print-on-demand keepsake products. Many compete on personalization and fast fulfillment, but the category has repeated visual language: paw prints, rainbow bridge copy, simple pet names, and similar jar labels. A seller can stand out with more premium packaging, modern design systems, better scent storytelling, clearer gift-ready positioning, and product variants for dog, cat, and multi-pet households.",

  pricingRecommendation:
    "Test a core 8oz memorial candle at $24-$38 depending on vessel, label personalization, packaging, and shipping economics. Offer a lower-priced digital sympathy card or small add-on only if it improves bundle conversion without cheapening the gift. Keep personalization simple enough to fulfill reliably: pet name, short date range, and one optional message. Avoid competing purely on the lowest price; buyers in this category often pay for tact, care, and gift presentation.",

  customerPainPoints: [
    "Sympathy gift buyers do not want a product that feels generic, loud, or emotionally clumsy",
    "Personalized memorial products can feel repetitive because many listings use the same paw-print and rainbow-bridge visual language",
    "Gift buyers need confidence that the item will ship quickly and arrive packaged appropriately",
    "Pet owners may want something subtle enough to keep at home, not a novelty item",
    "Buyers are unsure which scent, message, or design will feel respectful for the recipient",
    "Sellers need to avoid over-saturated keywords while still matching high-intent search behavior",
  ],

  demandTrend:
    "Directional demand is supported by durable pet ownership, continued interest in personalized gifts, and search behavior around pet memorial products. This demo does not include verified live Google Trends or Etsy API results. A real production decision should confirm 4-week and 8-week search acceleration, listing count, review velocity, and whether current search pages are dominated by established sellers.",

  differentiationStrategy:
    "Differentiate around taste, trust, and fulfillment clarity. Build a restrained design system with modern typography and soft colorways, then create variants for dog memorial, cat memorial, pet parent sympathy, and gift-ready bundles. Add clear personalization previews, short compassionate copy, scent guidance, and packaging photos. For Etsy SEO, target specific long-tail phrases rather than only broad 'pet memorial gift' terms.",

  marketingChannels: [
    "Etsy SEO - build listings around long-tail phrases like 'personalized pet loss candle', 'dog memorial gift', and 'cat sympathy gift'",
    "Pinterest - create gift guide pins for pet sympathy gifts, memorial keepsakes, and thoughtful condolence gifts",
    "Google Shopping or search ads - test small budgets against high-intent memorial gift keywords",
    "TikTok and Instagram Reels - show packing, label personalization, and tasteful product detail shots without exploiting grief",
    "Email capture - collect interest from gift-guide traffic and follow up with related memorial keepsakes",
    "Shopify product page SEO - publish collection pages for pet memorial gifts and personalized sympathy candles",
  ],

  risks: [
    "Marketplace saturation could be higher than it appears if broad memorial keywords are dominated by sellers with deep review history",
    "Emotional products require careful copy; overly promotional language can reduce trust",
    "Personalization increases fulfillment complexity and error risk",
    "Candles add shipping and breakage considerations that digital or POD products do not have",
    "Demand may be steady rather than accelerating; verify trend movement before scaling inventory",
    "Etsy dependency can limit control over acquisition costs and customer relationships",
  ],

  manualValidationChecklist: [
    "Check Etsy manually for current listing count, review depth, bestseller badges, and repeated design patterns.",
    "Check Google Trends for the exact phrase and close variants over 4-week and 12-month windows.",
    "Search Reddit, TikTok, and Pinterest for recent buyer language around pet memorial gifts.",
    "Record top 20 marketplace prices and fulfillment promises before setting your own price.",
    "Test 3 listing thumbnails or product mockups before producing inventory.",
    "Confirm shipping cost, breakage risk, and personalization workflow before scaling.",
  ],

  actionPlan: [
    "Week 1-2: Validate the search page manually across Etsy, Google, and Pinterest; record listing counts, top seller review depth, price ranges, and repeated design patterns.",
    "Week 2-3: Build 3 visual directions and 2 personalization formats; test them with a small audience before creating inventory.",
    "Week 3-4: Launch a narrow Etsy test with 4-6 listings targeting specific long-tail keywords and measure favorites, clicks, and conversion signals.",
    "Month 1: Add packaging photos, personalization examples, and delivery timing to reduce buyer uncertainty.",
    "Month 2: Expand only the variants that show engagement; avoid adding broad memorial products without search evidence.",
    "Month 3+: Move proven listings into a Shopify collection and build owned email capture around memorial gift guides.",
  ],

  competitorTable: [
    {
      name: "Etsy personalized memorial candle shops",
      positioning: "Handmade and semi-custom sympathy candles built around pet names, dates, and memorial copy",
      estimatedPriceRange: "$18-$45",
      strength: "Strong fit with high-intent Etsy searches and gift-ready buying behavior",
      weakness: "Visual differentiation is often weak because many listings use similar paw-print motifs",
    },
    {
      name: "Personalized sympathy gift bundles",
      positioning: "Gift boxes pairing candles with cards, frames, ornaments, or keepsakes",
      estimatedPriceRange: "$28-$85",
      strength: "Higher perceived gift value and easier gifting experience",
      weakness: "More complex fulfillment and higher price sensitivity",
    },
    {
      name: "Print-on-demand memorial keepsakes",
      positioning: "Mugs, ornaments, frames, and blankets customized with pet names or photos",
      estimatedPriceRange: "$12-$60",
      strength: "Broad product variety and lower operational complexity for sellers",
      weakness: "Can feel less premium or less intimate than a carefully packaged handmade product",
    },
    {
      name: "Amazon sympathy candles",
      positioning: "Fast-shipping generic sympathy candles and memorial gifts",
      estimatedPriceRange: "$14-$35",
      strength: "Convenience, reviews, and Prime shipping",
      weakness: "Limited personalization and weaker emotional brand experience",
    },
    {
      name: "Digital sympathy card templates",
      positioning: "Low-priced downloadable cards and printable memorial templates",
      estimatedPriceRange: "$3-$15",
      strength: "Instant delivery and low price",
      weakness: "Lower perceived gift weight and no physical keepsake unless paired with another item",
    },
  ],

  chartData: {
    opportunityFactors: [
      {
        label: "Demand Strength",
        value: 15,
        description: "Directional demand exists around pet memorial gifts, but live trend acceleration should be verified before scaling.",
      },
      {
        label: "Competition (inverted)",
        value: 13,
        description: "Competition is present, but there is room for more tasteful design and sharper long-tail positioning.",
      },
      {
        label: "Pricing Power",
        value: 14,
        description: "Personalized sympathy gifts can support premium pricing when packaging and trust signals are strong.",
      },
      {
        label: "Pain Severity",
        value: 16,
        description: "Gift buyers need a respectful, thoughtful option for a sensitive moment.",
      },
      {
        label: "Differentiation Potential",
        value: 14,
        description: "Design, personalization, packaging, and keyword focus create practical ways to stand apart.",
      },
    ],
  },
};

/** A fully hydrated SavedReport object using mock data */
export const MOCK_SAVED_REPORT: SavedReport = {
  id: "mock-report-001",
  created_at: new Date().toISOString(),
  niche: "Pet Loss Memorial Candle",
  location: "Online US buyers",
  target_customer: "Pet owners and sympathy gift buyers",
  product_type: "Handmade physical product",
  price_range: "$18-$45 per candle",
  competitors_input: "Etsy memorial candle shops, Amazon sympathy candles, POD keepsakes",
  report_data: MOCK_REPORT_DATA,
  is_mock: true,
};
