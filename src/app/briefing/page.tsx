// src/app/briefing/page.tsx — Daily AI Briefing (habit loop engine)
"use client";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { CATEGORY_ICONS, TREND_SIGNALS } from "@/lib/trend-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";
import { getAnonymousSessionId, getWatchlistItems, migrateAnonymousWatchlistToUser, type WatchlistOwner } from "@/lib/watchlist";
import { getCurrentUser, getOrCreateProfile } from "@/lib/auth";
import type { BriefingItem, TrendSignal } from "@/types";
import Link from "next/link";

function BriefingItemCard({ item }: { item: BriefingItem }) {
  const config = {
    opportunity: { icon: "🎯", border: "#10b981", bg: "rgba(16,185,129,0.06)" },
    alert:       { icon: "⚡", border: "#f59e0b", bg: "rgba(245,158,11,0.06)" },
    trend:       { icon: "📈", border: "#6366f1", bg: "rgba(99,102,241,0.06)" },
    risk:        { icon: "⚠️", border: "#ef4444", bg: "rgba(239,68,68,0.06)" },
  }[item.type];

  return (
    <div className="rounded-xl p-4" style={{ border: `1px solid ${config.border}30`, background: config.bg }}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
            {item.score !== undefined && (
              <span className="badge badge-gray text-[10px] mono">{item.score}</span>
            )}
            {item.delta !== undefined && (
              <span className={`text-[10px] font-bold mono ${item.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {item.delta >= 0 ? "+" : ""}{item.delta}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
          {item.niche && (
            <Link href="/analyze" className="inline-flex items-center gap-1 mt-2 text-xs font-medium"
              style={{ color: "var(--accent-bright)" }}>
              Deep analysis → {item.niche}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BriefingPage() {
  const [signals, setSignals] = useState<TrendSignal[]>([]);
  const [source, setSource] = useState<"watchlist" | "global" | "mock">("mock");
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const briefing = useMemo(() => {
    const selectedSignals = signals.length ? signals : TREND_SIGNALS.slice(0, 5);
    const opportunityOfDay = [...selectedSignals].sort((a, b) => b.score - a.score)[0];
    const breakouts = selectedSignals.filter((signal) => signal.direction === "breakout");
    const risers = selectedSignals.filter((signal) => signal.weeklyChange >= 10 || signal.momentum >= 15);
    const cooling = selectedSignals.filter((signal) => signal.direction === "falling" || signal.weeklyChange < 0);
    const topNames = selectedSignals.slice(0, 2).map((signal) => signal.name).join(" · ");

    const items: BriefingItem[] = selectedSignals.slice(0, 5).map((signal) => ({
      type:
        signal.score >= 80
          ? "opportunity"
          : signal.direction === "falling"
            ? "risk"
            : signal.weeklyChange >= 10
              ? "alert"
              : "trend",
      title: `${signal.name} — ${signal.direction === "breakout" ? "Breakout Detected" : signal.weeklyChange >= 10 ? "Rising Fast" : "Signal Update"}`,
      body: signal.summary,
      score: signal.score,
      delta: signal.weeklyChange,
      niche: signal.niche,
    }));

    return {
      headline:
        source === "watchlist"
          ? `Your watched niches: ${topNames}`
          : `Top global opportunities: ${topNames}`,
      summary:
        source === "watchlist"
          ? `${selectedSignals.length} watched signal${selectedSignals.length > 1 ? "s" : ""} are in today's briefing. ${breakouts.length} breakout, ${risers.length} rising fast, ${cooling.length} cooling.`
          : `No watchlist found for this session, so today's briefing uses the highest-scoring global trend signals. ${breakouts.length} breakout signal${breakouts.length === 1 ? "" : "s"} are active.`,
      items,
      opportunityOfDay,
    };
  }, [signals, source]);
  const opp = briefing.opportunityOfDay;
  const oppColor = opp.score >= 80 ? "#10b981" : "#f59e0b";

  useEffect(() => {
    const sessionId = getAnonymousSessionId();

    async function loadBriefingSignals() {
      try {
        const user = await getCurrentUser();
        let owner: WatchlistOwner = { sessionId, plan: "free" };

        if (user) {
          const profile = await getOrCreateProfile(user.id);
          await migrateAnonymousWatchlistToUser(sessionId, user.id);
          owner = { sessionId, userId: user.id, plan: profile.plan };
        }

        const watchedItems = await getWatchlistItems(owner);
        if (watchedItems.length > 0) {
          setSignals(watchedItems.map((item) => item.signal));
          setSource("watchlist");
          return;
        }

        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from("trend_signals")
            .select("*")
            .order("opportunity_score", { ascending: false })
            .limit(5);

          if (error) throw error;

          if (data?.length) {
            setSignals((data as TrendSignalRow[]).map(mapTrendSignalRow));
            setSource("global");
            return;
          }
        }

        setSignals(TREND_SIGNALS.slice(0, 5));
        setSource("mock");
      } catch (error) {
        console.warn("[briefing] Falling back to mock briefing signals:", error);
        setSignals(TREND_SIGNALS.slice(0, 5));
        setSource("mock");
      } finally {
        setLoading(false);
      }
    }

    loadBriefingSignals();
  }, []);

  return (
    <AppShell title="Daily Briefing" subtitle={today}>
      {/* Header card */}
      <div className="rounded-2xl p-6 mb-6" style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))",
        border: "1px solid rgba(99,102,241,0.2)"
      }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="live-dot" />
          <span className="text-xs font-semibold" style={{ color: "var(--accent-bright)" }}>
            AI-Generated · {today}
          </span>
          <span className="badge badge-gray text-[10px]">
            {loading ? "Loading" : source === "watchlist" ? "Watchlist" : source === "global" ? "Global feed" : "Mock fallback"}
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {briefing.headline}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {briefing.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main briefing items */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Today's Intelligence Feed
          </h3>
          {briefing.items.map((item, i) => (
            <BriefingItemCard key={i} item={item} />
          ))}
        </div>

        {/* Sidebar: Opportunity of the Day */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Opportunity of the Day
            </h3>
            <div className="card p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{CATEGORY_ICONS[opp.category]}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{opp.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{opp.niche}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold mono" style={{ color: oppColor }}>{opp.score}</span>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>/100</span>
                <span className="ml-2 text-sm font-bold" style={{ color: "#10b981" }}>+{opp.weeklyChange} ↑</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {opp.summary}
              </p>
              <div className="space-y-1.5 mb-4">
                {[
                  { l: "Avg Price", v: opp.avgPrice },
                  { l: "Competition", v: opp.competitionLevel },
                  { l: "Search Vol", v: opp.searchVolume },
                ].map(r => (
                  <div key={r.l} className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                    <span className="font-medium capitalize" style={{ color: "var(--text-secondary)" }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <Link href="/analyze" className="btn-primary w-full justify-center text-xs py-2.5">
                Run Deep Analysis →
              </Link>
            </div>
          </div>

          {/* Email upgrade */}
          <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.05)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
              📧 Get this in your inbox
            </p>
            <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
              Pro members receive a personalized briefing every morning before 7am based on their watchlist.
            </p>
            <button className="btn-primary w-full justify-center text-xs py-2">
              Unlock Email Briefing
            </button>
          </div>

          {/* Archive notice */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              📅 Briefing Archive
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              30 days of past briefings available on Pro. Compare how niches moved week over week.
            </p>
            <button className="w-full mt-3 text-xs py-2 rounded-lg font-medium"
              style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}>
              View Archive (Pro)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
