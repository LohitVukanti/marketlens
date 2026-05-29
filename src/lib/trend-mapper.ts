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
