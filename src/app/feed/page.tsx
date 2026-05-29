// src/app/feed/page.tsx — Live Trend Feed (the new core page)
"use client";
import { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import TrendCard from "@/components/ui/TrendCard";
import { TREND_SIGNALS, CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/trend-data";
import type { TrendSignal, TrendCategory, TrendDirection } from "@/types";

const DIRECTIONS: { value: TrendDirection | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "breakout", label: "🚀 Breakout" },
  { value: "rising", label: "↑ Rising" },
  { value: "stable", label: "→ Stable" },
  { value: "falling", label: "↓ Cooling" },
];

const SORTS = [
  { value: "score", label: "Opportunity Score" },
  { value: "momentum", label: "Momentum" },
  { value: "new", label: "Newest" },
];

export default function FeedPage() {
  const [dirFilter, setDirFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [watching, setWatching] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats = Array.from(new Set(TREND_SIGNALS.map(s => s.category)));
    return cats;
  }, []);

  const filtered = useMemo(() => {
    let s = [...TREND_SIGNALS];
    if (dirFilter !== "all") s = s.filter(t => t.direction === dirFilter);
    if (catFilter !== "all") s = s.filter(t => t.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.niche.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (sort === "score")    s.sort((a, b) => b.score - a.score);
    if (sort === "momentum") s.sort((a, b) => b.momentum - a.momentum);
    if (sort === "new")      s.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
    return s;
  }, [dirFilter, catFilter, sort, search]);

  const breakouts = TREND_SIGNALS.filter(s => s.direction === "breakout").length;
  const avgScore  = Math.round(TREND_SIGNALS.reduce((s, t) => s + t.score, 0) / TREND_SIGNALS.length);

  function handleWatch(signal: TrendSignal) {
    setWatching(prev => {
      const next = new Set(prev);
      if (next.has(signal.id)) next.delete(signal.id);
      else next.add(signal.id);
      return next;
    });
  }

  return (
    <AppShell title="Trend Feed" subtitle="Live ecommerce opportunity signals · Updated hourly">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Signals Tracked", value: TREND_SIGNALS.length, color: "var(--accent-bright)" },
          { label: "Breakout Niches", value: breakouts, color: "#10b981" },
          { label: "Avg Opp. Score", value: avgScore, color: "#f59e0b" },
          { label: "Watching", value: watching.size, color: "#818cf8" },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-[11px] mb-1 font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-bold mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          className="input-base flex-1 min-w-40 text-xs py-2"
          placeholder="Search niches, tags, categories…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Direction pills */}
        <div className="flex gap-1.5 flex-wrap">
          {DIRECTIONS.map(d => (
            <button key={d.value}
              onClick={() => setDirFilter(d.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                dirFilter === d.value ? "text-white" : ""
              }`}
              style={dirFilter === d.value
                ? { background: "var(--accent)" }
                : { background: "var(--bg-hover)", color: "var(--text-muted)" }}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Category */}
        <select
          className="input-base text-xs py-2 w-auto"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="input-base text-xs py-2 w-auto"
          value={sort}
          onChange={e => setSort(e.target.value)}>
          {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>

        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          {filtered.length} results
        </span>
      </div>

      {/* Feed grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">No signals match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(signal => (
            <TrendCard key={signal.id} signal={signal} onWatch={handleWatch} />
          ))}
        </div>
      )}

      {/* Pro gate banner */}
      <div className="mt-8 rounded-2xl border p-6 text-center"
        style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
          🔒 Pro unlocks real-time alerts, full trend history, and 40+ additional signals
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Free plan shows a 48-hour delayed snapshot. Pro members see signals as they break.
        </p>
        <button className="btn-primary text-sm px-6 py-2.5">Upgrade to Pro — $19/mo</button>
      </div>
    </AppShell>
  );
}
