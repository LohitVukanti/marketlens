import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { authorizeCron, unauthorizedCronResponse } from "@/lib/cron";
import { sendEmail } from "@/lib/resend";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";

export const dynamic = "force-dynamic";

type WatchRow = {
  id: string;
  user_id: string;
  alert_threshold: number;
  last_alerted_at: string | null;
  trend_signals: TrendSignalRow | TrendSignalRow[] | null;
};

async function getUserEmail(userId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

function shouldSendAlert(row: WatchRow) {
  const signalRow = Array.isArray(row.trend_signals) ? row.trend_signals[0] : row.trend_signals;
  if (!signalRow) return false;

  const alreadySentRecently =
    row.last_alerted_at &&
    Date.now() - new Date(row.last_alerted_at).getTime() < 20 * 60 * 60 * 1000;

  if (alreadySentRecently) return false;
  return signalRow.opportunity_score >= row.alert_threshold || signalRow.trend_state === "breakout";
}

function alertHtml(signal: ReturnType<typeof mapTrendSignalRow>, threshold: number) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827">
      <h1>MarketLens Alert: ${signal.name}</h1>
      <p><strong>Opportunity score:</strong> ${signal.score}/100</p>
      <p><strong>Your threshold:</strong> ${threshold}</p>
      <p>${signal.whyTrending || signal.summary}</p>
      <p style="color:#6b7280;font-size:12px">This is a Pro alert placeholder powered by your watchlist thresholds.</p>
    </div>
  `;
}

async function runAlertEmailJob(req: NextRequest) {
  if (!authorizeCron(req)) return unauthorizedCronResponse();

  const supabase = createServerSupabase();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, plan, email_alerts_enabled")
    .eq("plan", "pro")
    .eq("email_alerts_enabled", true)
    .limit(500);

  if (profileError) {
    return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
  }

  const userIds = (profiles ?? []).map((profile) => profile.user_id as string);
  if (!userIds.length) return NextResponse.json({ success: true, sent: 0, failures: [] });

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id, user_id, alert_threshold, last_alerted_at, trend_signals (*)")
    .in("user_id", userIds);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as unknown as WatchRow[]).filter(shouldSendAlert);
  let sent = 0;
  const failures: string[] = [];

  for (const row of rows) {
    const signalRow = Array.isArray(row.trend_signals) ? row.trend_signals[0] : row.trend_signals;
    if (!signalRow) continue;

    const email = await getUserEmail(row.user_id);
    if (!email) continue;

    try {
      const signal = mapTrendSignalRow(signalRow);
      await sendEmail({
        to: email,
        subject: `MarketLens alert: ${signal.name}`,
        html: alertHtml(signal, row.alert_threshold),
        text: `${signal.name} triggered your MarketLens alert at ${signal.score}/100.`,
      });
      sent++;

      await supabase
        .from("watchlist_items")
        .update({ last_alerted_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (sendError) {
      failures.push(`${row.id}: ${sendError instanceof Error ? sendError.message : "send failed"}`);
    }
  }

  return NextResponse.json({ success: true, sent, failures });
}

export async function GET(req: NextRequest) {
  return runAlertEmailJob(req);
}

export async function POST(req: NextRequest) {
  return runAlertEmailJob(req);
}
