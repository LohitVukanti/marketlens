import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { authorizeCron, unauthorizedCronResponse } from "@/lib/cron";
import { sendEmail } from "@/lib/resend";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";

export const dynamic = "force-dynamic";

async function getUserEmail(userId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

function briefingHtml(signals: ReturnType<typeof mapTrendSignalRow>[]) {
  const rows = signals
    .map(
      (signal) => `
        <li>
          <strong>${signal.name}</strong> — score ${signal.score}/100<br />
          ${signal.whyTrending || signal.summary}
        </li>
      `
    )
    .join("");

  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827">
      <h1>MarketLens Daily Briefing</h1>
      <p>Your highest-priority opportunities for today:</p>
      <ol>${rows}</ol>
      <p style="color:#6b7280;font-size:12px">Manage billing and future email preferences in MarketLens.</p>
    </div>
  `;
}

async function runDailyBriefingJob(req: NextRequest) {
  if (!authorizeCron(req)) return unauthorizedCronResponse();

  const supabase = createServerSupabase();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, plan, daily_briefing_enabled")
    .eq("daily_briefing_enabled", true)
    .limit(200);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const profile of profiles ?? []) {
    const { data: watched } = await supabase
      .from("watchlist_items")
      .select("trend_signals (*)")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(profile.plan === "pro" ? 8 : 3);

    let signalRows = ((watched ?? []) as unknown as { trend_signals: TrendSignalRow | TrendSignalRow[] | null }[])
      .map((item) => (Array.isArray(item.trend_signals) ? item.trend_signals[0] : item.trend_signals))
      .filter((item): item is TrendSignalRow => Boolean(item));

    if (!signalRows.length) {
      const { data: globalSignals } = await supabase
        .from("trend_signals")
        .select("*")
        .neq("source_type", "from_analysis")
        .order("opportunity_score", { ascending: false })
        .limit(profile.plan === "pro" ? 8 : 3);
      signalRows = (globalSignals ?? []) as TrendSignalRow[];
    }

    const email = await getUserEmail(profile.user_id);
    if (!email || !signalRows.length) continue;

    try {
      const signals = signalRows.map(mapTrendSignalRow);
      await sendEmail({
        to: email,
        subject: "Your MarketLens daily briefing",
        html: briefingHtml(signals),
        text: signals.map((signal) => `${signal.name}: ${signal.score}/100`).join("\n"),
      });
      sent++;

      await supabase.from("alert_preferences").upsert({
        user_id: profile.user_id,
        daily_briefing_enabled: true,
        daily_briefing_last_sent_at: new Date().toISOString(),
      });
    } catch (sendError) {
      failures.push(`${profile.user_id}: ${sendError instanceof Error ? sendError.message : "send failed"}`);
    }
  }

  return NextResponse.json({ success: true, sent, failures });
}

export async function GET(req: NextRequest) {
  return runDailyBriefingJob(req);
}

export async function POST(req: NextRequest) {
  return runDailyBriefingJob(req);
}
