import { createClient } from "@supabase/supabase-js";
import type { TrendSignal } from "@/types";
import { TREND_SIGNALS } from "@/lib/trend-data";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";

export type FeedSignalResult = {
  signals: TrendSignal[];
  source: "supabase" | "mock";
};

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export async function getFeedSignals(): Promise<FeedSignalResult> {
  if (!hasSupabaseEnv()) {
    return { signals: TREND_SIGNALS, source: "mock" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase
    .from("trend_signals")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("[signals] Falling back to mock trend feed:", error.message);
    return { signals: TREND_SIGNALS, source: "mock" };
  }

  if (!data?.length) {
    return { signals: TREND_SIGNALS, source: "mock" };
  }

  return { signals: (data as TrendSignalRow[]).map(mapTrendSignalRow), source: "supabase" };
}
