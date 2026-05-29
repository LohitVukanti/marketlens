// src/app/watchlist/page.tsx — Personal market watchlist
"use client";
import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { TREND_SIGNALS, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/trend-data";
import type { TrendSignal } from "@/types";
import Link from "next/link";

// Default watchlist seeded with a couple signals for demo
const DEFAULT_WATCH = TREND_SIGNALS.slice(0, 3);

function WatchRow({ signal, onRemove }: { signal: TrendSignal; onRemove: () => void }) {
  const scoreColor = signal.score >= 80 ? "#10b981" : signal.score >= 60 ? "#f59e0b" : "#ef4444";
  const deltaColor = signal.weeklyChange > 0 ? "#10b981" : signal.weeklyChange < 0 ? "#ef4444" : "#64748b";

  return (
    <div className="card p-4 flex items-center gap-4 hover:border-white/10 transition-all">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: "var(--bg-hover)" }}>
        {CATEGORY_ICONS[signal.category]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{signal.name}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{CATEGORY_LABELS[signal.category]}</p>
      </div>
      {/* Score */}
      <div className="text-right flex-shrink-0 w-16">
        <p className="text-xl font-bold mono" style={{ color: scoreColor }}>{signal.score}</p>
        <p className="text-[10px]" style={{ color: deltaColor }}>
          {signal.weeklyChange >= 0 ? "+" : ""}{signal.weeklyChange} wk
        </p>
      </div>
      {/* Direction badge */}
      <div className="flex-shrink-0 w-24 text-center">
        <span className={`badge text-[10px] ${
          signal.direction === "breakout" ? "badge-green" :
          signal.direction === "rising"   ? "badge-blue"  :
          signal.direction === "falling"  ? "badge-red"   : "badge-gray"
        }`}>
          {signal.direction === "breakout" ? "🚀 Breakout" :
           signal.direction === "rising"   ? "↑ Rising"    :
           signal.direction === "falling"  ? "↓ Cooling"   : "→ Stable"}
        </span>
      </div>
      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <Link href="/analyze" className="btn-secondary text-xs px-3 py-1.5">Analyze</Link>
        <button onClick={onRemove} className="btn-ghost text-xs px-2 py-1.5"
          style={{ color: "#ef4444" }}>✕</button>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const [items, setItems] = useState<TrendSignal[]>(DEFAULT_WATCH);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const searchResults = TREND_SIGNALS.filter(s =>
    !items.find(i => i.id === s.id) &&
    (s.name.toLowerCase().includes(query.toLowerCase()) ||
     s.niche.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  function addItem(s: TrendSignal) {
    setItems(prev => [s, ...prev]);
    setAdding(false);
    setQuery("");
  }
  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const avgScore = items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0;
  const alerts   = items.filter(i => i.direction === "breakout" || i.weeklyChange >= 10).length;

  return (
    <AppShell title="Watchlist" subtitle="Track niches and get notified when they move">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Tracking</p>
          <p className="text-2xl font-bold mono" style={{ color: "var(--accent-bright)" }}>{items.length}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>of 1 free · 10 on Pro</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Avg Score</p>
          <p className="text-2xl font-bold mono" style={{ color: "#f59e0b" }}>{avgScore}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Active Alerts</p>
          <p className="text-2xl font-bold mono" style={{ color: "#10b981" }}>{alerts}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Pro: email alerts</p>
        </div>
      </div>

      {/* Alert banner */}
      {alerts > 0 && (
        <div className="rounded-xl p-4 mb-4 flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span className="live-dot flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#34d399" }}>
              {alerts} watchlist item{alerts > 1 ? "s" : ""} triggered alert threshold
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Upgrade to Pro to receive instant email + Slack notifications
            </p>
          </div>
          <button className="btn-primary text-xs px-4 py-2 ml-auto flex-shrink-0">Enable Alerts</button>
        </div>
      )}

      {/* Add item */}
      <div className="card p-4 mb-4">
        {!adding ? (
          <button onClick={() => setAdding(true)} className="w-full text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
            style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}>
            <span>+</span> Add niche to watchlist
          </button>
        ) : (
          <div className="space-y-3">
            <input className="input-base text-sm" autoFocus
              placeholder="Search niches to track…"
              value={query} onChange={e => setQuery(e.target.value)} />
            {query && searchResults.map(s => (
              <button key={s.id} onClick={() => addItem(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                style={{ background: "var(--bg-hover)" }}>
                <span className="text-lg">{CATEGORY_ICONS[s.category]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.niche}</p>
                </div>
                <span className="text-sm font-bold mono" style={{ color: "#f59e0b" }}>{s.score}</span>
              </button>
            ))}
            <div className="flex gap-2">
              <button onClick={() => { setAdding(false); setQuery(""); }} className="btn-secondary text-xs flex-1">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Watchlist items */}
      {items.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <p className="text-3xl mb-3">☆</p>
          <p className="text-sm">Your watchlist is empty. Add niches from the Trend Feed.</p>
          <Link href="/feed" className="btn-primary text-sm mt-4 inline-flex">Browse Trend Feed</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <WatchRow key={item.id} signal={item} onRemove={() => removeItem(item.id)} />
          ))}
        </div>
      )}

      {/* Pro gate */}
      <div className="mt-6 rounded-xl p-5 text-center border"
        style={{ borderColor: "rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.04)" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
          🔒 Pro: Unlimited watchlist · Email alerts · Slack notifications · Weekly score history
        </p>
        <button className="btn-primary text-xs mt-3 px-5 py-2">Upgrade to Pro — $19/mo</button>
      </div>
    </AppShell>
  );
}
