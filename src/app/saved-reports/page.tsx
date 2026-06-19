// ============================================================
// src/app/saved-reports/page.tsx
// Saved Reports page — fetches from /api/reports, renders list.
// Supports open, delete, and export actions per report.
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Badge, EmptyState, Spinner, AlertBox } from "@/components/ui";
import { formatDate, truncate, downloadReportJSON, getScoreColors } from "@/lib/utils";
import { getScoreBand, getScoreLabel } from "@/types";
import type { SavedReport } from "@/types";
import { loadReportTrackingStatuses, trackReportInFeed } from "@/lib/report-tracking";
import { reportRequestHeaders } from "@/lib/report-api-client";

// ---- Report Card Component ----------------------------------
function ReportCard({
  report,
  onOpen,
  onDelete,
  trackingStatus,
  onTracked,
}: {
  report: SavedReport;
  onOpen: (r: SavedReport) => void;
  onDelete: (id: string) => void;
  trackingStatus?: { tracked: boolean; signalId: string };
  onTracked: (reportId: string, signalId: string) => void;
}) {
  const band = getScoreBand(report.report_data.marketScore);
  const colors = getScoreColors(band);
  const [deleting, setDeleting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete report for "${report.niche}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE",
        headers: await reportRequestHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        onDelete(report.id);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleTrack() {
    setTracking(true);
    setTrackError("");
    try {
      const result = await trackReportInFeed(report.id);
      if (!result.success || !result.signalId) {
        throw new Error(result.error ?? "Could not track report.");
      }
      onTracked(report.id, result.signalId);
    } catch (error) {
      setTrackError(error instanceof Error ? error.message : "Could not track report.");
    } finally {
      setTracking(false);
    }
  }

  return (
    <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-card-hover transition-shadow animate-in-card">
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
        📊
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <h3 className="font-sans font-semibold text-slate-800 text-base truncate">
            {report.niche}
          </h3>
          {report.is_mock && <Badge variant="amber">Sample</Badge>}
          {trackingStatus?.tracked ? <Badge variant="green">Tracked</Badge> : <Badge variant="blue">Not tracked</Badge>}
        </div>
        <p className="text-xs text-slate-400 mb-2">
          {report.location} · {report.target_customer}
        </p>
        <p className="text-xs text-slate-400">{formatDate(report.created_at)}</p>
        {report.report_data.summary && (
          <p className="text-xs text-slate-500 mt-2 hidden sm:block">
            {truncate(report.report_data.summary, 140)}
          </p>
        )}
        {trackError && (
          <p className="text-xs text-amber-600 mt-2">{trackError}</p>
        )}
      </div>

      {/* Score badge */}
      <div
        className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl ${colors.bg} ${colors.border} border`}
      >
        <span className={`text-2xl font-bold ${colors.text}`}>
          {report.report_data.marketScore}
        </span>
        <span className={`text-xs font-medium ${colors.text} opacity-80`}>/100</span>
        <span className={`text-xs mt-0.5 ${colors.text} opacity-70`}>{getScoreLabel(report.report_data.marketScore)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-col">
        <button
          onClick={() => onOpen(report)}
          className="btn-secondary text-xs px-3 py-2"
        >
          View Report
        </button>
        <button
          onClick={() => downloadReportJSON(report)}
          className="btn-ghost text-xs border border-slate-200 px-3 py-2"
        >
          ⬇ JSON
        </button>
        <button
          onClick={handleTrack}
          disabled={tracking}
          className="btn-secondary text-xs px-3 py-2"
        >
          {tracking ? "Tracking..." : trackingStatus?.tracked ? "Track Again" : "Track in Feed"}
        </button>
        <button
          onClick={() => {
            const href = trackingStatus?.signalId
              ? `/feed?signal=${trackingStatus.signalId}`
              : `/feed?q=${encodeURIComponent(report.niche)}`;
            routerPush(href);
          }}
          className="btn-ghost text-xs border border-slate-200 px-3 py-2"
        >
          Open Trend Signal
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-ghost text-xs border border-red-100 text-red-500 hover:bg-red-50 px-3 py-2 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function routerPush(href: string) {
  window.location.href = href;
}

// ============================================================
//  MAIN PAGE
// ============================================================
export default function SavedReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [trackingStatuses, setTrackingStatuses] = useState<Record<string, { tracked: boolean; signalId: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        headers: await reportRequestHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load reports.");
      const nextReports = data.reports ?? [];
      setReports(nextReports);
      setTrackingStatuses(await loadReportTrackingStatuses(nextReports.map((report: SavedReport) => report.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  function handleOpen(report: SavedReport) {
    sessionStorage.setItem("ml_report", JSON.stringify(report));
    router.push("/dashboard");
  }

  function handleDelete(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  function handleTracked(reportId: string, signalId: string) {
    setTrackingStatuses((prev) => ({
      ...prev,
      [reportId]: { tracked: true, signalId },
    }));
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-2">Saved Reports</h1>
            <p className="text-slate-500 text-sm">
              Your market intelligence reports, stored in Supabase.
            </p>
          </div>
          <button
            onClick={() => router.push("/analyze")}
            className="btn-primary w-full flex-shrink-0 justify-center text-xs px-4 py-2 sm:w-auto"
          >
            + New Analysis
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <AlertBox type="error" message={error} />
            <button onClick={loadReports} className="btn-secondary mx-auto">
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No reports yet"
            description="Generate your first market intelligence report to see it saved here."
            action={
              <button
                className="btn-primary mx-auto"
                onClick={() => router.push("/analyze")}
              >
                Start Your First Analysis →
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-2">
              {reports.length} report{reports.length !== 1 ? "s" : ""} · Newest first
            </p>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onOpen={handleOpen}
                onDelete={handleDelete}
                trackingStatus={trackingStatuses[report.id]}
                onTracked={handleTracked}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
