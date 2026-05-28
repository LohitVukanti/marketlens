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

// ---- Report Card Component ----------------------------------
function ReportCard({
  report,
  onOpen,
  onDelete,
}: {
  report: SavedReport;
  onOpen: (r: SavedReport) => void;
  onDelete: (id: string) => void;
}) {
  const band = getScoreBand(report.report_data.marketScore);
  const colors = getScoreColors(band);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete report for "${report.niche}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
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

// ============================================================
//  MAIN PAGE
// ============================================================
export default function SavedReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load reports.");
      setReports(data.reports ?? []);
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

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-2">Saved Reports</h1>
            <p className="text-slate-500 text-sm">
              Your market intelligence reports, stored in Supabase.
            </p>
          </div>
          <button
            onClick={() => router.push("/analyze")}
            className="btn-primary flex-shrink-0 text-xs px-4 py-2"
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
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
