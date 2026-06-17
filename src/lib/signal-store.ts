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

function mockModeEnabled() {
  return process.env.NEXT_PUBLIC_MOCK_MODE === "true";
}

export async function getFeedSignals(): Promise<FeedSignalResult> {
  if (!hasSupabaseEnv()) {
    return mockModeEnabled() ? { signals: TREND_SIGNALS, source: "mock" } : { signals: [], source: "supabase" };
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

  const { data: discoveredData, error: discoveredError } = await supabase
    .from("trend_signals")
    .select("*")
    .neq("source_type", "from_analysis")
    .order("opportunity_score", { ascending: false })
    .limit(150);

  if (discoveredError) {
    console.warn(
      "[signals] Falling back to legacy trend feed query:",
      discoveredError.message
    );

    const { data, error } = await supabase
      .from("trend_signals")
      .select("*")
      .order("opportunity_score", { ascending: false })
      .limit(250);

    if (error) {
      console.warn("[signals] Falling back to mock trend feed:", error.message);
      return mockModeEnabled() ? { signals: TREND_SIGNALS, source: "mock" } : { signals: [], source: "supabase" };
    }

    if (!data?.length) {
      return mockModeEnabled() ? { signals: TREND_SIGNALS, source: "mock" } : { signals: [], source: "supabase" };
    }

    return { signals: (data as TrendSignalRow[]).map(mapTrendSignalRow), source: "supabase" };
  }

  const rowsById = new Map<string, TrendSignalRow>();
  [...(discoveredData ?? [])].forEach((row) => {
    rowsById.set((row as TrendSignalRow).id, row as TrendSignalRow);
  });
  const rows = Array.from(rowsById.values());

  if (!rows.length) {
    return mockModeEnabled() ? { signals: TREND_SIGNALS, source: "mock" } : { signals: [], source: "supabase" };
  }

  const signals = rows
    .map(mapTrendSignalRow)
    .filter((signal) => mockModeEnabled() || !signal.isDemoData);

  return { signals, source: "supabase" };
}
