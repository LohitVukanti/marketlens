// src/app/briefing/page.tsx — Daily AI Briefing (habit loop engine)
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { CATEGORY_ICONS, TREND_SIGNALS } from "@/lib/trend-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";
import { getWatchlistItems } from "@/lib/watchlist";
import { getClientWatchlistOwner } from "@/lib/client-owner";
import { reportRequestHeaders } from "@/lib/report-api-client";
import type { BriefingItem, TrendSignal } from "@/types";
import Link from "next/link";

type EmailPreferences = {
  daily_briefing_enabled: boolean;
  email_alerts_enabled: boolean;
};

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
  const router = useRouter();
  const [signals, setSignals] = useState<TrendSignal[]>([]);
  const [source, setSource] = useState<"personalized" | "global" | "mock">("mock");
  const [loading, setLoading] = useState(true);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [emailAuthed, setEmailAuthed] = useState(false);
  const [emailLoading, setEmailLoading] = useState(true);
  const [emailSaving, setEmailSaving] = useState(false);
  const [resendConfigured, setResendConfigured] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
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
        source === "personalized"
          ? `Your MarketLens briefing: ${topNames}`
          : `Top global opportunities: ${topNames}`,
      summary:
        source === "personalized"
          ? `Watched signals appear first, recently analyzed products second, and discovered opportunities third. ${breakouts.length} breakout, ${risers.length} rising fast, ${cooling.length} cooling.`
          : `No watchlist found for this session, so today's briefing uses the highest-scoring global trend signals. ${breakouts.length} breakout signal${breakouts.length === 1 ? "" : "s"} are active.`,
      items,
      opportunityOfDay,
    };
  }, [signals, source]);
  const opp = briefing.opportunityOfDay;
  const oppColor = opp.score >= 80 ? "#10b981" : "#f59e0b";

  useEffect(() => {
    async function loadBriefingSignals() {
      try {
        const owner = await getClientWatchlistOwner();
        const watchedItems = await getWatchlistItems(owner);
        const watchedSignals = watchedItems.map((item) => item.signal);

        if (isSupabaseConfigured()) {
          const analysisResponse = await fetch("/api/trend-signals/my-analyses", {
            headers: await reportRequestHeaders(),
          });
          const analysisPayload = await analysisResponse.json();
          const analysisSignals = analysisResponse.ok && analysisPayload.success
            ? (analysisPayload.signals as TrendSignal[] ?? [])
            : [];

          const { data: globalData, error } = await supabase
            .from("trend_signals")
            .select("*")
            .neq("source_type", "from_analysis")
            .order("opportunity_score", { ascending: false })
            .limit(8);

          if (error) throw error;
          const combined = [
            ...watchedSignals,
            ...analysisSignals,
            ...((globalData ?? []) as TrendSignalRow[]).map(mapTrendSignalRow),
          ];
          const deduped = Array.from(new Map(combined.map((signal) => [signal.id, signal])).values()).slice(0, 8);
          if (deduped.length) {
            setSignals(deduped);
            setSource(watchedSignals.length || analysisSignals.length ? "personalized" : "global");
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

  useEffect(() => {
    async function loadEmailPreferences() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setEmailAuthed(false);
          return;
        }

        setEmailAuthed(true);
        const response = await fetch("/api/profile/preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load email preferences.");

        setEmailPrefs({
          daily_briefing_enabled: Boolean(payload.profile.daily_briefing_enabled),
          email_alerts_enabled: Boolean(payload.profile.email_alerts_enabled),
        });
        setResendConfigured(Boolean(payload.resendConfigured));
      } catch (error) {
        setEmailMessage(error instanceof Error ? error.message : "Could not load email preferences.");
      } finally {
        setEmailLoading(false);
      }
    }

    loadEmailPreferences();
  }, []);

  async function updateEmailPreference(updates: Partial<EmailPreferences>) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      router.push("/login");
      return;
    }

    setEmailSaving(true);
    setEmailMessage("");

    try {
      const response = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update email preferences.");

      setEmailPrefs({
        daily_briefing_enabled: Boolean(payload.profile.daily_briefing_enabled),
        email_alerts_enabled: Boolean(payload.profile.email_alerts_enabled),
      });
      setResendConfigured(Boolean(payload.resendConfigured));
      setEmailMessage("Email preferences updated.");
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : "Could not update email preferences.");
    } finally {
      setEmailSaving(false);
    }
  }

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
            {loading ? "Loading" : source === "personalized" ? "Personalized" : source === "global" ? "Global feed" : "Mock fallback"}
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

          {/* Email preferences */}
          <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.05)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
              Get this in your inbox
            </p>
            <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
              {emailAuthed
                ? resendConfigured
                  ? "Choose which MarketLens emails you want to receive."
                  : "Resend is not configured yet. Preferences can be saved, but email delivery is unavailable."
                : "Log in to save email briefing preferences."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() =>
                  emailAuthed
                    ? updateEmailPreference({
                        daily_briefing_enabled: !emailPrefs?.daily_briefing_enabled,
                      })
                    : router.push("/login")
                }
                disabled={emailSaving || emailLoading}
                className="btn-primary w-full justify-center text-xs py-2"
              >
                {!emailAuthed
                  ? "Log in to enable"
                  : emailPrefs?.daily_briefing_enabled
                    ? "Email briefing enabled"
                    : "Email briefing disabled"}
              </button>
              {emailAuthed && (
                <button
                  onClick={() =>
                    updateEmailPreference({
                      email_alerts_enabled: !emailPrefs?.email_alerts_enabled,
                    })
                  }
                  disabled={emailSaving || emailLoading}
                  className="btn-secondary w-full justify-center text-xs py-2"
                >
                  {emailPrefs?.email_alerts_enabled ? "Alert emails enabled" : "Alert emails disabled"}
                </button>
              )}
            </div>
            <p className="text-[10px] mt-3" style={{ color: resendConfigured ? "#34d399" : "#f59e0b" }}>
              {resendConfigured ? "Email delivery configured" : "Resend not configured / email delivery unavailable"}
            </p>
            {emailMessage && (
              <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                {emailMessage}
              </p>
            )}
          </div>

          {/* Archive notice */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Briefing Archive
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Briefing archive is planned for Pro. MarketLens does not store historical briefing snapshots yet.
            </p>
            <button
              className="w-full mt-3 text-xs py-2 rounded-lg font-medium opacity-70 cursor-not-allowed"
              disabled
              style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}
            >
              Coming soon
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
