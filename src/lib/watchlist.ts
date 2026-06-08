"use client";

import { supabase } from "@/lib/supabase";
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

async function watchlistRequest(owner: WatchlistOwner, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init?.headers);
  headers.set("X-MarketLens-Session-Id", owner.sessionId);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch("/api/watchlist", {
    ...init,
    headers,
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Watchlist request failed.");
  }

  return payload;
}

export async function getWatchedSignalIds(owner: WatchlistOwner): Promise<Set<string>> {
  if (!owner.sessionId && !owner.userId) return new Set<string>();
  const payload = await watchlistRequest(owner);
  return new Set((payload.signalIds ?? []) as string[]);
}

export async function getWatchlistCount(owner: WatchlistOwner) {
  if (!owner.sessionId && !owner.userId) return 0;
  const payload = await watchlistRequest(owner);
  return Number(payload.count ?? 0);
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

  await watchlistRequest(owner, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signalId, alertThreshold }),
  });
}

export async function removeWatchlistItem(owner: WatchlistOwner, signalId: string) {
  await watchlistRequest(owner, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signalId }),
  });
}

export async function getWatchlistItems(owner: WatchlistOwner): Promise<WatchlistItem[]> {
  if (!owner.sessionId && !owner.userId) return [];
  const payload = await watchlistRequest(owner);
  return (payload.items ?? []) as WatchlistItem[];
}

export async function updateWatchlistThreshold(
  itemId: string,
  owner: WatchlistOwner,
  alertThreshold: number
) {
  await watchlistRequest(owner, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, alertThreshold }),
  });
}

export async function migrateAnonymousWatchlistToUser(sessionId: string, userId: string) {
  if (!sessionId || !userId) return;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;

  const response = await fetch("/api/watchlist/migrate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-MarketLens-Session-Id": sessionId,
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Could not migrate anonymous watchlist.");
  }
}
