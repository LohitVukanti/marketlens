import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

dotenv.config({ path: ".env.local" });

const VALID_CATEGORIES = new Set([
  "home-decor",
  "apparel",
  "beauty",
  "food-beverage",
  "digital-products",
  "pets",
  "fitness",
  "jewelry",
  "art-crafts",
  "tech-accessories",
  "outdoor",
  "kids",
]);

let PRODUCTS = [
  ["bow phone charm", "Accessories / Phone Charms", "home-decor", "$8-$22", "low", ["coquette", "phone charm", "giftable"]],
  ["pickleball bag charm", "Sports Accessories / Gifts", "apparel", "$10-$28", "low", ["pickleball", "bag charm", "personalized"]],
  ["pet loss memorial candle", "Pet Memorial / Home Fragrance", "pets", "$18-$45", "medium", ["pet memorial", "sympathy gift", "candle"]],
  ["wedding newspaper program", "Wedding Stationery / Templates", "digital-products", "$9-$29", "low", ["wedding", "newspaper", "template"]],
  ["notion second brain template", "Digital Products / Productivity", "digital-products", "$12-$49", "medium", ["notion", "productivity", "template"]],
  ["baby name sign acrylic", "Baby / Nursery Decor", "kids", "$18-$58", "low", ["baby", "nursery", "personalized"]],
  ["pilates grip socks bow", "Fitness Accessories / Apparel", "apparel", "$12-$26", "low", ["pilates", "grip socks", "coquette"]],
  ["canva brand kit template", "Digital Products / Shopify Branding", "digital-products", "$15-$59", "medium", ["canva", "branding", "shopify"]],
].map(([keyword, niche, category, avgPrice, competitionLevel, tags], index) => ({
  keyword,
  niche,
  category,
  avgPrice,
  competitionLevel,
  tags,
  seed: index + 11,
}));

const PYTRENDS_COLLECTOR = `
import json, sys
keywords = json.loads(sys.argv[1])
try:
    from pytrends.request import TrendReq
    pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25), retries=1, backoff_factor=0.2)
    output = []
    for kw in keywords:
        pytrends.build_payload([kw], timeframe="today 3-m", geo="US")
        df = pytrends.interest_over_time()
        if df.empty or kw not in df:
            values = []
        else:
            values = [int(v) for v in df[kw].tail(12).tolist()]
        output.append({"keyword": kw, "values": values, "source": "google_trends"})
    print(json.dumps({"ok": True, "series": output}))
except Exception as exc:
    print(json.dumps({"ok": False, "error": str(exc)}))
`;

const DEFAULT_TIMEOUT_MS = 12000;
const REDDIT_SUBREDDITS = [
  "Etsy",
  "EtsySellers",
  "Shopify",
  "dropship",
  "Entrepreneur",
  "smallbusiness",
  "handmade",
  "crafts",
  "BuyItForLife",
  "ProductPorn",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : 0)));
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function fallbackSeries(seed) {
  const base = 8 + seededRand(seed) * 24;
  const slope = 1 + seededRand(seed + 7) * 8;
  return Array.from({ length: 12 }, (_, index) => {
    const noise = (seededRand(seed + index * 3) - 0.45) * 14;
    return clamp(base + index * slope + noise, 1, 100);
  });
}

function stateFor(current, velocity, acceleration, baseline) {
  if (current >= 80 && velocity >= 24) return "breakout";
  if (velocity >= 12 && acceleration >= 2) return "emerging";
  if (velocity >= 7) return "rising";
  if (velocity <= -8 || acceleration <= -12) return "cooling";
  if (baseline >= 65 && Math.abs(velocity) < 7) return "saturated";
  return "rising";
}

function honestStateFor(current, velocity, acceleration, baseline, googleGrowth4w) {
  if (googleGrowth4w <= 0 && acceleration <= 0) {
    if (velocity <= -8 || acceleration <= -8) return "cooling";
    return baseline >= 65 ? "saturated" : "rising";
  }

  return stateFor(current, velocity, acceleration, baseline);
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function rowId(keyword) {
  return keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeCandidateKeyword(row, index) {
  const evidence = row.evidence && typeof row.evidence === "object" ? row.evidence : {};
  const keyword = String(row.keyword || "").trim().toLowerCase();
  const category = VALID_CATEGORIES.has(row.category) ? row.category : "digital-products";
  const tags = Array.isArray(evidence.tags)
    ? evidence.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
    : ["candidate", row.source || "verified"];

  if (!keyword) return null;

  return {
    keyword,
    niche: String(evidence.niche || titleCase(keyword)),
    category,
    avgPrice: String(evidence.avgPrice || evidence.avg_price || "n/a"),
    competitionLevel: ["low", "medium", "high"].includes(evidence.competitionLevel)
      ? evidence.competitionLevel
      : ["low", "medium", "high"].includes(evidence.competition_level)
        ? evidence.competition_level
        : "medium",
    tags,
    seed: 100 + index,
  };
}

async function loadVerifiedCandidateProducts(supabase) {
  const { data, error } = await supabase
    .from("candidate_keywords")
    .select("keyword, category, source, evidence")
    .eq("status", "verified")
    .limit(50);

  if (error) {
    console.warn(`Candidate keyword expansion skipped: ${error.message}`);
    return [];
  }

  return (data || [])
    .map((row, index) => normalizeCandidateKeyword(row, index))
    .filter(Boolean);
}

function mergeProducts(curated, candidates) {
  const byKeyword = new Map(curated.map((product) => [product.keyword, product]));
  for (const candidate of candidates) {
    if (!byKeyword.has(candidate.keyword)) byKeyword.set(candidate.keyword, candidate);
  }
  return Array.from(byKeyword.values());
}

function percentChange(current, previous) {
  if (previous <= 0 && current <= 0) return 0;
  if (previous <= 0) return Math.min(300, current * 100);
  return Math.round(((current - previous) / previous) * 100);
}

function formatPercent(value) {
  if (value === 0) return "flat";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function competitionFromListingCount(listingCount, fallbackLevel) {
  if (!Number.isFinite(listingCount)) return fallbackLevel;
  if (listingCount < 750) return "low";
  if (listingCount < 3500) return "medium";
  return "high";
}

function competitionScore(level, listingCount) {
  const base = { low: 88, medium: 58, high: 28 }[level] ?? 50;
  if (!Number.isFinite(listingCount)) return base;
  const saturationPenalty = Math.min(32, Math.log10(Math.max(listingCount, 1)) * 8);
  return clamp(base - saturationPenalty + 20);
}

function sourceCountFor(reddit, etsy, googleSource) {
  return [
    googleSource === "google_trends",
    reddit.source === "reddit_public_json",
    etsy.source === "etsy_api",
  ].filter(Boolean).length || 1;
}

function sourceAgreementScore(velocity, acceleration, reddit, etsy) {
  const positiveSignals = [
    velocity >= 7,
    acceleration >= 2,
    reddit.source === "reddit_public_json" && reddit.growthRate >= 25,
    etsy.source === "etsy_api" && (etsy.estimatedCompetitionLevel === "low" || etsy.estimatedCompetitionLevel === "medium"),
  ].filter(Boolean).length;
  const realSourceCount = [
    reddit.source === "reddit_public_json",
    etsy.source === "etsy_api",
  ].filter(Boolean).length;

  return clamp(28 + positiveSignals * 16 + realSourceCount * 8);
}

function confidenceFor(values, googleSource, reddit, etsy, sourceAgreement) {
  const googleCoverage = (values.filter(Boolean).length / Math.max(values.length, 1)) * 100;
  const googleConfidence = clamp(googleCoverage * 0.72 + (googleSource === "google_trends" ? 18 : 6));
  const sourceConfidence = avg([googleConfidence, reddit.confidence, etsy.confidence].filter((value) => value > 0));
  return clamp(sourceConfidence * 0.72 + sourceAgreement * 0.18 + sourceCountFor(reddit, etsy, googleSource) * 4);
}

function scoreFor({ current, velocity, acceleration, googleGrowth4w, googleGrowth8w, reddit, etsy, sourceAgreement, sourceCount, confidence, isDemoData, dataQuality }) {
  const googleAccelerationScore = clamp(50 + acceleration * 2.4);
  const googleGrowthScore = clamp(50 + velocity * 2);
  const redditGrowthScore = reddit.source === "reddit_public_json" ? clamp(50 + reddit.growthRate * 0.35) : 20;
  const etsySaturationScore = etsy.source === "etsy_api" ? competitionScore(etsy.estimatedCompetitionLevel, etsy.listingCount) : 28;
  const flatDemandPenalty = current >= 70 && Math.abs(velocity) < 7 ? 18 : 0;
  const stalePenalty = googleGrowth8w < 8 ? 8 : 0;

  const rawScore = clamp(
    googleAccelerationScore * 0.30 +
      googleGrowthScore * 0.20 +
      redditGrowthScore * 0.15 +
      etsySaturationScore * 0.20 +
      sourceAgreement * 0.15 -
      flatDemandPenalty -
      stalePenalty
  );

  const caps = [
    isDemoData ? 40 : 100,
    sourceCount < 2 ? 60 : 100,
    reddit.source !== "reddit_public_json" && etsy.source !== "etsy_api" ? 55 : 100,
    dataQuality === "needs_confirmation" ? 60 : 100,
    googleGrowth4w <= 0 && acceleration <= 0 ? 50 : 100,
    confidence < 45 ? 50 : 100,
  ];

  return Math.min(rawScore, ...caps);
}

function dataQuality({ signalSource, sourceCount, confidence, sourceAgreement, googleGrowth4w, acceleration, reddit, etsy }) {
  if (signalSource === "fallback_seed") return "demo";
  if (confidence < 45 || sourceCount < 2) return "needs_confirmation";
  if (
    confidence >= 72 &&
    sourceCount >= 2 &&
    sourceAgreement >= 68 &&
    (googleGrowth4w > 0 || acceleration > 0) &&
    (reddit.source === "reddit_public_json" || etsy.source === "etsy_api")
  ) return "verified";
  return "emerging";
}

function unavailableReddit(reason = "Reddit collection unavailable") {
  return {
    ok: false,
    source: "unavailable",
    mentionsLast7Days: 0,
    mentionsPrevious7Days: 0,
    growthRate: 0,
    confidence: 0,
    reason,
  };
}

async function fetchRedditJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          process.env.REDDIT_USER_AGENT ||
          "MarketLensBetaSignalCollector/0.3 (contact: riccu15@gmail.com)",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) throw new Error(`Reddit returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function collectRedditForProduct(product) {
  if (process.env.REDDIT_COLLECT_ENABLED === "false") {
    return unavailableReddit("REDDIT_COLLECT_ENABLED=false");
  }

  const postsById = new Map();
  const errors = [];

  try {
    for (const subreddit of REDDIT_SUBREDDITS) {
      const url = new URL(`https://www.reddit.com/r/${subreddit}/search.json`);
      url.searchParams.set("q", `"${product.keyword}"`);
      url.searchParams.set("restrict_sr", "1");
      url.searchParams.set("sort", "new");
      url.searchParams.set("t", "month");
      url.searchParams.set("limit", "25");

      try {
        const payload = await fetchRedditJson(url);
        for (const post of payload?.data?.children ?? []) {
          const id = post?.data?.id;
          if (id) postsById.set(id, post);
        }
      } catch (error) {
        errors.push(`${subreddit}: ${error.message}`);
      }

      await sleep(Number(process.env.REDDIT_REQUEST_DELAY_MS ?? 650));
    }

    const posts = Array.from(postsById.values());
    const nowSeconds = Date.now() / 1000;
    const last7Cutoff = nowSeconds - 7 * 24 * 60 * 60;
    const previous7Cutoff = nowSeconds - 14 * 24 * 60 * 60;

    const mentionsLast7Days = posts.filter((post) => post?.data?.created_utc >= last7Cutoff).length;
    const mentionsPrevious7Days = posts.filter((post) => {
      const created = post?.data?.created_utc;
      return created >= previous7Cutoff && created < last7Cutoff;
    }).length;

    return {
      ok: true,
      source: "reddit_public_json",
      mentionsLast7Days,
      mentionsPrevious7Days,
      growthRate: percentChange(mentionsLast7Days, mentionsPrevious7Days),
      confidence: posts.length ? clamp(48 + Math.min(posts.length * 2, 42)) : 28,
      searchedSubreddits: REDDIT_SUBREDDITS.length,
      errors,
    };
  } catch (error) {
    return { ...unavailableReddit(error.message), error: error.message };
  }
}

async function collectRedditSignals() {
  const results = new Map();
  const errors = [];

  for (const product of PRODUCTS) {
    const reddit = await collectRedditForProduct(product);
    if (reddit.error || reddit.source !== "reddit_public_json") {
      errors.push(`${product.keyword}: ${reddit.error || reddit.reason || reddit.source}`);
    }
    console.log(
      `[reddit] ${product.keyword}: ${reddit.source}${
        reddit.source === "reddit_public_json"
          ? ` (${reddit.mentionsLast7Days}/${reddit.mentionsPrevious7Days} mentions, confidence ${reddit.confidence})`
          : ` (${reddit.reason || reddit.error || "unavailable"})`
      }`
    );
    results.set(product.keyword, reddit);
  }

  return { results, errors };
}

function fallbackEtsy(product) {
  const ranges = {
    low: [120, 720],
    medium: [900, 3100],
    high: [4200, 12000],
  };
  const [min, max] = ranges[product.competitionLevel] ?? ranges.medium;
  const listingCount = Math.round(min + seededRand(product.seed + 211) * (max - min));

  return {
    ok: false,
    source: "fallback_estimate",
    listingCount,
    estimatedCompetitionLevel: competitionFromListingCount(listingCount, product.competitionLevel),
    avgPrice: product.avgPrice,
    confidence: 12,
  };
}

function formatEtsyPrice(price) {
  if (!price) return null;
  if (typeof price === "string") return price;
  if (typeof price.amount === "string" && typeof price.divisor === "string") {
    const amount = Number(price.amount) / Number(price.divisor);
    return Number.isFinite(amount) ? `$${amount.toFixed(amount >= 10 ? 0 : 2)}` : null;
  }
  if (typeof price.amount === "number" && typeof price.divisor === "number") {
    const amount = price.amount / price.divisor;
    return `$${amount.toFixed(amount >= 10 ? 0 : 2)}`;
  }
  return null;
}

function averagePriceLabel(prices, fallback) {
  const numeric = prices
    .map((price) => Number(String(price).replace(/[^0-9.]/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!numeric.length) return fallback;
  const average = avg(numeric);
  return `$${average.toFixed(average >= 10 ? 0 : 2)} avg`;
}

async function collectEtsyForProduct(product) {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey || process.env.ETSY_COLLECT_ENABLED === "false") return fallbackEtsy(product);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const url = new URL("https://openapi.etsy.com/v3/application/listings/active");
  url.searchParams.set("keywords", product.keyword);
  url.searchParams.set("limit", "10");

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`Etsy returned ${response.status}`);

    const payload = await response.json();
    const listingCount = Number(payload?.count ?? payload?.pagination?.effective_limit ?? 0);
    const prices = (payload?.results ?? [])
      .map((listing) => formatEtsyPrice(listing.price))
      .filter(Boolean);

    return {
      ok: true,
      source: "etsy_api",
      listingCount,
      estimatedCompetitionLevel: competitionFromListingCount(listingCount, product.competitionLevel),
      avgPrice: averagePriceLabel(prices, product.avgPrice),
      confidence: listingCount > 0 ? 78 : 42,
    };
  } catch (error) {
    return { ...fallbackEtsy(product), error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function collectEtsySignals() {
  const results = new Map();
  const errors = [];

  for (const product of PRODUCTS) {
    const etsy = await collectEtsyForProduct(product);
    if (etsy.error) errors.push(`${product.keyword}: ${etsy.error}`);
    console.log(
      `[etsy] ${product.keyword}: ${etsy.source} (${Number.isFinite(etsy.listingCount) ? `${etsy.listingCount} listings` : "no listing count"}, confidence ${etsy.confidence})`
    );
    results.set(product.keyword, etsy);
  }

  return { results, errors };
}

function collectGoogleTrends() {
  const result = spawnSync("python3", ["-c", PYTRENDS_COLLECTOR, JSON.stringify(PRODUCTS.map((p) => p.keyword))], {
    encoding: "utf8",
    timeout: 120000,
  });

  if (result.error || result.status !== 0) {
    return { ok: false, error: result.error?.message || result.stderr || "python3 collector failed" };
  }

  try {
    return JSON.parse(result.stdout.trim());
  } catch (error) {
    return { ok: false, error: `Could not parse pytrends output: ${error.message}` };
  }
}

function buildExplanation({ current, baseline, velocity, acceleration, googleGrowth4w, googleGrowth8w, reddit, etsy, sourceAgreement, opportunity }) {
  return {
    formula:
      "30% Google acceleration, 20% Google 4-week growth, 15% Reddit mention growth when real, 20% Etsy saturation inverse when real, 15% source agreement/confidence; caps apply for demo, one-source, fallback, and needs-confirmation signals",
    google: {
      current,
      baseline,
      velocity,
      acceleration,
      growth_4w: googleGrowth4w,
      growth_8w: googleGrowth8w,
      signal: velocity >= 7 ? "rising" : velocity <= -8 ? "cooling" : "stable",
    },
    reddit: {
      mentions_last_7_days: reddit.mentionsLast7Days,
      mentions_previous_7_days: reddit.mentionsPrevious7Days,
      growth_rate: reddit.growthRate,
      source: reddit.source,
    },
    etsy: {
      listing_count: etsy.listingCount,
      estimated_competition_level: etsy.estimatedCompetitionLevel,
      source: etsy.source,
    },
    source_agreement: sourceAgreement,
    opportunity_score: opportunity,
  };
}

function buildWhyTrending(product, current, baseline, velocity, googleGrowth4w, googleGrowth8w, reddit, etsy, quality, signalSource) {
  const searchTrend =
    signalSource !== "google_trends"
      ? "Demo/fallback signal. Google Trends collection is unavailable, so this row uses fallback seed data"
      : baseline > 0
      ? `Google Trends interest is ${velocity >= 0 ? "up" : "down"} ${Math.abs(percentChange(current, baseline))}% versus baseline, with ${formatPercent(googleGrowth4w)} 4-week growth and ${formatPercent(googleGrowth8w)} 8-week growth`
      : `Google Trends interest is at ${current}/100`;
  const redditTrend =
    reddit.source === "reddit_public_json"
      ? reddit.growthRate > 0
        ? `Reddit public data shows ${reddit.mentionsLast7Days} mentions in the last 7 days versus ${reddit.mentionsPrevious7Days} previously (${formatPercent(reddit.growthRate)})`
        : `Reddit public data shows ${reddit.mentionsLast7Days} mentions in the last 7 days and no clear positive velocity`
      : "Reddit data is unavailable and does not support the score";
  const etsyTrend =
    etsy.source === "etsy_api"
      ? `Etsy API reports ${etsy.listingCount.toLocaleString()} active listings and ${etsy.estimatedCompetitionLevel} competition`
      : `Etsy competition is estimated only because Etsy API is not configured or unavailable${Number.isFinite(etsy.listingCount) ? ` (${etsy.listingCount.toLocaleString()} estimated listings)` : ""}`;
  const caveat = quality === "needs_confirmation" ? " Needs confirmation before acting." : "";

  return `${searchTrend}. ${redditTrend}. ${etsyTrend}.${caveat}`;
}

function buildRows(series, source, redditResults, etsyResults) {
  const now = new Date().toISOString();

  return PRODUCTS.map((product) => {
    const found = series.find((item) => item.keyword === product.keyword && item.values?.length);
    const values = found ? found.values : fallbackSeries(product.seed);
    const signalSource = found?.source || source;
    const reddit = redditResults.get(product.keyword) || unavailableReddit("No Reddit result returned");
    const etsy = etsyResults.get(product.keyword) || fallbackEtsy(product);
    const recent = values.slice(-4);
    const previous = values.slice(-8, -4);
    const current = clamp(avg(recent));
    const baseline = clamp(avg(values.slice(0, Math.max(values.length - 4, 1))));
    const velocity = clamp(current - baseline, -100, 100);
    const acceleration = clamp(avg(recent) - avg(previous), -100, 100);
    const googleGrowth4w = percentChange(avg(values.slice(-4)), avg(values.slice(-8, -4)));
    const googleGrowth8w = percentChange(avg(values.slice(-4)), avg(values.slice(-12, -8)));
    const trendState = honestStateFor(current, velocity, acceleration, baseline, googleGrowth4w);
    const sourceAgreement = sourceAgreementScore(velocity, acceleration, reddit, etsy);
    const sourceCount = sourceCountFor(reddit, etsy, signalSource);
    const conf = confidenceFor(values, signalSource, reddit, etsy, sourceAgreement);
    const quality = dataQuality({
      signalSource,
      sourceCount,
      confidence: conf,
      sourceAgreement,
      googleGrowth4w,
      acceleration,
      reddit,
      etsy,
    });
    const opportunity = scoreFor({
      current,
      velocity,
      acceleration,
      googleGrowth4w,
      googleGrowth8w,
      reddit,
      etsy,
      sourceAgreement,
      sourceCount,
      confidence: conf,
      isDemoData: signalSource === "fallback_seed",
      dataQuality: quality,
    });
    const whyTrending = buildWhyTrending(product, current, baseline, velocity, googleGrowth4w, googleGrowth8w, reddit, etsy, quality, signalSource);
    const scoreExplanation = buildExplanation({
      current,
      baseline,
      velocity,
      acceleration,
      googleGrowth4w,
      googleGrowth8w,
      reddit,
      etsy,
      sourceAgreement,
      opportunity,
    });
    const summary = `${whyTrending} Confidence is ${conf}/100 across ${sourceCount} real source${sourceCount === 1 ? "" : "s"}. Score caps are applied when Reddit/Etsy are unavailable, data needs confirmation, or source count is low.`;

    return {
      id: rowId(product.keyword),
      keyword: product.keyword,
      name: titleCase(product.keyword),
      niche: product.niche,
      category: product.category,
      current_trend_value: current,
      baseline_trend_value: baseline,
      velocity_score: velocity,
      acceleration_score: acceleration,
      opportunity_score: opportunity,
      emergence_score: opportunity,
      confidence_score: conf,
      google_growth_4w: googleGrowth4w,
      google_growth_8w: googleGrowth8w,
      etsy_saturation_score: competitionScore(etsy.estimatedCompetitionLevel, etsy.listingCount),
      data_quality: quality,
      is_demo_data: signalSource === "fallback_seed",
      first_detected_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * (product.seed - 10)).toISOString(),
      trend_age_weeks: product.seed - 10,
      trend_state: trendState,
      summary,
      tags: product.tags,
      platforms: [
        signalSource === "google_trends" ? "Google Trends" : "Google fallback",
        reddit.source === "reddit_public_json" ? "Reddit" : "Reddit unavailable",
        etsy.source === "etsy_api" ? "Etsy API" : "Etsy estimate",
      ],
      avg_price: etsy.avgPrice || product.avgPrice,
      competition_level: etsy.estimatedCompetitionLevel || product.competitionLevel,
      signal_source: signalSource,
      sparkline: values.slice(-8).map((value) => clamp(value)),
      reddit_mentions_last_7_days: reddit.mentionsLast7Days,
      reddit_mentions_previous_7_days: reddit.mentionsPrevious7Days,
      reddit_growth_rate: reddit.growthRate,
      reddit_source: reddit.source,
      reddit_confidence: reddit.confidence,
      etsy_listing_count: etsy.listingCount,
      etsy_competition_level: etsy.estimatedCompetitionLevel,
      etsy_avg_price: etsy.avgPrice || product.avgPrice,
      etsy_source: etsy.source,
      etsy_confidence: etsy.confidence,
      source_count: sourceCount,
      source_confidence: sourceAgreement,
      score_explanation: scoreExplanation,
      why_trending: whyTrending,
      detected_at: now,
      updated_at: now,
    };
  });
}

function stripEnrichmentColumns(rows) {
  const enrichmentColumns = new Set([
    "reddit_mentions_last_7_days",
    "reddit_mentions_previous_7_days",
    "reddit_growth_rate",
    "reddit_source",
    "reddit_confidence",
    "etsy_listing_count",
    "etsy_competition_level",
    "etsy_avg_price",
    "etsy_source",
    "etsy_confidence",
    "source_count",
    "source_confidence",
    "emergence_score",
    "google_growth_4w",
    "google_growth_8w",
    "etsy_saturation_score",
    "data_quality",
    "is_demo_data",
    "first_detected_at",
    "trend_age_weeks",
    "score_explanation",
    "why_trending",
  ]);

  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).filter(([key]) => !enrichmentColumns.has(key)))
  );
}

function isMissingEnrichmentColumn(error) {
  return /column .* (reddit_|etsy_|source_|emergence_score|google_growth_|data_quality|is_demo_data|first_detected_at|trend_age_weeks|score_explanation|why_trending)/i.test(error.message);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
    process.exit(1);
  }

  const jobId = randomUUID();
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await supabase.from("collection_jobs").insert({
    id: jobId,
    source: "multi_source",
    status: "running",
    started_at: new Date().toISOString(),
  });

  const candidateProducts = await loadVerifiedCandidateProducts(supabase);
  PRODUCTS = mergeProducts(PRODUCTS, candidateProducts);

  const trends = collectGoogleTrends();
  const usingGoogle = trends.ok && trends.series?.some((item) => item.values?.length);
  const [{ results: redditResults, errors: redditErrors }, { results: etsyResults, errors: etsyErrors }] =
    await Promise.all([collectRedditSignals(), collectEtsySignals()]);
  const rows = buildRows(
    usingGoogle ? trends.series : [],
    usingGoogle ? "google_trends" : "fallback_seed",
    redditResults,
    etsyResults
  );
  const runSummary = rows.reduce(
    (summary, row) => {
      if (row.source_type === "from_analysis") summary.fromAnalysis += 1;
      if (row.is_demo_data || row.data_quality === "demo") summary.fallbackDemo += 1;
      if (row.data_quality === "needs_confirmation") summary.needsConfirmation += 1;
      if (!row.is_demo_data && row.source_type !== "from_analysis" && row.source_count >= 2) summary.realDiscovered += 1;
      return summary;
    },
    { realDiscovered: 0, needsConfirmation: 0, fallbackDemo: 0, fromAnalysis: 0 }
  );

  let upsertRows = rows;
  let { error: upsertError } = await supabase.from("trend_signals").upsert(upsertRows, {
    onConflict: "keyword",
  });
  let usedLegacySchemaFallback = false;

  if (upsertError && isMissingEnrichmentColumn(upsertError)) {
    usedLegacySchemaFallback = true;
    upsertRows = stripEnrichmentColumns(rows);
    ({ error: upsertError } = await supabase.from("trend_signals").upsert(upsertRows, {
      onConflict: "keyword",
    }));
  }

  if (upsertError) {
    await supabase.from("collection_jobs").update({
      status: "failed",
      error_message: upsertError.message,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);
    throw upsertError;
  }

  const historyRows = rows.map((row) => ({
    signal_id: row.id,
    keyword: row.keyword,
    trend_value: row.current_trend_value,
    baseline_value: row.baseline_trend_value,
    velocity_score: row.velocity_score,
    acceleration_score: row.acceleration_score,
    opportunity_score: row.opportunity_score,
    confidence_score: row.confidence_score,
    trend_state: row.trend_state,
    signal_source: row.signal_source,
  }));

  const { error: historyError } = await supabase.from("signal_history").insert(historyRows);
  const warningMessages = [
    usingGoogle ? null : trends.error || "pytrends unavailable; used fallback seed data",
    redditErrors.length ? `Reddit fallbacks: ${redditErrors.slice(0, 3).join("; ")}` : null,
    etsyErrors.length ? `Etsy fallbacks: ${etsyErrors.slice(0, 3).join("; ")}` : null,
    usedLegacySchemaFallback ? "New enrichment columns are missing; run scripts/phase-a-b-signal-enrichment.sql" : null,
    historyError ? `History insert failed: ${historyError.message}` : null,
  ].filter(Boolean);

  await supabase.from("collection_jobs").update({
    status: warningMessages.length ? "completed_with_warnings" : "completed",
    error_message: warningMessages.length ? warningMessages.join(" | ") : null,
    signals_collected: rows.length,
    finished_at: new Date().toISOString(),
  }).eq("id", jobId);

  console.log(`Updated ${rows.length} trend signals with Google, Reddit, and Etsy scoring.`);
  console.log(`Candidate keywords: ${candidateProducts.length} verified additions loaded.`);
  console.log(`Google source: ${usingGoogle ? "Google Trends" : "fallback seed data"}.`);
  console.log(`Reddit source: ${redditErrors.length ? "public JSON where available; unavailable otherwise" : "public JSON"}.`);
  console.log(`Etsy source: ${process.env.ETSY_API_KEY ? "official Etsy API" : "fallback estimates"}.`);
  console.log(
    `Signal credibility: ${runSummary.realDiscovered} real discovered, ${runSummary.needsConfirmation} needs confirmation, ${runSummary.fallbackDemo} fallback/demo hidden by default, ${runSummary.fromAnalysis} from analysis.`
  );
  if (warningMessages.length) console.log(`Warnings: ${warningMessages.join(" | ")}`);
}

main().catch((error) => {
  console.error("Signal update failed:", error.message);
  process.exit(1);
});
