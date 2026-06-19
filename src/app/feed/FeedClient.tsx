"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TrendCard from "@/components/ui/TrendCard";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/trend-data";
import {
  addWatchlistItem,
  FREE_WATCHLIST_LIMIT,
  getWatchedSignalIds,
  removeWatchlistItem,
  type WatchlistOwner,
} from "@/lib/watchlist";
import type { TrendDirection, TrendSignal } from "@/types";
import { getClientWatchlistOwner } from "@/lib/client-owner";
import { reportRequestHeaders } from "@/lib/report-api-client";

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

const ORIGINS = [
  { value: "all", label: "All Credible" },
  { value: "discovered", label: "Discovered" },
  { value: "my-analyses", label: "My Analyses" },
];

const QUALITY_FILTERS = [
  { value: "all", label: "All Quality" },
  { value: "verified", label: "Verified" },
  { value: "emerging", label: "Emerging" },
  { value: "needs_confirmation", label: "Needs Confirmation" },
  { value: "demo", label: "Demo/Fallback" },
];

export default function FeedClient({
  signals,
  dataSource,
}: {
  signals: TrendSignal[];
  dataSource: "supabase" | "mock";
}) {
  const searchParams = useSearchParams();
  const [allSignals, setAllSignals] = useState<TrendSignal[]>(signals);
  const [dirFilter, setDirFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [watching, setWatching] = useState<Set<string>>(new Set());
  const [owner, setOwner] = useState<WatchlistOwner | null>(null);
  const [pendingSignalId, setPendingSignalId] = useState<string | null>(null);
  const [deletingSignalId, setDeletingSignalId] = useState<string | null>(null);
  const [watchError, setWatchError] = useState("");
  const showWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    async function loadWatchState() {
      const nextOwner = await getClientWatchlistOwner();
      setOwner(nextOwner);
      setWatching(await getWatchedSignalIds(nextOwner));

      const response = await fetch("/api/trend-signals/my-analyses", {
        headers: await reportRequestHeaders(),
      });
      const payload = await response.json();
      if (response.ok && payload.success && Array.isArray(payload.signals)) {
        setAllSignals((current) => {
          const byId = new Map<string, TrendSignal>();
          [...payload.signals, ...current].forEach((signal) => byId.set(signal.id, signal));
          return Array.from(byId.values());
        });
      }
    }

    loadWatchState().catch((error) => {
        console.warn("[watchlist] Unable to load watched signals:", error.message);
        setWatchError("Watchlist sync is unavailable. Check the Supabase watchlist table.");
    });
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    const signalId = searchParams.get("signal");
    if (q) setSearch(q);
    if (signalId) {
      const signal = allSignals.find((item) => item.id === signalId);
      if (signal) setSearch(signal.name);
    }
  }, [searchParams, allSignals]);

  const categories = useMemo(() => {
    return Array.from(new Set(allSignals.map((signal) => signal.category)));
  }, [allSignals]);

  const filtered = useMemo(() => {
    let next = [...allSignals];
    if (originFilter === "all" || originFilter === "discovered") {
      next = next.filter((trend) => trend.sourceType !== "from_analysis");
    }
    if (originFilter === "my-analyses") {
      next = next.filter(
        (trend) =>
          trend.sourceType === "from_analysis" &&
          Boolean(
            owner &&
              ((owner.userId && trend.createdByUserId === owner.userId) ||
                (owner.sessionId && trend.createdBySessionId === owner.sessionId))
          )
      );
    }
    if (qualityFilter === "all" && dataSource !== "mock") {
      next = next.filter((trend) => !trend.isDemoData && trend.dataQuality !== "demo");
    }
    if (qualityFilter !== "all") {
      next = next.filter((trend) =>
        qualityFilter === "demo"
          ? trend.isDemoData || trend.dataQuality === "demo"
          : trend.dataQuality === qualityFilter
      );
    }
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
    if (sort === "score") {
      const qualityRank = { verified: 4, emerging: 3, needs_confirmation: 2, demo: 1 };
      next.sort((a, b) => {
        const rankDiff =
          (qualityRank[b.dataQuality ?? (b.isDemoData ? "demo" : "needs_confirmation")] ?? 0) -
          (qualityRank[a.dataQuality ?? (a.isDemoData ? "demo" : "needs_confirmation")] ?? 0);
        const sourceDiff = (b.sourceCount ?? 1) - (a.sourceCount ?? 1);
        return rankDiff || sourceDiff || (b.emergenceScore ?? b.score) - (a.emergenceScore ?? a.score);
      });
    }
    if (sort === "momentum") next.sort((a, b) => b.momentum - a.momentum);
    if (sort === "new") {
      next.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
    }
    return next;
  }, [allSignals, dataSource, dirFilter, catFilter, originFilter, qualityFilter, owner, sort, search]);

  const breakouts = allSignals.filter((signal) => signal.direction === "breakout").length;
  const avgScore = allSignals.length
    ? Math.round(allSignals.reduce((sum, trend) => sum + trend.score, 0) / allSignals.length)
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

  function ownsAnalysisSignal(signal: TrendSignal) {
    return Boolean(
      owner &&
        signal.sourceType === "from_analysis" &&
        ((owner.userId && signal.createdByUserId === owner.userId) ||
          (owner.sessionId && signal.createdBySessionId === owner.sessionId))
    );
  }

  async function handleDeleteSignal(signal: TrendSignal) {
    if (!ownsAnalysisSignal(signal) || deletingSignalId) return;
    if (!confirm(`Remove "${signal.name}" from Trend Feed? Your saved report will stay in Saved Reports.`)) return;

    const previousSignals = allSignals;
    const previousWatching = watching;
    setAllSignals((current) => current.filter((item) => item.id !== signal.id));
    setWatching((current) => {
      const next = new Set(current);
      next.delete(signal.id);
      return next;
    });
    setDeletingSignalId(signal.id);
    setWatchError("");

    try {
      const response = await fetch(`/api/trend-signals/${encodeURIComponent(signal.id)}`, {
        method: "DELETE",
        headers: await reportRequestHeaders(),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to remove analysis signal.");
      }
    } catch (error) {
      setAllSignals(previousSignals);
      setWatching(previousWatching);
      setWatchError(error instanceof Error ? error.message : "Unable to remove analysis signal.");
    } finally {
      setDeletingSignalId(null);
    }
  }

  return (
    <AppShell title="Trend Feed" subtitle="Live ecommerce opportunity signals">
      {showWelcome && (
        <div
          className="rounded-2xl border p-4 mb-6"
          style={{ borderColor: "rgba(99,102,241,0.28)", background: "rgba(99,102,241,0.07)" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
            Welcome to the MarketLens beta
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            Start by checking the Trend Feed, running Deep Analysis on a product, and saving or watching anything worth revisiting.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/feed" className="btn-secondary justify-center text-xs py-2">
              Check Trend Feed
            </Link>
            <Link href="/analyze" className="btn-primary justify-center text-xs py-2">
              Run Deep Analysis
            </Link>
            <Link href="/watchlist" className="btn-secondary justify-center text-xs py-2">
              View Watchlist
            </Link>
          </div>
        </div>
      )}
      <div
        className="rounded-2xl border p-4 mb-6 text-xs leading-relaxed"
        style={{ borderColor: "rgba(99,102,241,0.22)", background: "rgba(99,102,241,0.05)", color: "var(--text-secondary)" }}
      >
        <span className="font-semibold" style={{ color: "var(--accent-bright)" }}>
          How to read this feed:
        </span>{" "}
        Signals are ranked by emergence score and confidence. Low-confidence and one-source signals are research leads, not recommendations.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Signals Tracked", value: allSignals.length, color: "var(--accent-bright)" },
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

      <div className="card p-3 mb-6 flex flex-col gap-3 sm:p-4">
        <input
          className="input-base text-xs py-2"
          placeholder="Search niches, tags, categories..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {DIRECTIONS.map((direction) => (
            <button
              key={direction.value}
              onClick={() => setDirFilter(direction.value)}
              className={`flex-shrink-0 text-xs px-3 py-2 rounded-lg font-medium transition-all ${
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="input-base text-xs py-2"
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
            className="input-base text-xs py-2"
            value={originFilter}
            onChange={(event) => setOriginFilter(event.target.value)}
          >
            {ORIGINS.map((origin) => (
              <option key={origin.value} value={origin.value}>
                {origin.label}
              </option>
            ))}
          </select>

          <select
            className="input-base text-xs py-2"
            value={qualityFilter}
            onChange={(event) => setQualityFilter(event.target.value)}
          >
            {QUALITY_FILTERS.map((quality) => (
              <option key={quality.value} value={quality.value}>
                {quality.label}
              </option>
            ))}
          </select>

          <select
            className="input-base text-xs py-2"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            {SORTS.map((sortOption) => (
              <option key={sortOption.value} value={sortOption.value}>
                Sort: {sortOption.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
          <p className="text-sm">
            {dataSource === "mock"
              ? "No demo signals match your filters."
              : "No verified ecommerce trend signals are available yet. Run the collector or loosen the filters."}
          </p>
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
              onDelete={handleDeleteSignal}
              canDelete={ownsAnalysisSignal(signal)}
              isDeleting={deletingSignalId === signal.id}
            />
          ))}
        </div>
      )}

      <div
        className="mt-8 rounded-2xl border p-6 text-center"
        style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
          Pro access is in beta waitlist mode
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Use the product, send feedback, and request Pro access when you know what would make it worth paying for.
        </p>
        <Link href="/upgrade" className="btn-primary text-sm px-6 py-2.5">
          Request Pro Access
        </Link>
      </div>
    </AppShell>
  );
}
