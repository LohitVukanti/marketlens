// src/app/watchlist/page.tsx — Personal market watchlist
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/trend-data";
import {
  getAnonymousSessionId,
  getWatchlistItems,
  removeWatchlistItem,
  updateWatchlistThreshold,
} from "@/lib/watchlist";
import type { WatchlistItem } from "@/types";

function alertBadges(item: WatchlistItem) {
  const badges: { label: string; cls: string }[] = [];
  const signal = item.signal;

  if (signal.score >= item.alert_threshold) {
    badges.push({ label: "Threshold triggered", cls: "badge-green" });
  }
  if (signal.direction === "breakout") {
    badges.push({ label: "Breakout", cls: "badge-green" });
  }
  if (signal.weeklyChange >= 10 || signal.momentum >= 15) {
    badges.push({ label: "Rising fast", cls: "badge-blue" });
  }

  return badges;
}

function WatchRow({
  item,
  onRemove,
  onThresholdChange,
}: {
  item: WatchlistItem;
  onRemove: () => void;
  onThresholdChange: (value: number) => void;
}) {
  const signal = item.signal;
  const scoreColor = signal.score >= 80 ? "#10b981" : signal.score >= 60 ? "#f59e0b" : "#ef4444";
  const deltaColor = signal.weeklyChange > 0 ? "#10b981" : signal.weeklyChange < 0 ? "#ef4444" : "#64748b";
  const badges = alertBadges(item);

  return (
    <div className="card p-4 space-y-4 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "var(--bg-hover)" }}
        >
          {CATEGORY_ICONS[signal.category]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {signal.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {CATEGORY_LABELS[signal.category]} · {signal.niche}
          </p>
        </div>
        <div className="text-right flex-shrink-0 w-16">
          <p className="text-xl font-bold mono" style={{ color: scoreColor }}>
            {signal.score}
          </p>
          <p className="text-[10px]" style={{ color: deltaColor }}>
            {signal.weeklyChange >= 0 ? "+" : ""}
            {signal.weeklyChange} wk
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/analyze" className="btn-secondary text-xs px-3 py-1.5">
            Analyze
          </Link>
          <button
            onClick={onRemove}
            className="btn-ghost text-xs px-2 py-1.5"
            style={{ color: "#ef4444" }}
            aria-label={`Remove ${signal.name} from watchlist`}
          >
            x
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Alert threshold
          <input
            className="input-base w-20 text-xs py-1.5"
            type="number"
            min={0}
            max={100}
            value={item.alert_threshold}
            onChange={(event) => onThresholdChange(Number(event.target.value))}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {badges.length ? (
            badges.map((badge) => (
              <span key={badge.label} className={`badge ${badge.cls} text-[10px]`}>
                {badge.label}
              </span>
            ))
          ) : (
            <span className="badge badge-gray text-[10px]">Watching</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const [sessionId, setSessionId] = useState("");
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextSessionId = getAnonymousSessionId();
    setSessionId(nextSessionId);

    getWatchlistItems(nextSessionId)
      .then(setItems)
      .catch((loadError) => {
        console.warn("[watchlist] Unable to load watchlist:", loadError.message);
        setError("Unable to load your watchlist. Confirm the Supabase watchlist_items table exists.");
      })
      .finally(() => setLoading(false));
  }, []);

  const avgScore = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.signal.score, 0) / items.length)
    : 0;
  const alerts = useMemo(() => items.filter((item) => alertBadges(item).length > 0).length, [items]);

  async function handleRemove(item: WatchlistItem) {
    setItems((prev) => prev.filter((nextItem) => nextItem.id !== item.id));
    try {
      await removeWatchlistItem(sessionId, item.signal_id);
    } catch (removeError) {
      setItems((prev) => [item, ...prev]);
      setError(removeError instanceof Error ? removeError.message : "Unable to remove watchlist item.");
    }
  }

  async function handleThresholdChange(item: WatchlistItem, value: number) {
    const alertThreshold = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
    setItems((prev) =>
      prev.map((nextItem) =>
        nextItem.id === item.id ? { ...nextItem, alert_threshold: alertThreshold } : nextItem
      )
    );

    try {
      await updateWatchlistThreshold(item.id, sessionId, alertThreshold);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update threshold.");
    }
  }

  return (
    <AppShell title="Watchlist" subtitle="Track niches and get notified when they move">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
            Tracking
          </p>
          <p className="text-2xl font-bold mono" style={{ color: "var(--accent-bright)" }}>
            {items.length}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            anonymous session
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
            Avg Score
          </p>
          <p className="text-2xl font-bold mono" style={{ color: "#f59e0b" }}>
            {avgScore}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
            Active Alerts
          </p>
          <p className="text-2xl font-bold mono" style={{ color: "#10b981" }}>
            {alerts}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            visual alerts only
          </p>
        </div>
      </div>

      {alerts > 0 && (
        <div
          className="rounded-xl p-4 mb-4 flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <span className="live-dot flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#34d399" }}>
              {alerts} watchlist item{alerts > 1 ? "s" : ""} triggered a visual alert
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Email and Slack alerts stay reserved for a later paid tier.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 mb-4 text-xs"
          style={{ color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.08)" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <p className="text-sm">Loading your watchlist...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <p className="text-3xl mb-3">☆</p>
          <p className="text-sm">Your watchlist is empty. Add niches from the Trend Feed.</p>
          <Link href="/feed" className="btn-primary text-sm mt-4 inline-flex">
            Browse Trend Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <WatchRow
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              onThresholdChange={(value) => handleThresholdChange(item, value)}
            />
          ))}
        </div>
      )}

      <div
        className="mt-6 rounded-xl p-5 text-center border"
        style={{ borderColor: "rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.04)" }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
          Pro later: unlimited watchlists, email alerts, Slack notifications, and weekly score history
        </p>
      </div>
    </AppShell>
  );
}
