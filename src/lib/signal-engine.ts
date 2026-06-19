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
    keyword: "bow phone charm",
    niche: "Accessories / Phone Charms",
    category: "home-decor",
    avgPrice: "$8-$22",
    competitionLevel: "low",
    tags: ["coquette", "phone charm", "giftable"],
  },
  {
    keyword: "pickleball bag charm",
    niche: "Sports Accessories / Gifts",
    category: "apparel",
    avgPrice: "$10-$28",
    competitionLevel: "low",
    tags: ["pickleball", "bag charm", "personalized"],
  },
  {
    keyword: "pet loss memorial candle",
    niche: "Pet Memorial / Home Fragrance",
    category: "pets",
    avgPrice: "$18-$45",
    competitionLevel: "medium",
    tags: ["pet memorial", "sympathy gift", "candle"],
  },
  {
    keyword: "wedding newspaper program",
    niche: "Wedding Stationery / Templates",
    category: "digital-products",
    avgPrice: "$9-$29",
    competitionLevel: "low",
    tags: ["wedding", "newspaper", "template"],
  },
  {
    keyword: "notion second brain template",
    niche: "Digital Products / Productivity",
    category: "digital-products",
    avgPrice: "$12-$49",
    competitionLevel: "medium",
    tags: ["notion", "productivity", "template"],
  },
  {
    keyword: "baby name sign acrylic",
    niche: "Baby / Nursery Decor",
    category: "kids",
    avgPrice: "$18-$58",
    competitionLevel: "low",
    tags: ["baby", "nursery", "personalized"],
  },
  {
    keyword: "pilates grip socks bow",
    niche: "Fitness Accessories / Apparel",
    category: "apparel",
    avgPrice: "$12-$26",
    competitionLevel: "low",
    tags: ["pilates", "grip socks", "coquette"],
  },
  {
    keyword: "canva brand kit template",
    niche: "Digital Products / Shopify Branding",
    category: "digital-products",
    avgPrice: "$15-$59",
    competitionLevel: "medium",
    tags: ["canva", "branding", "shopify"],
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
  const base = 8 + seededRand(seed) * 24;
  const slope = 1 + seededRand(seed + 7) * 8;
  return Array.from({ length: 12 }, (_, index) => {
    const noise = (seededRand(seed + index * 3) - 0.45) * 14;
    return clamp(base + index * slope + noise, 1, 100);
  });
}

function trendState(
  currentValue: number,
  velocityScore: number,
  accelerationScore: number,
  baselineValue: number,
  growth4w = 0
): TrendState {
  if (growth4w <= 0 && accelerationScore <= 0) {
    if (velocityScore <= -8 || accelerationScore <= -8) return "cooling";
    return baselineValue >= 65 ? "saturated" : "rising";
  }
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

function percentChange(current: number, previous: number) {
  if (previous <= 0 && current <= 0) return 0;
  if (previous <= 0) return Math.min(300, current * 100);
  return Math.round(((current - previous) / previous) * 100);
}

function saturationScore(level: ProductKeyword["competitionLevel"]) {
  return { low: 86, medium: 58, high: 28 }[level];
}

function emergenceScore(params: {
  currentValue: number;
  velocityScore: number;
  accelerationScore: number;
  growth4w: number;
  growth8w: number;
  confidence: number;
  competitionLevel: ProductKeyword["competitionLevel"];
  source: SignalSource;
  sourceCount?: number;
  dataQuality?: TrendSignal["dataQuality"];
}) {
  const accelerationComponent = clamp(50 + params.accelerationScore * 2.4);
  const growth4wComponent = clamp(50 + params.growth4w * 0.45);
  const redditComponent = 35;
  const etsyComponent = saturationScore(params.competitionLevel);
  const confidenceComponent = params.confidence;
  const flatDemandPenalty = params.currentValue >= 70 && Math.abs(params.velocityScore) < 7 ? 18 : 0;
  const stalePenalty = params.growth8w < 8 ? 10 : 0;

  const rawScore = clamp(
    accelerationComponent * 0.30 +
      growth4wComponent * 0.20 +
      redditComponent * 0.15 +
      etsyComponent * 0.20 +
      confidenceComponent * 0.15 -
      flatDemandPenalty -
      stalePenalty
  );

  const sourceCount = params.sourceCount ?? 1;
  const caps = [
    params.source === "fallback_seed" ? 40 : 100,
    sourceCount < 2 ? 60 : 100,
    params.dataQuality === "needs_confirmation" ? 60 : 100,
    params.growth4w <= 0 && params.accelerationScore <= 0 ? 50 : 100,
    params.confidence < 45 ? 50 : 100,
  ];

  return Math.min(rawScore, ...caps);
}

function dataQuality(source: SignalSource, confidence: number, sourceCount = 1, growth4w = 0, acceleration = 0): TrendSignal["dataQuality"] {
  if (source === "fallback_seed") return "demo";
  if (confidence < 45 || sourceCount < 2) return "needs_confirmation";
  if (confidence >= 72 && sourceCount >= 2 && (growth4w > 0 || acceleration > 0)) return "verified";
  return "emerging";
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
  const sourceText = signal.source === "google_trends" ? "Google Trends interest" : "Demo fallback model";
  const movement =
    signal.velocityScore >= 0
      ? `${signal.velocityScore} points above baseline`
      : `${Math.abs(signal.velocityScore)} points below baseline`;

  return `${sourceText} puts ${signal.keyword} at ${signal.currentValue}/100, ${movement}, with ${signal.accelerationScore >= 0 ? "positive" : "negative"} acceleration. State: ${signal.state}. Confidence is ${signal.confidence}/100 based on series coverage and source quality. Demo fallback signals are research examples, not verified product recommendations.`;
}

export function buildSignalsFromSeries(
  series: RawTrendSeries[],
  source: SignalSource
): TrendSignal[] {
  return PRODUCT_KEYWORDS.map((product, index) => {
    const found = series.find((item) => item.keyword === product.keyword);
    const values = found?.values?.length ? found.values : fallbackSeries(index + 11);
    const recent = values.slice(-4);
    const previous = values.slice(-8, -4);
    const currentValue = clamp(avg(recent));
    const baselineValue = clamp(avg(values.slice(0, Math.max(values.length - 4, 1))));
    const previousAvg = avg(previous);
    const velocityScore = clamp(currentValue - baselineValue, -100, 100);
    const accelerationScore = clamp(avg(recent) - previousAvg, -100, 100);
    const growth4w = percentChange(avg(values.slice(-4)), avg(values.slice(-8, -4)));
    const growth8w = percentChange(avg(values.slice(-4)), avg(values.slice(-12, -8)));
    const state = trendState(currentValue, velocityScore, accelerationScore, baselineValue, growth4w);
    const confidence = confidenceScore(values, found?.source ?? source);
    const signalSource = found?.source ?? source;
    const quality = dataQuality(signalSource, confidence, 1, growth4w, accelerationScore);
    const score = emergenceScore({
      currentValue,
      velocityScore,
      accelerationScore,
      growth4w,
      growth8w,
      confidence,
      competitionLevel: product.competitionLevel,
      source: signalSource,
      sourceCount: 1,
      dataQuality: quality,
    });

    return {
      id: product.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: product.keyword.replace(/\b\w/g, (char) => char.toUpperCase()),
      keyword: product.keyword,
      niche: product.niche,
      category: product.category,
      score,
      emergenceScore: score,
      opportunityScore: score,
      momentum: velocityScore,
      velocityScore,
      accelerationScore,
      confidenceScore: confidence,
      googleGrowth4w: growth4w,
      googleGrowth8w: growth8w,
      etsySaturationScore: saturationScore(product.competitionLevel),
      dataQuality: quality,
      isDemoData: signalSource === "fallback_seed",
      firstDetectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * (index + 1)).toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      trendAgeWeeks: index + 1,
      currentTrendValue: currentValue,
      baselineTrendValue: baselineValue,
      trendState: state,
      signalSource,
      direction: directionForState(state),
      weeklyChange: velocityScore,
      searchVolume: currentValue >= 70 ? "High" : currentValue >= 35 ? "Medium" : "Low",
      competitionLevel: product.competitionLevel,
      avgPrice: product.avgPrice,
      tags: product.tags,
      platforms: signalSource === "fallback_seed" ? ["Demo fallback"] : ["Google Trends", "Supabase"],
      summary: summaryFor({
        keyword: product.keyword,
        state,
        currentValue,
        baselineValue,
        velocityScore,
        accelerationScore,
        confidence,
        source: signalSource,
      }),
      detectedAt: new Date().toISOString(),
      sparkline: values.slice(-8).map((value) => clamp(value)),
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildFallbackSignals() {
  return buildSignalsFromSeries([], "fallback_seed");
}
