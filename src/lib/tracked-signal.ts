import { createServerSupabase } from "@/lib/supabase";
import type { SavedReport, TrendCategory } from "@/types";

type TrackingOwner = {
  userId?: string | null;
  sessionId?: string | null;
};

const CATEGORY_KEYWORDS: Array<{ category: TrendCategory; terms: string[] }> = [
  { category: "digital-products", terms: ["digital", "template", "notion", "course", "software", "app", "saas", "spreadsheet"] },
  { category: "food-beverage", terms: ["coffee", "tea", "candle", "kitchen", "snack", "gift box"] },
  { category: "apparel", terms: ["apparel", "shirt", "clothing", "fashion", "bag", "accessory", "tote"] },
  { category: "beauty", terms: ["beauty", "wellness", "skin", "soap", "cosmetic", "candle"] },
  { category: "pets", terms: ["pet", "dog", "cat"] },
  { category: "fitness", terms: ["fitness", "health", "workout", "gym"] },
  { category: "jewelry", terms: ["jewelry", "ring", "necklace", "earring"] },
  { category: "home-decor", terms: ["home", "decor", "lamp", "candle", "furniture"] },
  { category: "art-crafts", terms: ["art", "craft", "handmade", "wood", "crochet"] },
  { category: "tech-accessories", terms: ["tech", "phone", "laptop", "gadget"] },
  { category: "outdoor", terms: ["outdoor", "garden", "camping"] },
  { category: "kids", terms: ["kids", "baby", "toy"] },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function normalizeKeyword(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export function signalIdForReport(report: Pick<SavedReport, "niche">) {
  const normalized = normalizeKeyword(report.niche);
  return normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "analysis-signal";
}

function inferCategory(report: SavedReport): TrendCategory {
  const haystack = `${report.niche} ${report.product_type} ${report.report_data.marketingChannels?.join(" ") ?? ""}`.toLowerCase();
  return CATEGORY_KEYWORDS.find((entry) => entry.terms.some((term) => haystack.includes(term)))?.category ?? "digital-products";
}

function tagsForReport(report: SavedReport) {
  const tags = new Set<string>();
  report.product_type
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 3)
    .slice(0, 3)
    .forEach((part) => tags.add(part));
  report.report_data.marketingChannels?.slice(0, 3).forEach((channel) => tags.add(channel.toLowerCase()));
  tags.add("analysis");
  return Array.from(tags).slice(0, 6);
}

function fallbackSparkline(score: number, seed: number) {
  return Array.from({ length: 8 }, (_, index) => {
    const drift = index * 2;
    const noise = (seededRand(seed + index * 5) - 0.45) * 12;
    return clamp(score - 12 + drift + noise, 5, 100);
  });
}

function trendStateFor(score: number, velocity: number) {
  if (score >= 80 && velocity >= 12) return "breakout";
  if (velocity >= 8) return "rising";
  if (velocity <= -8) return "cooling";
  return "rising";
}

export async function createOrUpdateTrendSignalFromReport(report: SavedReport, owner: TrackingOwner = {}) {
  const supabase = createServerSupabase();
  const keyword = normalizeKeyword(report.niche);
  const id = signalIdForReport(report);
  const score = clamp(report.report_data.marketScore || 55);
  const seed = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const velocity = clamp((score - 50) / 2 + seededRand(seed) * 12, -100, 100);
  const acceleration = clamp(velocity / 3 + (seededRand(seed + 9) - 0.5) * 10, -100, 100);
  const current = clamp(score * 0.75 + velocity * 0.4 + 15, 0, 100);
  const baseline = clamp(current - velocity, 0, 100);
  const category = inferCategory(report);
  const trendState = trendStateFor(score, velocity);
  const now = new Date().toISOString();
  const summary = `From Deep Analysis: ${report.report_data.summary || report.niche}`;
  const whyTrending = `This signal was created from a MarketLens Deep Analysis for ${report.niche}. It is not source-verified yet; use it as a research lead until Google, Reddit, or Etsy collection enriches it. Data confidence: ${report.report_data.dataConfidence || "needs manual validation."}`;

  const row = {
    id,
    keyword,
    name: report.niche,
    niche: report.product_type || report.niche,
    category,
    current_trend_value: current,
    baseline_trend_value: baseline,
    velocity_score: velocity,
    acceleration_score: acceleration,
    opportunity_score: score,
    emergence_score: Math.max(25, Math.min(55, Math.round(score * 0.72))),
    confidence_score: report.is_mock ? 38 : 52,
    data_quality: report.is_mock ? "demo" : "needs_confirmation",
    is_demo_data: report.is_mock,
    google_growth_4w: null,
    google_growth_8w: null,
    etsy_saturation_score: null,
    first_detected_at: now,
    trend_age_weeks: 0,
    trend_state: trendState,
    summary,
    tags: tagsForReport(report),
    platforms: ["Deep Analysis", "MarketLens"],
    avg_price: report.price_range || null,
    competition_level: score >= 75 ? "low" : score >= 55 ? "medium" : "high",
    signal_source: "fallback_seed",
    sparkline: fallbackSparkline(score, seed),
    source_type: "from_analysis",
    report_id: report.id,
    created_by_user_id: owner.userId ?? null,
    created_by_session_id: owner.sessionId ?? null,
    source_count: 1,
    source_confidence: report.is_mock ? 25 : 45,
    score_explanation: {
      formula: "Deep Analysis market score converted into a trackable trend signal; external collectors can enrich future values.",
      opportunity_score: score,
      source: "deep_analysis",
      report_id: report.id,
    },
    why_trending: whyTrending,
    detected_at: now,
    updated_at: now,
  };

  let { data, error } = await supabase
    .from("trend_signals")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error && /column .* (source_type|report_id|created_by|emergence_score|data_quality|is_demo_data|google_growth_|etsy_saturation_score|first_detected_at|trend_age_weeks)/i.test(error.message)) {
    const legacyRow = Object.fromEntries(
      Object.entries(row).filter(
        ([key]) =>
          ![
            "source_type",
            "report_id",
            "created_by_user_id",
            "created_by_session_id",
            "emergence_score",
            "data_quality",
            "is_demo_data",
            "google_growth_4w",
            "google_growth_8w",
            "etsy_saturation_score",
            "first_detected_at",
            "trend_age_weeks",
          ].includes(key)
      )
    );
    ({ data, error } = await supabase
      .from("trend_signals")
      .upsert(legacyRow, { onConflict: "id" })
      .select("*")
      .single());
  }

  if (error) throw error;
  return data;
}
