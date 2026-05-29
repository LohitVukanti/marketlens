"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import TrendCard from "@/components/ui/TrendCard";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/trend-data";
import {
  addWatchlistItem,
  FREE_WATCHLIST_LIMIT,
  getAnonymousSessionId,
  getWatchedSignalIds,
  migrateAnonymousWatchlistToUser,
  removeWatchlistItem,
  type WatchlistOwner,
} from "@/lib/watchlist";
import { getCurrentUser, getOrCreateProfile } from "@/lib/auth";
import type { TrendDirection, TrendSignal } from "@/types";

const DIRECTIONS: { value: TrendDirection | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "breakout", label: "Breakout" },
  { value: "rising", label: "Rising" },
  { value: "stable", label: "Stable" },
  { value: "falling", label: "Cooling" },
];

const SORTS = [
  { value: "score", label: "Opportunity Score" },
  { value: "momentum", label: "Momentum" },
  { value: "new", label: "Newest" },
];

export default function FeedClient({
  signals,
  dataSource,
}: {
  signals: TrendSignal[];
  dataSource: "supabase" | "mock";
}) {
  const [dirFilter, setDirFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [watching, setWatching] = useState<Set<string>>(new Set());
  const [owner, setOwner] = useState<WatchlistOwner | null>(null);
  const [pendingSignalId, setPendingSignalId] = useState<string | null>(null);
  const [watchError, setWatchError] = useState("");

  useEffect(() => {
    async function loadWatchState() {
      const sessionId = getAnonymousSessionId();
      const user = await getCurrentUser();
      let nextOwner: WatchlistOwner = { sessionId, plan: "free" };

      if (user) {
        const profile = await getOrCreateProfile(user.id);
        await migrateAnonymousWatchlistToUser(sessionId, user.id);
        nextOwner = { sessionId, userId: user.id, plan: profile.plan };
      }

      setOwner(nextOwner);
      setWatching(await getWatchedSignalIds(nextOwner));
    }

    loadWatchState().catch((error) => {
        console.warn("[watchlist] Unable to load watched signals:", error.message);
        setWatchError("Watchlist sync is unavailable. Check the Supabase watchlist table.");
    });
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(signals.map((signal) => signal.category)));
  }, [signals]);

  const filtered = useMemo(() => {
    let next = [...signals];
    if (dirFilter !== "all") next = next.filter((trend) => trend.direction === dirFilter);
    if (catFilter !== "all") next = next.filter((trend) => trend.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      next = next.filter(
        (trend) =>
          trend.name.toLowerCase().includes(q) ||
          trend.niche.toLowerCase().includes(q) ||
          trend.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (sort === "score") next.sort((a, b) => b.score - a.score);
    if (sort === "momentum") next.sort((a, b) => b.momentum - a.momentum);
    if (sort === "new") {
      next.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
    }
    return next;
  }, [dirFilter, catFilter, sort, search, signals]);

  const breakouts = signals.filter((signal) => signal.direction === "breakout").length;
  const avgScore = signals.length
    ? Math.round(signals.reduce((sum, trend) => sum + trend.score, 0) / signals.length)
    : 0;

  async function handleWatch(signal: TrendSignal) {
    if (!owner || pendingSignalId) return;

    const wasWatching = watching.has(signal.id);
    const next = new Set(watching);
    if (wasWatching) next.delete(signal.id);
    else next.add(signal.id);

    setWatching(next);
    setPendingSignalId(signal.id);
    setWatchError("");

    try {
      if (wasWatching) await removeWatchlistItem(owner, signal.id);
      else await addWatchlistItem(owner, signal.id);
    } catch (error) {
      setWatching(watching);
      setWatchError(error instanceof Error ? error.message : "Unable to update watchlist.");
    } finally {
      setPendingSignalId(null);
    }
  }

  return (
    <AppShell title="Trend Feed" subtitle="Live ecommerce opportunity signals · Updated manually in Phase 1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Signals Tracked", value: signals.length, color: "var(--accent-bright)" },
          { label: "Breakout Niches", value: breakouts, color: "#10b981" },
          { label: "Avg Opp. Score", value: avgScore, color: "#f59e0b" },
          { label: "Watching", value: watching.size, color: "#818cf8" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-[11px] mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mono" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          className="input-base flex-1 min-w-40 text-xs py-2"
          placeholder="Search niches, tags, categories..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="flex gap-1.5 flex-wrap">
          {DIRECTIONS.map((direction) => (
            <button
              key={direction.value}
              onClick={() => setDirFilter(direction.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                dirFilter === direction.value ? "text-white" : ""
              }`}
              style={
                dirFilter === direction.value
                  ? { background: "var(--accent)" }
                  : { background: "var(--bg-hover)", color: "var(--text-muted)" }
              }
            >
              {direction.label}
            </button>
          ))}
        </div>

        <select
          className="input-base text-xs py-2 w-auto"
          value={catFilter}
          onChange={(event) => setCatFilter(event.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>

        <select
          className="input-base text-xs py-2 w-auto"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          {SORTS.map((sortOption) => (
            <option key={sortOption.value} value={sortOption.value}>
              Sort: {sortOption.label}
            </option>
          ))}
        </select>

        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          {filtered.length} results · {dataSource === "supabase" ? "Supabase live" : "Mock fallback"}
        </span>
      </div>

      {watchError && (
        <div
          className="rounded-xl p-3 mb-4 text-xs"
          style={{ color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.08)" }}
        >
          {watchError}
        </div>
      )}

      {owner?.plan !== "pro" && watching.size >= FREE_WATCHLIST_LIMIT && (
        <div
          className="rounded-xl p-3 mb-4 text-xs flex flex-wrap gap-2 items-center"
          style={{ color: "var(--text-secondary)", border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)" }}
        >
          <span className="font-semibold" style={{ color: "var(--accent-bright)" }}>
            Free watchlist limit reached.
          </span>
          <span>Remove a signal or upgrade for unlimited tracking.</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
          <p className="text-sm">No signals match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((signal) => (
            <TrendCard
              key={signal.id}
              signal={signal}
              onWatch={handleWatch}
              isWatched={watching.has(signal.id)}
              isUpdating={pendingSignalId === signal.id}
            />
          ))}
        </div>
      )}

      <div
        className="mt-8 rounded-2xl border p-6 text-center"
        style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
          Pro unlocks real-time alerts, full trend history, and additional signals
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Phase 1 uses Google Trends plus Supabase. Monetization is intentionally not wired yet.
        </p>
        <button className="btn-primary text-sm px-6 py-2.5">Upgrade to Pro</button>
      </div>
    </AppShell>
  );
}
