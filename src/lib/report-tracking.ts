"use client";

import { reportRequestHeaders } from "@/lib/report-api-client";

export type TrackReportResult = {
  success: boolean;
  signalId?: string;
  tracked?: boolean;
  error?: string;
};

export async function trackReportInFeed(reportId: string): Promise<TrackReportResult> {
  const response = await fetch(`/api/reports/${reportId}/track`, {
    method: "POST",
    headers: await reportRequestHeaders(),
  });
  const payload = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: payload.error || "Could not track report.",
      signalId: payload.signalId,
    };
  }

  return payload;
}

export async function loadReportTrackingStatuses(reportIds: string[]) {
  const response = await fetch("/api/reports/tracking-status", {
    method: "POST",
    headers: await reportRequestHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ reportIds }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) return {};
  return payload.statuses as Record<string, { tracked: boolean; signalId: string }>;
}
