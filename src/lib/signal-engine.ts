import type { TrendCategory, TrendDirection, TrendSignal, TrendState } from "@/types";

export type ProductKeyword = {
  keyword: string;
  niche: string;
  category: TrendCategory;
  avgPrice: string;
  competitionLevel: "low" | "medium" | "high";
  tags: string[];
};

export type RawTrendSeries = {
  keyword: string;
  values: number[];
  source?: "google_trends" | "fallback_seed";
};

export type SignalSource = "google_trends" | "fallback_seed" | "mock";

export const PRODUCT_KEYWORDS: ProductKeyword[] = [
  {
    keyword: "mushroom lamp",
    niche: "Ambient Lighting / Home Decor",
    category: "home-decor",
    avgPrice: "$28-$65",
    competitionLevel: "low",
    tags: ["cottagecore", "aesthetic", "lighting"],
  },
  {
    keyword: "crochet cup holder",
    niche: "Drinkware Accessories",
    category: "apparel",
    avgPrice: "$12-$35",
    competitionLevel: "low",
    tags: ["crochet", "accessories", "giftable"],
  },
  {
    keyword: "custom pet portrait",
    niche: "Digital Art / Pet Products",
    category: "pets",
    avgPrice: "$15-$45",
    competitionLevel: "medium",
    tags: ["pets", "personalized", "digital download"],
  },
  {
    keyword: "suncatcher window hanging",
    niche: "Home Decor / Crystal",
    category: "home-decor",
    avgPrice: "$18-$55",
    competitionLevel: "low",
    tags: ["crystals", "rainbow", "decor"],
  },
  {
    keyword: "digital planner goodnotes",
    niche: "Digital Products / Stationery",
    category: "digital-products",
    avgPrice: "$8-$24",
    competitionLevel: "medium",
    tags: ["planner", "GoodNotes", "digital"],
  },
  {
    keyword: "sourdough starter kit",
    niche: "Food & Beverage / Kitchen",
    category: "food-beverage",
    avgPrice: "$18-$42",
    competitionLevel: "medium",
    tags: ["sourdough", "baking", "DIY"],
  },
  {
    keyword: "fitness tracker spreadsheet",
    niche: "Digital Products / Fitness",
    category: "fitness",
    avgPrice: "$5-$19",
    competitionLevel: "low",
    tags: ["fitness", "spreadsheet", "tracker"],
  },
  {
    keyword: "notion ai template",
    niche: "Digital Products / Productivity",
    category: "digital-products",
    avgPrice: "$9-$37",
    competitionLevel: "high",
    tags: ["notion", "AI", "productivity"],
  },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function fallbackSeries(seed: number) {
  const base = 18 + seededRand(seed) * 42;
  const slope = -2 + seededRand(seed + 7) * 12;
  return Array.from({ length: 12 }, (_, index) => {
    const noise = (seededRand(seed + index * 3) - 0.45) * 14;
    return clamp(base + index * slope + noise, 1, 100);
  });
}

function trendState(
  currentValue: number,
  velocityScore: number,
  accelerationScore: number,
  baselineValue: number
): TrendState {
  if (currentValue >= 80 && velocityScore >= 24) return "breakout";
  if (velocityScore >= 12 && accelerationScore >= 2) return "emerging";
  if (velocityScore >= 7) return "rising";
  if (velocityScore <= -8 || accelerationScore <= -12) return "cooling";
  if (baselineValue >= 65 && Math.abs(velocityScore) < 7) return "saturated";
  return "rising";
}

function directionForState(state: TrendState): TrendDirection {
  if (state === "breakout") return "breakout";
  if (state === "cooling") return "falling";
  if (state === "saturated") return "stable";
  return "rising";
}

function confidenceScore(values: number[], source: SignalSource) {
  const nonZero = values.filter(Boolean).length;
  const coverage = (nonZero / Math.max(values.length, 1)) * 100;
  const sourceWeight = source === "google_trends" ? 18 : 6;
  return clamp(coverage * 0.72 + sourceWeight);
}

function opportunityScore(params: {
  currentValue: number;
  velocityScore: number;
  accelerationScore: number;
  confidence: number;
  competitionLevel: ProductKeyword["competitionLevel"];
}) {
  const competitionBoost = { low: 14, medium: 5, high: -8 }[params.competitionLevel];
  return clamp(
    params.currentValue * 0.36 +
      params.velocityScore * 0.8 +
      params.accelerationScore * 0.45 +
      params.confidence * 0.18 +
      competitionBoost
  );
}

function summaryFor(signal: {
  keyword: string;
  state: TrendState;
  currentValue: number;
  baselineValue: number;
  velocityScore: number;
  accelerationScore: number;
  confidence: number;
  source: SignalSource;
}) {
  const sourceText =
    signal.source === "google_trends"
      ? "Google Trends interest"
      : "Fallback demo trend model";
  const movement =
    signal.velocityScore >= 0
      ? `${signal.velocityScore} points above baseline`
      : `${Math.abs(signal.velocityScore)} points below baseline`;

  return `${sourceText} puts ${signal.keyword} at ${signal.currentValue}/100, ${movement}, with ${signal.accelerationScore >= 0 ? "positive" : "negative"} acceleration. State: ${signal.state}. Confidence is ${signal.confidence}/100 based on series coverage and source quality.`;
}

export function buildSignalsFromSeries(
  series: RawTrendSeries[],
  source: SignalSource
): TrendSignal[] {
  return PRODUCT_KEYWORDS.map((product, index) => {
    const found = series.find((item) => item.keyword === product.keyword);
    const values = found?.values?.length ? found.values : fallbackSeries(index + 11);
    const recent = values.slice(-3);
    const previous = values.slice(-6, -3);
    const currentValue = clamp(avg(recent));
    const baselineValue = clamp(avg(values.slice(0, Math.max(values.length - 3, 1))));
    const previousAvg = avg(previous);
    const velocityScore = clamp(currentValue - baselineValue, -100, 100);
    const accelerationScore = clamp(avg(recent) - previousAvg, -100, 100);
    const state = trendState(currentValue, velocityScore, accelerationScore, baselineValue);
    const confidence = confidenceScore(values, found?.source ?? source);
    const score = opportunityScore({
      currentValue,
      velocityScore,
      accelerationScore,
      confidence,
      competitionLevel: product.competitionLevel,
    });

    return {
      id: product.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: product.keyword.replace(/\b\w/g, (char) => char.toUpperCase()),
      keyword: product.keyword,
      niche: product.niche,
      category: product.category,
      score,
      opportunityScore: score,
      momentum: velocityScore,
      velocityScore,
      accelerationScore,
      confidenceScore: confidence,
      currentTrendValue: currentValue,
      baselineTrendValue: baselineValue,
      trendState: state,
      signalSource: found?.source ?? source,
      direction: directionForState(state),
      weeklyChange: velocityScore,
      searchVolume: currentValue >= 70 ? "High" : currentValue >= 35 ? "Medium" : "Low",
      competitionLevel: product.competitionLevel,
      avgPrice: product.avgPrice,
      tags: product.tags,
      platforms: ["Google Trends", "Supabase"],
      summary: summaryFor({
        keyword: product.keyword,
        state,
        currentValue,
        baselineValue,
        velocityScore,
        accelerationScore,
        confidence,
        source: found?.source ?? source,
      }),
      detectedAt: new Date().toISOString(),
      sparkline: values.slice(-8).map((value) => clamp(value)),
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildFallbackSignals() {
  return buildSignalsFromSeries([], "fallback_seed");
}
