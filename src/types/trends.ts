// ============================================================
// src/types/trends.ts
// Trend platform types (v3 feed, watchlist, briefing)
// ============================================================

export type TrendDirection = "rising" | "falling" | "stable" | "breakout";
export type TrendCategory =
  | "home-decor" | "apparel" | "beauty" | "food-beverage"
  | "digital-products" | "pets" | "fitness" | "jewelry"
  | "art-crafts" | "tech-accessories" | "outdoor" | "kids";

export interface TrendSignal {
  id: string;
  name: string;
  niche: string;
  category: TrendCategory;
  score: number;
  momentum: number;
  direction: TrendDirection;
  weeklyChange: number;
  searchVolume: string;
  competitionLevel: "low" | "medium" | "high";
  avgPrice: string;
  summary: string;
  tags: string[];
  platforms: string[];
  detectedAt: string;
  sparkline: number[];
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  niche: string;
  category: TrendCategory | null;
  score: number;
  last_score: number;
  direction: TrendDirection;
  alert_threshold: number;
  notes: string;
  created_at: string;
  last_updated: string;
  report_id: string | null;
}

export interface BriefingItem {
  type: "opportunity" | "alert" | "trend" | "risk";
  title: string;
  body: string;
  score?: number;
  delta?: number;
  niche?: string;
}

export interface DailyBriefing {
  id: string;
  date: string;
  headline: string;
  summary: string;
  items: BriefingItem[];
  opportunityOfDay: TrendSignal;
  generatedAt: string;
}

export function getMomentumLabel(m: number): string {
  if (m >= 20) return "Breakout";
  if (m >= 8) return "Rising Fast";
  if (m >= 2) return "Rising";
  if (m > -2) return "Stable";
  if (m > -8) return "Cooling";
  return "Declining";
}
