import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getReportOwner } from "@/lib/report-access";
import { mapTrendSignalRow, type TrendSignalRow } from "@/lib/trend-mapper";

export async function GET(req: NextRequest) {
  const owner = await getReportOwner(req);

  if (!owner.userId && !owner.sessionId) {
    return NextResponse.json({ success: true, signals: [] });
  }

  const supabase = createServerSupabase();
  let query = supabase
    .from("trend_signals")
    .select("*")
    .eq("source_type", "from_analysis")
    .order("updated_at", { ascending: false })
    .limit(100);

  query = owner.userId
    ? query.eq("created_by_user_id", owner.userId)
    : query.eq("created_by_session_id", owner.sessionId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    signals: ((data ?? []) as TrendSignalRow[]).map(mapTrendSignalRow),
  });
}
