import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";
import type { WatchlistItem } from "@/types";

export const FREE_WATCHLIST_LIMIT = 3;
const DEFAULT_ALERT_THRESHOLD = 80;

export type WatchlistRequestOwner = {
  sessionId: string;
  userId?: string | null;
};

type WatchlistItemRow = {
  id: string;
  session_id: string;
  user_id: string | null;
  signal_id: string;
  alert_threshold: number;
  created_at: string;
  last_alerted_at: string | null;
  trend_signals: TrendSignalRow | TrendSignalRow[] | null;
};

export async function getWatchlistOwnerFromRequest(req: NextRequest): Promise<WatchlistRequestOwner | null> {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  const sessionId = req.headers.get("x-marketlens-session-id")?.trim() ?? "";

  if (!user && !sessionId) return null;
  return {
    sessionId,
    userId: user?.id ?? null,
  };
}

export function watchlistOwnerFilter(query: any, owner: WatchlistRequestOwner) {
  if (owner.userId) return query.eq("user_id", owner.userId);
  return query.eq("session_id", owner.sessionId).is("user_id", null);
}

export function watchlistOwnerPayload(
  owner: WatchlistRequestOwner,
  signalId: string,
  alertThreshold = DEFAULT_ALERT_THRESHOLD
) {
  return {
    session_id: owner.sessionId,
    user_id: owner.userId ?? null,
    signal_id: signalId,
    alert_threshold: alertThreshold,
  };
}

export async function getPlan(userId?: string | null) {
  if (!userId) return "free";

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.plan === "pro" ? "pro" : "free";
}

export async function watchedSignalIds(owner: WatchlistRequestOwner) {
  const supabase = createServerSupabase();
  const query = supabase.from("watchlist_items").select("signal_id");
  const { data, error } = await watchlistOwnerFilter(query, owner);

  if (error) throw error;
  return new Set((data ?? []).map((item: { signal_id: string }) => item.signal_id));
}

export async function watchlistCount(owner: WatchlistRequestOwner) {
  const supabase = createServerSupabase();
  const query = supabase.from("watchlist_items").select("id", { count: "exact", head: true });
  const { count, error } = await watchlistOwnerFilter(query, owner);

  if (error) throw error;
  return count ?? 0;
}

export async function canAccessSignal(signalId: string, owner: WatchlistRequestOwner) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("trend_signals")
    .select("id, source_type, created_by_user_id, created_by_session_id")
    .eq("id", signalId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;
  if (data.source_type !== "from_analysis") return true;
  if (owner.userId && data.created_by_user_id === owner.userId) return true;
  return Boolean(owner.sessionId && data.created_by_session_id === owner.sessionId);
}

export async function addWatchlistSignal(
  owner: WatchlistRequestOwner,
  signalId: string,
  alertThreshold = DEFAULT_ALERT_THRESHOLD
) {
  if (!(await canAccessSignal(signalId, owner))) {
    return NextResponse.json({ success: false, error: "Signal not found or access denied." }, { status: 404 });
  }

  const watched = await watchedSignalIds(owner);
  const plan = await getPlan(owner.userId);

  if (plan !== "pro" && !watched.has(signalId) && watched.size >= FREE_WATCHLIST_LIMIT) {
    return NextResponse.json(
      { success: false, error: `Free plan watchlists are limited to ${FREE_WATCHLIST_LIMIT} signals.` },
      { status: 403 }
    );
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.from("watchlist_items").upsert(
    watchlistOwnerPayload(owner, signalId, alertThreshold),
    { onConflict: owner.userId ? "user_id,signal_id" : "session_id,signal_id" }
  );

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function getWatchlistRows(owner: WatchlistRequestOwner) {
  const supabase = createServerSupabase();
  const query = supabase
    .from("watchlist_items")
    .select(
      `
      id,
      session_id,
      user_id,
      signal_id,
      alert_threshold,
      created_at,
      last_alerted_at,
      trend_signals (*)
    `
    );

  const { data, error } = await watchlistOwnerFilter(query, owner).order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as WatchlistItemRow[])
    .map((item) => {
      const signalRow = Array.isArray(item.trend_signals)
        ? item.trend_signals[0]
        : item.trend_signals;

      if (!signalRow) return null;

      return {
        id: item.id,
        session_id: item.session_id,
        user_id: item.user_id,
        signal_id: item.signal_id,
        alert_threshold: item.alert_threshold,
        created_at: item.created_at,
        last_alerted_at: item.last_alerted_at,
        signal: mapTrendSignalRow(signalRow),
      };
    })
    .filter((item): item is WatchlistItem => Boolean(item));
}
