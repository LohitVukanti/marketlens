import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import {
  addWatchlistSignal,
  getWatchlistOwnerFromRequest,
  getWatchlistRows,
  watchedSignalIds,
  watchlistOwnerFilter,
} from "@/lib/watchlist-server";

function missingOwnerResponse() {
  return NextResponse.json({ success: false, error: "Missing watchlist session." }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const owner = await getWatchlistOwnerFromRequest(req);
  if (!owner) return missingOwnerResponse();

  try {
    const items = await getWatchlistRows(owner);
    const signalIds = await watchedSignalIds(owner);
    return NextResponse.json({
      success: true,
      items,
      signalIds: Array.from(signalIds),
      count: signalIds.size,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load watchlist." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const owner = await getWatchlistOwnerFromRequest(req);
  if (!owner) return missingOwnerResponse();

  const body = await req.json().catch(() => ({}));
  const signalId = typeof body.signalId === "string" ? body.signalId.trim() : "";
  const alertThreshold = Number.isFinite(body.alertThreshold) ? Number(body.alertThreshold) : undefined;

  if (!signalId) {
    return NextResponse.json({ success: false, error: "Missing signalId." }, { status: 400 });
  }

  return addWatchlistSignal(owner, signalId, alertThreshold);
}

export async function PATCH(req: NextRequest) {
  const owner = await getWatchlistOwnerFromRequest(req);
  if (!owner) return missingOwnerResponse();

  const body = await req.json().catch(() => ({}));
  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
  const alertThreshold = Math.min(100, Math.max(0, Number(body.alertThreshold)));

  if (!itemId || !Number.isFinite(alertThreshold)) {
    return NextResponse.json({ success: false, error: "Missing itemId or alertThreshold." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const query = supabase
    .from("watchlist_items")
    .update({ alert_threshold: alertThreshold })
    .eq("id", itemId);
  const { error } = await watchlistOwnerFilter(query, owner);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const owner = await getWatchlistOwnerFromRequest(req);
  if (!owner) return missingOwnerResponse();

  const body = await req.json().catch(() => ({}));
  const signalId = typeof body.signalId === "string" ? body.signalId.trim() : "";

  if (!signalId) {
    return NextResponse.json({ success: false, error: "Missing signalId." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const query = supabase.from("watchlist_items").delete().eq("signal_id", signalId);
  const { error } = await watchlistOwnerFilter(query, owner);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
