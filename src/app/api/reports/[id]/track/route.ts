import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { createOrUpdateTrendSignalFromReport } from "@/lib/tracked-signal";
import type { SavedReport } from "@/types";

const FREE_WATCHLIST_LIMIT = 3;

async function getPlan(userId?: string | null) {
  if (!userId) return "free";
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.plan === "pro" ? "pro" : "free";
}

async function watchedCount(owner: { userId?: string | null; sessionId?: string | null }) {
  const supabase = createServerSupabase();
  let query = supabase.from("watchlist_items").select("id", { count: "exact", head: true });
  query = owner.userId
    ? query.eq("user_id", owner.userId)
    : query.eq("session_id", owner.sessionId ?? "").is("user_id", null);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function alreadyWatched(signalId: string, owner: { userId?: string | null; sessionId?: string | null }) {
  const supabase = createServerSupabase();
  let query = supabase.from("watchlist_items").select("id").eq("signal_id", signalId).limit(1);
  query = owner.userId
    ? query.eq("user_id", owner.userId)
    : query.eq("session_id", owner.sessionId ?? "").is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;
  return Boolean(data?.length);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = req.headers.get("x-marketlens-session-id") ?? "";
  const user = await getUserFromAuthorization(req.headers.get("authorization"));

  if (!user && !sessionId) {
    return NextResponse.json({ success: false, error: "Missing tracking session." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  const owner = { userId: user?.id, sessionId };
  const signal = await createOrUpdateTrendSignalFromReport(report as SavedReport, owner);
  const signalId = signal.id as string;
  const isWatched = await alreadyWatched(signalId, owner);
  const plan = await getPlan(user?.id);

  if (!isWatched && plan !== "pro") {
    const count = await watchedCount(owner);
    if (count >= FREE_WATCHLIST_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `Free plan watchlists are limited to ${FREE_WATCHLIST_LIMIT} signals.`,
          signalId,
        },
        { status: 403 }
      );
    }
  }

  const { error: watchError } = await supabase.from("watchlist_items").upsert(
    {
      session_id: sessionId,
      user_id: user?.id ?? null,
      signal_id: signalId,
      alert_threshold: 80,
    },
    { onConflict: user ? "user_id,signal_id" : "session_id,signal_id" }
  );

  if (watchError) {
    return NextResponse.json({ success: false, error: watchError.message, signalId }, { status: 500 });
  }

  return NextResponse.json({ success: true, signalId, tracked: true });
}
