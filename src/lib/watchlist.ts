"use client";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";
import type { WatchlistItem } from "@/types";
import type { MarketLensPlan } from "@/lib/auth";

const SESSION_STORAGE_KEY = "marketlens_session_id";
const DEFAULT_ALERT_THRESHOLD = 80;
export const FREE_WATCHLIST_LIMIT = 3;

export type WatchlistOwner = {
  sessionId: string;
  userId?: string | null;
  plan?: MarketLensPlan;
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

export function getAnonymousSessionId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const id =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

function ownerFilter(query: any, owner: WatchlistOwner) {
  if (owner.userId) return query.eq("user_id", owner.userId);
  return query.eq("session_id", owner.sessionId).is("user_id", null);
}

function ownerPayload(owner: WatchlistOwner, signalId: string, alertThreshold = DEFAULT_ALERT_THRESHOLD) {
  return {
    session_id: owner.sessionId,
    user_id: owner.userId ?? null,
    signal_id: signalId,
    alert_threshold: alertThreshold,
  };
}

export async function getWatchedSignalIds(owner: WatchlistOwner): Promise<Set<string>> {
  if (!isSupabaseConfigured() || (!owner.sessionId && !owner.userId)) return new Set<string>();

  const query = supabase
    .from("watchlist_items")
    .select("signal_id");
  const { data, error } = await ownerFilter(query, owner);

  if (error) throw error;
  return new Set((data ?? []).map((item: { signal_id: string }) => item.signal_id));
}

export async function getWatchlistCount(owner: WatchlistOwner) {
  if (!isSupabaseConfigured() || (!owner.sessionId && !owner.userId)) return 0;

  const query = supabase
    .from("watchlist_items")
    .select("id", { count: "exact", head: true });
  const { count, error } = await ownerFilter(query, owner);

  if (error) throw error;
  return count ?? 0;
}

export async function addWatchlistItem(
  owner: WatchlistOwner,
  signalId: string,
  alertThreshold = DEFAULT_ALERT_THRESHOLD
) {
  if (owner.plan !== "pro") {
    const watched = await getWatchedSignalIds(owner);
    if (!watched.has(signalId) && watched.size >= FREE_WATCHLIST_LIMIT) {
      throw new Error(`Free plan watchlists are limited to ${FREE_WATCHLIST_LIMIT} signals.`);
    }
  }

  const onConflict = owner.userId ? "user_id,signal_id" : "session_id,signal_id";
  const { error } = await supabase.from("watchlist_items").upsert(
    ownerPayload(owner, signalId, alertThreshold),
    { onConflict }
  );

  if (error) throw error;
}

export async function removeWatchlistItem(owner: WatchlistOwner, signalId: string) {
  const query = supabase
    .from("watchlist_items")
    .delete()
    .eq("signal_id", signalId);
  const { error } = await ownerFilter(query, owner);

  if (error) throw error;
}

export async function getWatchlistItems(owner: WatchlistOwner): Promise<WatchlistItem[]> {
  if (!isSupabaseConfigured() || (!owner.sessionId && !owner.userId)) return [];

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
  const { data, error } = await ownerFilter(query, owner).order("created_at", { ascending: false });

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

export async function updateWatchlistThreshold(
  itemId: string,
  owner: WatchlistOwner,
  alertThreshold: number
) {
  const query = supabase
    .from("watchlist_items")
    .update({ alert_threshold: alertThreshold })
    .eq("id", itemId);
  const { error } = await ownerFilter(query, owner);

  if (error) throw error;
}

export async function migrateAnonymousWatchlistToUser(sessionId: string, userId: string) {
  if (!isSupabaseConfigured() || !sessionId || !userId) return;

  const anonymousItems = await getWatchlistItems({ sessionId });
  if (!anonymousItems.length) return;
  const userSignalIds = await getWatchedSignalIds({ sessionId, userId });

  for (const item of anonymousItems) {
    if (userSignalIds.has(item.signal_id)) {
      const { error: deleteDuplicateError } = await supabase
        .from("watchlist_items")
        .delete()
        .eq("id", item.id)
        .eq("session_id", sessionId)
        .is("user_id", null);

      if (deleteDuplicateError) throw deleteDuplicateError;
      continue;
    }

    const { error: updateError } = await supabase
      .from("watchlist_items")
      .update({ user_id: userId })
      .eq("id", item.id)
      .eq("session_id", sessionId)
      .is("user_id", null);

    if (updateError) throw updateError;
  }
}
