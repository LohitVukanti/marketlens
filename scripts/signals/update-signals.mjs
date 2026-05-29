import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

dotenv.config({ path: ".env.local" });

const PRODUCTS = [
  ["mushroom lamp", "Ambient Lighting / Home Decor", "home-decor", "$28-$65", "low", ["cottagecore", "aesthetic", "lighting"]],
  ["crochet cup holder", "Drinkware Accessories", "apparel", "$12-$35", "low", ["crochet", "accessories", "giftable"]],
  ["custom pet portrait", "Digital Art / Pet Products", "pets", "$15-$45", "medium", ["pets", "personalized", "digital download"]],
  ["suncatcher window hanging", "Home Decor / Crystal", "home-decor", "$18-$55", "low", ["crystals", "rainbow", "decor"]],
  ["digital planner goodnotes", "Digital Products / Stationery", "digital-products", "$8-$24", "medium", ["planner", "GoodNotes", "digital"]],
  ["sourdough starter kit", "Food & Beverage / Kitchen", "food-beverage", "$18-$42", "medium", ["sourdough", "baking", "DIY"]],
  ["fitness tracker spreadsheet", "Digital Products / Fitness", "fitness", "$5-$19", "low", ["fitness", "spreadsheet", "tracker"]],
  ["notion ai template", "Digital Products / Productivity", "digital-products", "$9-$37", "high", ["notion", "AI", "productivity"]],
].map(([keyword, niche, category, avgPrice, competitionLevel, tags]) => ({
  keyword,
  niche,
  category,
  avgPrice,
  competitionLevel,
  tags,
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

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function fallbackSeries(seed) {
  const base = 18 + seededRand(seed) * 42;
  const slope = -2 + seededRand(seed + 7) * 12;
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

function confidence(values, source) {
  const coverage = (values.filter(Boolean).length / Math.max(values.length, 1)) * 100;
  return clamp(coverage * 0.72 + (source === "google_trends" ? 18 : 6));
}

function scoreFor(current, velocity, acceleration, conf, competition) {
  const competitionBoost = { low: 14, medium: 5, high: -8 }[competition];
  return clamp(current * 0.36 + velocity * 0.8 + acceleration * 0.45 + conf * 0.18 + competitionBoost);
}

function titleCase(value) {
  return value.replace(/\\b\\w/g, (char) => char.toUpperCase());
}

function rowId(keyword) {
  return keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

function buildRows(series, source) {
  const now = new Date().toISOString();

  return PRODUCTS.map((product, index) => {
    const found = series.find((item) => item.keyword === product.keyword && item.values?.length);
    const values = found ? found.values : fallbackSeries(index + 11);
    const signalSource = found?.source || source;
    const recent = values.slice(-3);
    const previous = values.slice(-6, -3);
    const current = clamp(avg(recent));
    const baseline = clamp(avg(values.slice(0, Math.max(values.length - 3, 1))));
    const velocity = clamp(current - baseline, -100, 100);
    const acceleration = clamp(avg(recent) - avg(previous), -100, 100);
    const conf = confidence(values, signalSource);
    const trendState = stateFor(current, velocity, acceleration, baseline);
    const opportunity = scoreFor(current, velocity, acceleration, conf, product.competitionLevel);
    const summary = `${signalSource === "google_trends" ? "Google Trends interest" : "Fallback demo trend model"} puts ${product.keyword} at ${current}/100 versus a ${baseline}/100 baseline. Velocity is ${velocity}, acceleration is ${acceleration}, and the current state is ${trendState}. Confidence is ${conf}/100.`;

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
      confidence_score: conf,
      trend_state: trendState,
      summary,
      tags: product.tags,
      platforms: ["Google Trends", "Supabase"],
      avg_price: product.avgPrice,
      competition_level: product.competitionLevel,
      signal_source: signalSource,
      sparkline: values.slice(-8).map((value) => clamp(value)),
      detected_at: now,
      updated_at: now,
    };
  });
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
    process.exit(1);
  }

  const jobId = crypto.randomUUID();
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await supabase.from("collection_jobs").insert({
    id: jobId,
    source: "google_trends",
    status: "running",
    started_at: new Date().toISOString(),
  });

  const trends = collectGoogleTrends();
  const usingGoogle = trends.ok && trends.series?.some((item) => item.values?.length);
  const rows = buildRows(usingGoogle ? trends.series : [], usingGoogle ? "google_trends" : "fallback_seed");

  const { error: upsertError } = await supabase.from("trend_signals").upsert(rows, {
    onConflict: "keyword",
  });

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

  await supabase.from("collection_jobs").update({
    status: historyError ? "completed_with_warnings" : "completed",
    error_message: usingGoogle ? null : trends.error || "pytrends unavailable; used fallback seed data",
    signals_collected: rows.length,
    finished_at: new Date().toISOString(),
  }).eq("id", jobId);

  if (historyError) {
    console.warn(`Signals updated, but history insert failed: ${historyError.message}`);
  }

  console.log(`Updated ${rows.length} trend signals using ${usingGoogle ? "Google Trends" : "fallback seed data"}.`);
  if (!usingGoogle && trends.error) console.log(`Collector fallback reason: ${trends.error}`);
}

main().catch((error) => {
  console.error("Signal update failed:", error.message);
  process.exit(1);
});
