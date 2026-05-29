// ============================================================
// src/lib/trend-data.ts
// Mock trend signal data + AI generation logic.
// In production: replace with real data pipeline (Google Trends,
// Reddit API, social listening, Etsy/Amazon scrapers).
// ============================================================

import type { TrendSignal, TrendCategory, DailyBriefing } from "@/types";

// Seeded random for consistent demo data
function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function genSparkline(base: number, seed: number): number[] {
  return Array.from({ length: 8 }, (_, i) => {
    const delta = (seededRand(seed + i) - 0.4) * 12;
    return Math.min(100, Math.max(10, Math.round(base - 14 + i * 2 + delta)));
  });
}

export const TREND_SIGNALS: TrendSignal[] = [
  {
    id: "t1", name: "Mushroom Lamp", niche: "Ambient Lighting / Home Decor",
    category: "home-decor", score: 91, momentum: 34, direction: "breakout",
    weeklyChange: 18, searchVolume: "High", competitionLevel: "low",
    avgPrice: "$28–$65", tags: ["cottagecore", "aesthetic", "TikTok viral"],
    platforms: ["Etsy", "TikTok Shop", "Amazon"],
    summary: "Cottagecore LED mushroom lamps exploding on TikTok. First-mover Etsy sellers reporting 400% revenue increase. Very low competition — fewer than 200 active Etsy listings in premium segment.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    sparkline: genSparkline(91, 42),
  },
  {
    id: "t2", name: "Custom Pet Portraits (Digital)", niche: "Digital Art / Pet Products",
    category: "pets", score: 83, momentum: 12, direction: "rising",
    weeklyChange: 8, searchVolume: "High", competitionLevel: "medium",
    avgPrice: "$15–$45", tags: ["pets", "personalized", "digital download"],
    platforms: ["Etsy", "Instagram"],
    summary: "Digital pet portrait commissions maintain strong seasonal demand. AI-assisted artists achieving 10x output. Upsell potential to framed prints ($45–$120) is largely untapped.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    sparkline: genSparkline(83, 17),
  },
  {
    id: "t3", name: "Handmade Mushroom & Foraging Jewelry", niche: "Nature-Inspired Jewelry",
    category: "jewelry", score: 78, momentum: 22, direction: "rising",
    weeklyChange: 11, searchVolume: "Medium", competitionLevel: "low",
    avgPrice: "$18–$85", tags: ["cottagecore", "nature", "handmade"],
    platforms: ["Etsy", "Pinterest"],
    summary: "Foraging and cottagecore aesthetic driving demand for mushroom, acorn, and botanical jewelry. Pinterest search volume up 67% YoY. Market largely served by hobbyists with low brand investment.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    sparkline: genSparkline(78, 88),
  },
  {
    id: "t4", name: "AI Notion Templates (Productivity)", niche: "Digital Products / Productivity",
    category: "digital-products", score: 76, momentum: 8, direction: "rising",
    weeklyChange: 5, searchVolume: "High", competitionLevel: "high",
    avgPrice: "$9–$37", tags: ["notion", "AI", "productivity", "templates"],
    platforms: ["Etsy", "Gumroad", "Product Hunt"],
    summary: "Notion template market maturing but AI-integrated productivity templates (with GPT prompts, automation workflows) represent an underserved segment. High competition on generic templates.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    sparkline: genSparkline(76, 55),
  },
  {
    id: "t5", name: "Linen & Organic Cotton Tote Bags (Custom)", niche: "Sustainable Apparel Accessories",
    category: "apparel", score: 72, momentum: 5, direction: "rising",
    weeklyChange: 3, searchVolume: "High", competitionLevel: "medium",
    avgPrice: "$22–$55", tags: ["sustainable", "eco", "custom", "linen"],
    platforms: ["Etsy", "Shopify", "Farmers Markets"],
    summary: "Plastic bag ban regulations in 15+ US states driving sustained demand. Premium linen/organic canvas commands 60% margin. Personalization (monogram, local art) adds significant AOV.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    sparkline: genSparkline(72, 23),
  },
  {
    id: "t6", name: "Sourdough Starter Kits", niche: "Food & Beverage / Kitchen",
    category: "food-beverage", score: 68, momentum: -4, direction: "stable",
    weeklyChange: -2, searchVolume: "Medium", competitionLevel: "medium",
    avgPrice: "$18–$42", tags: ["sourdough", "baking", "artisan", "DIY"],
    platforms: ["Etsy", "Amazon", "Local Markets"],
    summary: "Post-pandemic baking trend stabilizing but showing resilience. Starter kits with local flour and recipe cards differentiate from commodity offerings. Corporate gifting angle emerging.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    sparkline: genSparkline(68, 71),
  },
  {
    id: "t7", name: "Vintage-Style Digital Planner", niche: "Digital Products / Stationery",
    category: "digital-products", score: 65, momentum: 14, direction: "rising",
    weeklyChange: 9, searchVolume: "Medium", competitionLevel: "low",
    avgPrice: "$8–$24", tags: ["planner", "digital", "vintage", "GoodNotes"],
    platforms: ["Etsy", "Pinterest", "Instagram"],
    summary: "GoodNotes and iPad planner market growing 40% YoY. Vintage and dark academia aesthetic underrepresented vs. modern/minimal styles. Low competition on premium aesthetic segment.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    sparkline: genSparkline(65, 34),
  },
  {
    id: "t8", name: "Whittled Wood Spoons & Utensils", niche: "Handcrafted Kitchen / Home",
    category: "art-crafts", score: 62, momentum: 7, direction: "rising",
    weeklyChange: 4, searchVolume: "Low", competitionLevel: "low",
    avgPrice: "$24–$85", tags: ["woodworking", "handmade", "kitchen", "artisan"],
    platforms: ["Etsy", "Local Markets"],
    summary: "Hand-whittled kitchen utensils experiencing revival driven by 'slow living' and maker culture content. Extremely low competition in premium segment. High-margin craft with strong storytelling potential.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    sparkline: genSparkline(62, 99),
  },
  {
    id: "t9", name: "Crochet Stanley Cup Accessories", niche: "Accessories / Drinkware",
    category: "apparel", score: 88, momentum: 28, direction: "breakout",
    weeklyChange: 15, searchVolume: "High", competitionLevel: "low",
    avgPrice: "$12–$35", tags: ["Stanley", "crochet", "viral", "accessories"],
    platforms: ["Etsy", "TikTok Shop", "Instagram"],
    summary: "Stanley Cup accessories proving massive ongoing opportunity. Crochet holders, charms, and straps are trending with zero dominant seller. Fast to produce, ships light, high repeat purchase for gifting.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sparkline: genSparkline(88, 13),
  },
  {
    id: "t10", name: "AI-Generated Coloring Books (Niche Themes)", niche: "Digital / Print-on-Demand",
    category: "digital-products", score: 71, momentum: 16, direction: "rising",
    weeklyChange: 10, searchVolume: "Medium", competitionLevel: "medium",
    avgPrice: "$6–$18", tags: ["coloring", "AI art", "print-on-demand", "Kindle"],
    platforms: ["Amazon KDP", "Etsy", "Gumroad"],
    summary: "Niche coloring books (mushrooms, dark academia, specific pets) outperform generic titles dramatically. AI generation enables targeting micro-niches. KDP royalties + Etsy digital downloads = dual revenue stream.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    sparkline: genSparkline(71, 66),
  },
  {
    id: "t11", name: "Suncatcher Window Hangings (Crystal)", niche: "Home Decor / Crystal",
    category: "home-decor", score: 74, momentum: 10, direction: "rising",
    weeklyChange: 6, searchVolume: "Medium", competitionLevel: "low",
    avgPrice: "$18–$55", tags: ["crystals", "suncatcher", "rainbow", "decor"],
    platforms: ["Etsy", "Pinterest", "TikTok"],
    summary: "Crystal and rainbow suncatchers maintain strong, consistent demand driven by mental wellness and 'joyful home' aesthetic trends. Very photogenic — ideal for organic social content creation and virality.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    sparkline: genSparkline(74, 81),
  },
  {
    id: "t12", name: "Fitness Tracking Spreadsheets (Google Sheets)", niche: "Digital Products / Fitness",
    category: "fitness", score: 59, momentum: 19, direction: "rising",
    weeklyChange: 12, searchVolume: "Medium", competitionLevel: "low",
    avgPrice: "$5–$19", tags: ["fitness", "spreadsheet", "tracker", "digital"],
    platforms: ["Etsy", "Gumroad", "Reddit"],
    summary: "Fitness tracking templates in Google Sheets/Notion vastly underpriced relative to demand. No dominant brand in this niche. High repeat purchase potential as users buy for different goals (bulking, cutting, marathon).",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    sparkline: genSparkline(59, 47),
  },
];

// ── Category display helpers ─────────────────────────────────
export const CATEGORY_LABELS: Record<string, string> = {
  "home-decor":       "Home Decor",
  "apparel":          "Apparel & Accessories",
  "beauty":           "Beauty & Wellness",
  "food-beverage":    "Food & Beverage",
  "digital-products": "Digital Products",
  "pets":             "Pet Products",
  "fitness":          "Fitness & Health",
  "jewelry":          "Jewelry",
  "art-crafts":       "Art & Crafts",
  "tech-accessories": "Tech Accessories",
  "outdoor":          "Outdoor & Garden",
  "kids":             "Kids & Baby",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "home-decor": "🏠", "apparel": "👕", "beauty": "✨",
  "food-beverage": "🍵", "digital-products": "💻", "pets": "🐾",
  "fitness": "💪", "jewelry": "💍", "art-crafts": "🎨",
  "tech-accessories": "📱", "outdoor": "🌿", "kids": "🧸",
};

// ── Mock daily briefing ──────────────────────────────────────
export function getMockBriefing(): DailyBriefing {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: `briefing-${today}`,
    date: today,
    headline: "Mushroom Lamp hits Breakout status · Crochet accessories surge continues",
    summary: "Two niches crossed the 'breakout' threshold overnight based on Etsy listing velocity and TikTok view momentum. Your watchlist is stable with one positive alert. Today's opportunity of the day is extremely time-sensitive.",
    generatedAt: new Date().toISOString(),
    opportunityOfDay: TREND_SIGNALS[0],
    items: [
      {
        type: "opportunity",
        title: "Mushroom Lamp — Breakout Detected 🍄",
        body: "Score jumped from 73 → 91 in 72 hours. Etsy new listings up 340% but still below demand. First-mover advantage window estimated at 2–4 weeks before saturation.",
        score: 91, delta: 18, niche: "Mushroom Lamp",
      },
      {
        type: "trend",
        title: "Crochet Stanley Accessories — Sustained Momentum",
        body: "Week 3 of above-85 scores. No dominant Etsy seller has emerged. Average order value trending up as buyers add charms + holders to cart together.",
        score: 88, delta: 15, niche: "Crochet Stanley Accessories",
      },
      {
        type: "trend",
        title: "Digital Planners (Vintage Style) — Rising Quietly",
        body: "GoodNotes 6 app downloads spiked following back-to-school season. Vintage/dark academia aesthetic planners converting at 2.4x rate of modern minimal styles.",
        score: 65, delta: 9, niche: "Digital Vintage Planner",
      },
      {
        type: "alert",
        title: "Sourdough Starter Kits — Cooling Signal",
        body: "Score dropped 2 points this week. Still above 65 but momentum is negative. If you're in this niche, consider expanding into related products (banneton baskets, scoring tools).",
        score: 68, delta: -2, niche: "Sourdough Starter Kits",
      },
      {
        type: "risk",
        title: "Digital Products Category — Competition Increasing",
        body: "AI-generated digital products have caused 23% increase in new Etsy listings in this category since January. Differentiation through niche specificity and quality is increasingly important.",
      },
    ],
  };
}
