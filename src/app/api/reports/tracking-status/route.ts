import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const reportIds = Array.isArray(body.reportIds) ? body.reportIds.filter(Boolean) : [];
  const sessionId = req.headers.get("x-marketlens-session-id") ?? "";
  const user = await getUserFromAuthorization(req.headers.get("authorization"));

  if (!reportIds.length) {
    return NextResponse.json({ success: true, statuses: {} });
  }

  const supabase = createServerSupabase();
  let query = supabase
    .from("trend_signals")
    .select("id, report_id")
    .in("report_id", reportIds);

  if (user) {
    query = query.eq("created_by_user_id", user.id);
  } else if (sessionId) {
    query = query.eq("created_by_session_id", sessionId);
  } else {
    return NextResponse.json({ success: true, statuses: {} });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const statuses = Object.fromEntries(
    (data ?? []).map((row) => [row.report_id as string, { tracked: true, signalId: row.id }])
  );

  return NextResponse.json({ success: true, statuses });
}
