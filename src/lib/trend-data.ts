// ============================================================
// src/lib/trend-data.ts
// Mock trend signal data + AI generation logic.
// In production: replace with real data pipeline (Google Trends,
// Reddit API, social listening, Etsy/Amazon scrapers).
// ============================================================

import type { TrendSignal, TrendCategory, DailyBriefing } from "@/types";
import { buildFallbackSignals } from "@/lib/signal-engine";

export const TREND_SIGNALS: TrendSignal[] = buildFallbackSignals();

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
    headline: "Emerging ecommerce products with evidence to verify",
    summary: "Demo briefing data is clearly separated from collected signals. Prioritize products with acceleration, source agreement, and low saturation before adding them to a watchlist.",
    generatedAt: new Date().toISOString(),
    opportunityOfDay: TREND_SIGNALS[0],
    items: [
      {
        type: "opportunity",
        title: "Check high-acceleration product candidates first",
        body: "Emergence Score now emphasizes Google growth, acceleration, Reddit velocity, Etsy saturation, and confidence instead of raw popularity.",
        score: TREND_SIGNALS[0]?.score, delta: TREND_SIGNALS[0]?.weeklyChange, niche: TREND_SIGNALS[0]?.name,
      },
      {
        type: "trend",
        title: "Source quality matters",
        body: "Signals with only fallback/demo evidence should be treated as research prompts, not verified opportunities.",
        score: TREND_SIGNALS[1]?.score, delta: TREND_SIGNALS[1]?.weeklyChange, niche: TREND_SIGNALS[1]?.name,
      },
      {
        type: "trend",
        title: "Low saturation beats old popularity",
        body: "Flat high-demand products are penalized; demand growing faster than competition is the stronger ecommerce signal.",
        score: TREND_SIGNALS[2]?.score, delta: TREND_SIGNALS[2]?.weeklyChange, niche: TREND_SIGNALS[2]?.name,
      },
      {
        type: "alert",
        title: "Needs confirmation means exactly that",
        body: "If Reddit, Etsy, or Google source coverage is weak, MarketLens now labels the signal instead of presenting it as a verified opportunity.",
        score: TREND_SIGNALS[3]?.score, delta: TREND_SIGNALS[3]?.weeklyChange, niche: TREND_SIGNALS[3]?.name,
      },
      {
        type: "risk",
        title: "Digital Products Category — Competition Increasing",
        body: "AI-generated digital products have caused 23% increase in new Etsy listings in this category since January. Differentiation through niche specificity and quality is increasingly important.",
      },
    ],
  };
}
