import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";

const PROFILE_COLUMNS = "user_id, plan, created_at, daily_briefing_enabled, email_alerts_enabled";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));

  if (!user) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ success: true, profile: existing });
  }

  const insertPayload = {
    user_id: user.id,
    plan: "free",
  };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert(insertPayload)
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: inserted });
}
