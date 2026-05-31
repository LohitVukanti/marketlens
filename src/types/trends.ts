// ============================================================
// src/types/trends.ts
// Trend platform types (v3 feed, watchlist, briefing)
// ============================================================

export type TrendDirection = "rising" | "falling" | "stable" | "breakout";
export type TrendState = "emerging" | "rising" | "breakout" | "cooling" | "saturated";
export type TrendSourceType = "discovered" | "from_analysis";
export type TrendCategory =
  | "home-decor" | "apparel" | "beauty" | "food-beverage"
  | "digital-products" | "pets" | "fitness" | "jewelry"
  | "art-crafts" | "tech-accessories" | "outdoor" | "kids";

export interface TrendSignal {
  id: string;
  keyword?: string;
  name: string;
  niche: string;
  category: TrendCategory;
  score: number;
  opportunityScore?: number;
  momentum: number;
  velocityScore?: number;
  accelerationScore?: number;
  confidenceScore?: number;
  currentTrendValue?: number;
  baselineTrendValue?: number;
  redditMentionsLast7Days?: number;
  redditMentionsPrevious7Days?: number;
  redditGrowthRate?: number;
  redditSource?: "reddit_public_json" | "fallback_estimate" | "unavailable";
  redditConfidence?: number;
  etsyListingCount?: number;
  etsyCompetitionLevel?: "low" | "medium" | "high";
  etsyAvgPrice?: string;
  etsySource?: "etsy_api" | "fallback_estimate" | "unavailable";
  etsyConfidence?: number;
  sourceCount?: number;
  sourceConfidence?: number;
  scoreExplanation?: {
    formula?: string;
    google?: Record<string, unknown>;
    reddit?: Record<string, unknown>;
    etsy?: Record<string, unknown>;
    source_agreement?: number;
    opportunity_score?: number;
  };
  whyTrending?: string;
  sourceType?: TrendSourceType;
  reportId?: string | null;
  createdByUserId?: string | null;
  createdBySessionId?: string | null;
  trendState?: TrendState;
  signalSource?: "google_trends" | "fallback_seed" | "mock";
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
  session_id: string;
  user_id: string | null;
  signal_id: string;
  alert_threshold: number;
  created_at: string;
  last_alerted_at: string | null;
  signal: TrendSignal;
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
