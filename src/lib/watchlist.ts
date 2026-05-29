"use client";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";
import type { WatchlistItem } from "@/types";

const SESSION_STORAGE_KEY = "marketlens_session_id";
const DEFAULT_ALERT_THRESHOLD = 80;

type WatchlistItemRow = {
  id: string;
  session_id: string;
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

export async function getWatchedSignalIds(sessionId: string) {
  if (!isSupabaseConfigured() || !sessionId) return new Set<string>();

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("signal_id")
    .eq("session_id", sessionId);

  if (error) throw error;
  return new Set((data ?? []).map((item) => item.signal_id as string));
}

export async function addWatchlistItem(
  sessionId: string,
  signalId: string,
  alertThreshold = DEFAULT_ALERT_THRESHOLD
) {
  const { error } = await supabase.from("watchlist_items").upsert(
    {
      session_id: sessionId,
      signal_id: signalId,
      alert_threshold: alertThreshold,
    },
    { onConflict: "session_id,signal_id" }
  );

  if (error) throw error;
}

export async function removeWatchlistItem(sessionId: string, signalId: string) {
  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("session_id", sessionId)
    .eq("signal_id", signalId);

  if (error) throw error;
}

export async function getWatchlistItems(sessionId: string): Promise<WatchlistItem[]> {
  if (!isSupabaseConfigured() || !sessionId) return [];

  const { data, error } = await supabase
    .from("watchlist_items")
    .select(
      `
      id,
      session_id,
      signal_id,
      alert_threshold,
      created_at,
      last_alerted_at,
      trend_signals (*)
    `
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

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
  sessionId: string,
  alertThreshold: number
) {
  const { error } = await supabase
    .from("watchlist_items")
    .update({ alert_threshold: alertThreshold })
    .eq("id", itemId)
    .eq("session_id", sessionId);

  if (error) throw error;
}
