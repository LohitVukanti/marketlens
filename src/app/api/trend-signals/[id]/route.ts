import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getReportOwner } from "@/lib/report-access";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const signalId = params.id;
  if (!signalId) {
    return NextResponse.json({ success: false, error: "Missing signal id." }, { status: 400 });
  }

  const owner = await getReportOwner(req);
  if (!owner.userId && !owner.sessionId) {
    return NextResponse.json({ success: false, error: "Signal not found or access denied." }, { status: 404 });
  }

  const supabase = createServerSupabase();
  const { data: signal, error: signalError } = await supabase
    .from("trend_signals")
    .select("id, source_type, created_by_user_id, created_by_session_id")
    .eq("id", signalId)
    .maybeSingle();

  if (signalError) {
    return NextResponse.json({ success: false, error: signalError.message }, { status: 500 });
  }

  const ownsSignal =
    signal?.source_type === "from_analysis" &&
    ((owner.userId && signal.created_by_user_id === owner.userId) ||
      (owner.sessionId && signal.created_by_session_id === owner.sessionId));

  if (!signal || !ownsSignal) {
    return NextResponse.json({ success: false, error: "Signal not found or access denied." }, { status: 404 });
  }

  const { error: watchlistError } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("signal_id", signalId);

  if (watchlistError) {
    return NextResponse.json({ success: false, error: watchlistError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("trend_signals")
    .delete()
    .eq("id", signalId)
    .eq("source_type", "from_analysis");

  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
