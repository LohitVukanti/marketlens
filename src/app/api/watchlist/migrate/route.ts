import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  const sessionId = req.headers.get("x-marketlens-session-id")?.trim() ?? "";

  if (!user) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }
  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing anonymous session." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: anonymousItems, error: anonymousError } = await supabase
    .from("watchlist_items")
    .select("id, signal_id")
    .eq("session_id", sessionId)
    .is("user_id", null);

  if (anonymousError) {
    return NextResponse.json({ success: false, error: anonymousError.message }, { status: 500 });
  }

  if (!anonymousItems?.length) {
    return NextResponse.json({ success: true, migrated: 0 });
  }

  const { data: userItems, error: userError } = await supabase
    .from("watchlist_items")
    .select("signal_id")
    .eq("user_id", user.id);

  if (userError) {
    return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
  }

  const userSignalIds = new Set((userItems ?? []).map((item) => item.signal_id as string));
  let migrated = 0;

  for (const item of anonymousItems) {
    if (userSignalIds.has(item.signal_id as string)) {
      const { error } = await supabase
        .from("watchlist_items")
        .delete()
        .eq("id", item.id)
        .eq("session_id", sessionId)
        .is("user_id", null);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      continue;
    }

    const { error } = await supabase
      .from("watchlist_items")
      .update({ user_id: user.id })
      .eq("id", item.id)
      .eq("session_id", sessionId)
      .is("user_id", null);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    migrated++;
  }

  return NextResponse.json({ success: true, migrated });
}
