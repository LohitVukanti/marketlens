import type { TrendSignal, TrendState } from "@/types";

export type TrendSignalRow = {
  id: string;
  keyword: string;
  name: string;
  niche: string;
  category: TrendSignal["category"];
  current_trend_value: number;
  baseline_trend_value: number;
  velocity_score: number;
  acceleration_score: number;
  opportunity_score: number;
  confidence_score: number;
  reddit_mentions_last_7_days?: number | null;
  reddit_mentions_previous_7_days?: number | null;
  reddit_growth_rate?: number | null;
  reddit_source?: TrendSignal["redditSource"] | null;
  reddit_confidence?: number | null;
  etsy_listing_count?: number | null;
  etsy_competition_level?: TrendSignal["etsyCompetitionLevel"] | null;
  etsy_avg_price?: string | null;
  etsy_source?: TrendSignal["etsySource"] | null;
  etsy_confidence?: number | null;
  source_count?: number | null;
  source_confidence?: number | null;
  score_explanation?: TrendSignal["scoreExplanation"] | null;
  why_trending?: string | null;
  source_type?: TrendSignal["sourceType"] | null;
  report_id?: string | null;
  created_by_user_id?: string | null;
  created_by_session_id?: string | null;
  trend_state: TrendState;
  summary: string;
  tags: string[] | null;
  platforms: string[] | null;
  avg_price: string | null;
  competition_level: TrendSignal["competitionLevel"];
  signal_source: TrendSignal["signalSource"];
  sparkline: number[] | null;
  detected_at: string;
  updated_at: string;
};

function directionForState(state: TrendState): TrendSignal["direction"] {
  if (state === "breakout") return "breakout";
  if (state === "cooling") return "falling";
  if (state === "saturated") return "stable";
  return "rising";
}

function volumeLabel(value: number) {
  if (value >= 70) return "High";
  if (value >= 35) return "Medium";
  return "Low";
}

export function mapTrendSignalRow(row: TrendSignalRow): TrendSignal {
  return {
    id: row.id,
    keyword: row.keyword,
    name: row.name,
    niche: row.niche,
    category: row.category,
    score: row.opportunity_score,
    opportunityScore: row.opportunity_score,
    momentum: row.velocity_score,
    velocityScore: row.velocity_score,
    accelerationScore: row.acceleration_score,
    confidenceScore: row.confidence_score,
    currentTrendValue: row.current_trend_value,
    baselineTrendValue: row.baseline_trend_value,
    redditMentionsLast7Days: row.reddit_mentions_last_7_days ?? undefined,
    redditMentionsPrevious7Days: row.reddit_mentions_previous_7_days ?? undefined,
    redditGrowthRate: row.reddit_growth_rate ?? undefined,
    redditSource: row.reddit_source ?? undefined,
    redditConfidence: row.reddit_confidence ?? undefined,
    etsyListingCount: row.etsy_listing_count ?? undefined,
    etsyCompetitionLevel: row.etsy_competition_level ?? undefined,
    etsyAvgPrice: row.etsy_avg_price ?? undefined,
    etsySource: row.etsy_source ?? undefined,
    etsyConfidence: row.etsy_confidence ?? undefined,
    sourceCount: row.source_count ?? undefined,
    sourceConfidence: row.source_confidence ?? undefined,
    scoreExplanation: row.score_explanation ?? undefined,
    whyTrending: row.why_trending ?? undefined,
    sourceType: row.source_type ?? "discovered",
    reportId: row.report_id ?? undefined,
    createdByUserId: row.created_by_user_id ?? undefined,
    createdBySessionId: row.created_by_session_id ?? undefined,
    trendState: row.trend_state,
    signalSource: row.signal_source,
    direction: directionForState(row.trend_state),
    weeklyChange: row.velocity_score,
    searchVolume: volumeLabel(row.current_trend_value),
    competitionLevel: row.competition_level,
    avgPrice: row.avg_price ?? "n/a",
    summary: row.summary,
    tags: row.tags ?? [],
    platforms: row.platforms ?? ["Google Trends", "Supabase"],
    detectedAt: row.detected_at ?? row.updated_at,
    sparkline: row.sparkline ?? [],
  };
}
