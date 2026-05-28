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

export default function DashboardPage() {
  const router = useRouter();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ml_report");
      if (stored) {
        setReport(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse stored report:", err);
    } finally {
      setLoading(false);
    }
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
          title="No report loaded"
          description="Generate a new market analysis to see your dashboard here."
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
