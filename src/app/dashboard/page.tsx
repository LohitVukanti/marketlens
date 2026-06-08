// ============================================================
// src/app/dashboard/page.tsx
// Report dashboard page.
// Reads the latest report from sessionStorage (set by analyze page).
// Falls back to mock data if nothing is stored.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ReportDashboard from "@/components/ui/ReportDashboard";
import { Spinner, EmptyState } from "@/components/ui";
import type { SavedReport } from "@/types";
import { reportRequestHeaders } from "@/lib/report-api-client";

export default function DashboardPage() {
  const router = useRouter();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const reportId =
          typeof window === "undefined"
            ? null
            : new URLSearchParams(window.location.search).get("report");
        if (reportId) {
          const response = await fetch(`/api/reports/${reportId}`, {
            headers: await reportRequestHeaders(),
          });
          const payload = await response.json();

          if (!response.ok || !payload.success || !payload.report) {
            setAccessDenied(true);
            return;
          }

          setReport(payload.report);
          sessionStorage.setItem("ml_report", JSON.stringify(payload.report));
          return;
        }

        const stored = sessionStorage.getItem("ml_report");
        if (stored) {
          const parsed = JSON.parse(stored) as SavedReport;
          if (!parsed.id) {
            setReport(parsed);
            return;
          }

          const response = await fetch(`/api/reports/${parsed.id}`, {
            headers: await reportRequestHeaders(),
          });
          const payload = await response.json();

          if (!response.ok || !payload.success || !payload.report) {
            sessionStorage.removeItem("ml_report");
            setAccessDenied(true);
            return;
          }

          setReport(payload.report);
          sessionStorage.setItem("ml_report", JSON.stringify(payload.report));
        }
      } catch (err) {
        console.error("Failed to parse stored report:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Navbar />
        <EmptyState
          icon="📭"
          title={accessDenied ? "Report not found or access denied" : "No report loaded"}
          description={
            accessDenied
              ? "This report does not belong to the current user or guest session."
              : "Generate a new market analysis to see your dashboard here."
          }
          action={
            <button
              className="btn-primary mx-auto"
              onClick={() => router.push("/analyze")}
            >
              Start New Analysis →
            </button>
          }
        />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <ReportDashboard report={report} />
      </main>
    </>
  );
}
