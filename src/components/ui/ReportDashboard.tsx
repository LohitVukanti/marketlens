// ============================================================
// src/components/ui/ReportDashboard.tsx
// Full dashboard that renders a SavedReport.
// Includes all sections, export buttons, charts.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { SavedReport } from "@/types";
import { getScoreBand, getScoreLabel } from "@/types";
import { formatDate, downloadReportJSON, buildReportText, cn, getScoreColors } from "@/lib/utils";
import {
  Badge,
  SectionCard,
  ScoreRing,
  ProseBlock,
  FactorBar,
  AlertBox,
} from "@/components/ui";
import {
  OpportunityRadar,
  OpportunityBarChart,
} from "@/components/charts/OpportunityCharts";
import { trackReportInFeed } from "@/lib/report-tracking";

// ---- PDF export (lazy loaded to avoid SSR issues) -----------
async function exportToPDF(report: SavedReport) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const d = report.report_data;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const addText = (text: string, size: number, isBold = false, color = [30, 30, 50]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * (size * 1.5);
  };

  const section = (title: string) => {
    y += 16;
    if (y > 760) { doc.addPage(); y = margin; }
    addText(title, 11, true, [79, 70, 229]);
    y += 4;
  };

  // Header
  addText("MARKETLENS — MARKET INTELLIGENCE REPORT", 16, true, [15, 15, 40]);
  y += 6;
  addText(`${report.niche} · ${report.location}`, 10, false, [100, 100, 120]);
  addText(`Score: ${d.marketScore}/100 — ${getScoreLabel(d.marketScore)}`, 12, true, [15, 15, 40]);
  addText(`Generated: ${formatDate(report.created_at)}`, 9, false, [150, 150, 170]);
  y += 12;

  section("EXECUTIVE SUMMARY");
  addText(d.summary, 9);

  section("TARGET CUSTOMER PROFILE");
  addText(d.targetCustomer, 9);

  section("PRICING RECOMMENDATION");
  addText(d.pricingRecommendation, 9);

  section("CUSTOMER PAIN POINTS");
  (d.customerPainPoints ?? []).forEach((p, i) => addText(`${i + 1}. ${p}`, 9));

  section("DEMAND TREND");
  addText(d.demandTrend, 9);

  section("DIFFERENTIATION STRATEGY");
  addText(d.differentiationStrategy, 9);

  section("MARKETING CHANNELS");
  (d.marketingChannels ?? []).forEach((c) => addText(`• ${c}`, 9));

  section("RISKS");
  (d.risks ?? []).forEach((r) => addText(`⚠ ${r}`, 9));

  section("ACTION PLAN");
  (d.actionPlan ?? []).forEach((a, i) => addText(`${i + 1}. ${a}`, 9));

  section("COMPETITOR TABLE");
  (d.competitorTable ?? []).forEach((c) => {
    addText(`${c.name} (${c.estimatedPriceRange})`, 9, true);
    addText(`${c.positioning}`, 9);
    addText(`Strength: ${c.strength}`, 9);
    addText(`Weakness: ${c.weakness}`, 9);
    y += 6;
  });

  doc.save(`marketlens-${report.niche.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ============================================================
//  MAIN COMPONENT
// ============================================================
export default function ReportDashboard({ report }: { report: SavedReport }) {
  const d = report.report_data;
  const band = getScoreBand(d.marketScore);
  const scoreColors = getScoreColors(band);
  const factors = d.chartData?.opportunityFactors ?? [];

  const [copySuccess, setCopySuccess] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackMessage, setTrackMessage] = useState("");
  const [trackedSignalId, setTrackedSignalId] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(report));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      alert("Copy failed — please use the JSON download instead.");
    }
  }, [report]);

  const handleTrack = useCallback(async () => {
    setTracking(true);
    setTrackMessage("");
    try {
      const result = await trackReportInFeed(report.id);
      if (!result.success) throw new Error(result.error ?? "Could not track this product.");
      setTrackedSignalId(result.signalId ?? null);
      setTrackMessage("Tracking this product in your Trend Feed and watchlist.");
    } catch (error) {
      setTrackMessage(error instanceof Error ? error.message : "Could not track this product.");
    } finally {
      setTracking(false);
    }
  }, [report.id]);

  const handlePDF = useCallback(async () => {
    setExportingPDF(true);
    try {
      await exportToPDF(report);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPDF(false);
    }
  }, [report]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-in-card">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-slate-900">{report.niche}</h1>
            {report.is_mock && (
              <Badge variant="amber">Sample Report</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {report.location} · {report.target_customer} · {formatDate(report.created_at)}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={handleCopy} className="btn-ghost border border-slate-200">
            {copySuccess ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button onClick={() => downloadReportJSON(report)} className="btn-ghost border border-slate-200">
            ⬇ JSON
          </button>
          <button
            onClick={handlePDF}
            disabled={exportingPDF}
            className="btn-ghost border border-slate-200 disabled:opacity-50"
          >
            {exportingPDF ? "Generating…" : "📄 PDF"}
          </button>
          <Link href="/analyze" className="btn-primary text-xs px-4 py-2">
            + New Analysis
          </Link>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">Turn this report into a tracked signal</p>
          <p className="text-xs text-slate-500 mt-1">
            Add this product to Trend Feed, Watchlist, and Daily Briefing tracking.
          </p>
          {trackMessage && (
            <p className="text-xs mt-2 text-brand-700">{trackMessage}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleTrack} disabled={tracking} className="btn-primary text-xs px-4 py-2">
            {tracking ? "Tracking..." : "Track this product in Trend Feed"}
          </button>
          <Link
            href={trackedSignalId ? `/feed?signal=${trackedSignalId}` : `/feed?q=${encodeURIComponent(report.niche)}`}
            className="btn-secondary text-xs px-4 py-2"
          >
            View in Trend Feed
          </Link>
        </div>
      </div>

      {/* ── Score Hero ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-card-hover">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Ring */}
          <div className="flex-shrink-0 bg-white/10 rounded-2xl p-4">
            <ScoreRing score={d.marketScore} size={100} />
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Market Opportunity Score
            </p>
            <h2 className="font-serif text-2xl text-white mb-2">
              {getScoreLabel(d.marketScore)}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
              {d.summary?.split("\n")[0] ?? ""}
            </p>
          </div>

          {/* Factor bars (on larger screens) */}
          <div className="hidden lg:block w-56 space-y-2 flex-shrink-0">
            {factors.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-white/70 text-xs">{f.label}</span>
                  <span className="text-white text-xs font-bold">{f.value}/20</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full"
                    style={{ width: `${(f.value / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Score", value: `${d.marketScore}/100`, badge: getScoreLabel(d.marketScore), badgeVariant: band === "strong" ? "green" : band === "moderate" ? "amber" : "red" },
          { label: "Competitors Mapped", value: String(d.competitorTable?.length ?? 0), badge: "Analyzed", badgeVariant: "blue" },
          { label: "Action Steps", value: String(d.actionPlan?.length ?? 0), badge: "Prioritized", badgeVariant: "purple" },
          { label: "Pain Points Found", value: String(d.customerPainPoints?.length ?? 0), badge: "Opportunities", badgeVariant: "amber" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-slate-800 leading-none mb-2">
              {kpi.value}
            </p>
            <Badge variant={kpi.badgeVariant as "green" | "amber" | "blue" | "purple"}>
              {kpi.badge}
            </Badge>
          </div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Opportunity Radar" icon="🕸️">
          <OpportunityRadar factors={factors} />
        </SectionCard>
        <SectionCard title="Score Breakdown" icon="📊">
          <OpportunityBarChart factors={factors} />
        </SectionCard>
      </div>

      {/* ── Scoring Explanation ────────────────────────────── */}
      <SectionCard title="How the Score is Calculated" icon="📐">
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          The Market Opportunity Score (0–100) is a composite of 5 equally-weighted econometric factors (each 0–20 pts). This approach mirrors index construction methods used in applied econometrics to combine heterogeneous signals into a single decision-relevant metric.
        </p>
        <div className="space-y-4">
          {factors.map((f) => (
            <FactorBar
              key={f.label}
              label={f.label}
              value={f.value}
              description={f.description}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── Executive Summary ──────────────────────────────── */}
      <SectionCard title="Executive Summary" icon="📋">
        <ProseBlock text={d.summary} />
      </SectionCard>

      {/* ── Two-col: Customer + Pricing ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Target Customer Profile" icon="👤">
          <ProseBlock text={d.targetCustomer} />
        </SectionCard>
        <SectionCard title="Pricing Recommendation" icon="💰">
          <ProseBlock text={d.pricingRecommendation} />
        </SectionCard>
      </div>

      {/* ── Pain Points ────────────────────────────────────── */}
      <SectionCard title="Customer Pain Points" icon="😣">
        <div className="space-y-2.5">
          {(d.customerPainPoints ?? []).map((p, i) => (
            <div key={i} className="flex gap-3 bg-red-50 rounded-xl p-3.5">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700">{p}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Two-col: Demand + Differentiation ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Demand Trend" icon="📈">
          <ProseBlock text={d.demandTrend} />
        </SectionCard>
        <SectionCard title="Differentiation Strategy" icon="🚀">
          <ProseBlock text={d.differentiationStrategy} />
        </SectionCard>
      </div>

      {/* ── Marketing Channels ─────────────────────────────── */}
      <SectionCard title="Marketing Channels" icon="📣">
        <div className="flex flex-wrap gap-2">
          {(d.marketingChannels ?? []).map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
            >
              {c}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* ── Competitor Table ───────────────────────────────── */}
      <SectionCard title="Competitor Landscape" icon="🏁">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Competitor", "Positioning", "Strength", "Weakness"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-bold uppercase tracking-widest text-slate-400 pb-3 px-2 first:pl-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(d.competitorTable ?? []).map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 first:pl-0">
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 bg-slate-100 rounded px-1.5 py-0.5 inline-block">
                      {c.estimatedPriceRange}
                    </p>
                  </td>
                  <td className="py-3 px-2 text-xs text-slate-600 max-w-[200px]">{c.positioning}</td>
                  <td className="py-3 px-2 text-xs text-emerald-700 max-w-[160px]">{c.strength}</td>
                  <td className="py-3 px-2 text-xs text-red-600 max-w-[160px]">{c.weakness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Two-col: Risks + Action Plan ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Risks & Weaknesses" icon="⚠️">
          <div className="space-y-2">
            {(d.risks ?? []).map((r, i) => (
              <div key={i} className="flex gap-2.5 p-3 bg-amber-50 rounded-xl">
                <span className="text-amber-500 flex-shrink-0 text-sm">⚠</span>
                <p className="text-xs text-slate-700">{r}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Next-Step Action Plan" icon="✅">
          <div className="space-y-2">
            {(d.actionPlan ?? []).map((a, i) => (
              <div key={i} className="flex gap-3 bg-brand-50 border-l-2 border-brand-500 rounded-r-xl p-3">
                <span className="flex-shrink-0 font-bold text-brand-600 text-xs w-4">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-700">{a}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Footer CTA ─────────────────────────────────────── */}
      <div className="text-center py-6 border-t border-slate-100">
        <p className="text-slate-400 text-xs mb-3">
          Generated by MarketLens · AI-Powered Market Intelligence
        </p>
        <Link href="/analyze" className="btn-primary mx-auto">
          Analyze Another Market →
        </Link>
      </div>
    </div>
  );
}
