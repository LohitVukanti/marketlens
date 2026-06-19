// src/components/ui/TrendCard.tsx
// The core card for trend signal display in the feed.
"use client";
import Link from "next/link";
import type { TrendSignal } from "@/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/trend-data";

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return <div className="w-20 h-8" />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80; const h = 32; const pts = data.length;
  const points = data.map((v, i) => {
    const x = (i / (pts - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const color = last >= prev ? "#10b981" : "#ef4444";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9" />
      <circle cx={(w)} cy={h - ((last - min) / range) * h} r="2.5" fill={color} />
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

const DIRECTION_CONFIG = {
  breakout: { label: "Breakout 🚀", cls: "badge-green" },
  rising:   { label: "Rising ↑",    cls: "badge-blue" },
  stable:   { label: "Stable →",    cls: "badge-gray" },
  falling:  { label: "Cooling ↓",   cls: "badge-red" },
};
const COMP_CONFIG = {
  low:    { label: "Low Competition",    cls: "badge-green" },
  medium: { label: "Med Competition",    cls: "badge-amber" },
  high:   { label: "High Competition",   cls: "badge-red" },
};

const QUALITY_CONFIG = {
  verified: { label: "Verified", cls: "badge-green" },
  emerging: { label: "Emerging", cls: "badge-blue" },
  needs_confirmation: { label: "Needs Confirmation", cls: "badge-amber" },
  demo: { label: "Demo/Fallback", cls: "badge-gray" },
};

function formatGrowth(value?: number) {
  if (typeof value !== "number") return "n/a";
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
}

function formatListingCount(value?: number) {
  if (typeof value !== "number") return "n/a";
  return value.toLocaleString();
}

export default function TrendCard({
  signal,
  onWatch,
  isWatched = false,
  isUpdating = false,
  onDelete,
  canDelete = false,
  isDeleting = false,
}: {
  signal: TrendSignal;
  onWatch?: (s: TrendSignal) => void;
  isWatched?: boolean;
  isUpdating?: boolean;
  onDelete?: (s: TrendSignal) => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}) {
  const dir = DIRECTION_CONFIG[signal.direction];
  const comp = COMP_CONFIG[signal.competitionLevel];
  const quality = QUALITY_CONFIG[signal.dataQuality ?? (signal.isDemoData ? "demo" : "needs_confirmation")];
  const displayScore = signal.emergenceScore ?? signal.score;
  const scoreColor = displayScore >= 80 ? "#10b981" : displayScore >= 60 ? "#f59e0b" : "#ef4444";
  const updatedAt = signal.lastUpdatedAt || signal.detectedAt;

  return (
    <div className="card-hover rounded-2xl p-5 animate-in flex flex-col gap-4">
      {/* Row 1: icon + name + score + sparkline */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "var(--bg-hover)" }}>
          {CATEGORY_ICONS[signal.category] || "📊"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{signal.name}</h3>
            <span className={`badge ${dir.cls} text-[10px]`}>{dir.label}</span>
            <span className={`badge ${signal.sourceType === "from_analysis" ? "badge-purple" : "badge-gray"} text-[10px]`}>
              {signal.sourceType === "from_analysis" ? "From Analysis" : "Discovered"}
            </span>
            <span className={`badge ${quality.cls} text-[10px]`}>{quality.label}</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {CATEGORY_LABELS[signal.category]} · {signal.niche}
          </p>
        </div>
        {/* Score + sparkline */}
        <div className="flex items-center justify-between gap-4 flex-shrink-0 sm:justify-start">
          <Sparkline data={signal.sparkline} />
          <div className="text-right">
            <div className="text-2xl font-bold mono" style={{ color: scoreColor }}>{displayScore}</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Emergence
            </div>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar score={displayScore} />

      {/* Summary */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {signal.whyTrending || signal.summary}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2" style={{ background: "var(--bg-hover)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
            Google Trends
          </p>
          <p className="text-xs font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {signal.googleGrowth4w !== undefined ? formatGrowth(signal.googleGrowth4w) : `${signal.velocityScore ?? signal.momentum} pts`}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            8w {signal.googleGrowth8w !== undefined ? formatGrowth(signal.googleGrowth8w) : "n/a"} · accel {signal.accelerationScore ?? "n/a"}
          </p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--bg-hover)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
            Reddit {signal.redditSource === "reddit_public_json" ? "" : signal.redditSource === "unavailable" ? "(unavailable)" : "(estimate)"}
          </p>
          <p className="text-xs font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {signal.redditSource === "reddit_public_json"
              ? `${signal.redditMentionsLast7Days ?? 0} mentions`
              : "Unavailable"}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {signal.redditSource === "reddit_public_json"
              ? `${formatGrowth(signal.redditGrowthRate)} vs prev 7d`
              : "Needs Reddit confirmation"}
          </p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--bg-hover)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
            Etsy {signal.etsySource === "etsy_api" ? "(API)" : "(estimate)"}
          </p>
          <p className="text-xs font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {signal.etsySource === "etsy_api"
              ? `${formatListingCount(signal.etsyListingCount)} listings`
              : "Estimate only"}
          </p>
          <p className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>
            {signal.etsySource === "etsy_api"
              ? `${signal.etsyCompetitionLevel || signal.competitionLevel} competition · sat ${signal.etsySaturationScore ?? "n/a"}`
              : "Configure Etsy API to verify"}
          </p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--bg-hover)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
            Confidence
          </p>
          <p className="text-xs font-semibold mono" style={{ color: "var(--text-primary)" }}>
            {signal.confidenceScore ?? 0}/100
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {signal.sourceCount ?? 1} source{(signal.sourceCount ?? 1) === 1 ? "" : "s"} · {signal.sourceConfidence ?? 0} agreement
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className={`badge ${comp.cls} text-[10px]`}>{comp.label}</span>
        <span className="badge badge-gray text-[10px]">Avg {signal.avgPrice}</span>
        <span className="badge badge-gray text-[10px]">Vol: {signal.searchVolume}</span>
        {typeof signal.confidenceScore === "number" && (
          <span className="badge badge-gray text-[10px]">Conf: {signal.confidenceScore}</span>
        )}
        {signal.trendState && (
          <span className="badge badge-blue text-[10px]">{signal.trendState}</span>
        )}
        <span className="badge badge-gray text-[10px]">
          Age {signal.trendAgeWeeks ?? "n/a"}w
        </span>
        <span className="badge badge-gray text-[10px]">
          Updated {updatedAt ? new Date(updatedAt).toLocaleDateString() : "n/a"}
        </span>
        {signal.platforms.map(p => (
          <span key={p} className="badge badge-purple text-[10px]">{p}</span>
        ))}
        {signal.tags.slice(0, 2).map(t => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}>#{t}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 border-t sm:flex-row" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => onWatch?.(signal)}
          disabled={isUpdating}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
            isWatched
              ? "text-indigo-300 border border-indigo-500/30"
              : "btn-secondary"
          }`}
          style={isWatched ? { background: "rgba(99,102,241,0.1)" } : {}}>
          {isUpdating ? "Saving..." : isWatched ? "★ Watching" : "☆ Add to Watchlist"}
        </button>
        <Link
          href={
            signal.reportId
              ? `/dashboard?report=${encodeURIComponent(signal.reportId)}`
              : `/analyze?niche=${encodeURIComponent(signal.keyword || signal.name)}`
          }
          className="btn-primary justify-center text-xs px-4 py-2"
        >
          {signal.reportId ? "Open Analysis" : "Run Deep Analysis"}
        </Link>
        {canDelete && (
          <button
            onClick={() => onDelete?.(signal)}
            disabled={isDeleting}
            className="btn-ghost justify-center text-xs border border-red-500/20 px-3 py-2"
            style={{ color: "#f87171" }}
          >
            {isDeleting ? "Removing..." : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}
