"use client";

import { supabase } from "@/lib/supabase";
import { getAnonymousSessionId } from "@/lib/watchlist";

export type TrackReportResult = {
  success: boolean;
  signalId?: string;
  tracked?: boolean;
  error?: string;
};

export async function trackReportInFeed(reportId: string): Promise<TrackReportResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`/api/reports/${reportId}/track`, {
    method: "POST",
    headers: {
      "X-MarketLens-Session-Id": getAnonymousSessionId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch("/api/reports/tracking-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MarketLens-Session-Id": getAnonymousSessionId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ reportIds }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) return {};
  return payload.statuses as Record<string, { tracked: boolean; signalId: string }>;
}
