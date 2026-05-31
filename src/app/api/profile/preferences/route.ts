import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";

const PROFILE_COLUMNS = "user_id, plan, daily_briefing_enabled, email_alerts_enabled";

function emailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

async function ensureProfile(userId: string) {
  const supabase = createServerSupabase();
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({ user_id: userId, plan: "free" })
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError) throw insertError;
  return inserted;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  try {
    const profile = await ensureProfile(user.id);
    return NextResponse.json({
      success: true,
      profile,
      resendConfigured: emailDeliveryConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load preferences." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, boolean> = {};

  if (typeof body.daily_briefing_enabled === "boolean") {
    updates.daily_briefing_enabled = body.daily_briefing_enabled;
  }
  if (typeof body.email_alerts_enabled === "boolean") {
    updates.email_alerts_enabled = body.email_alerts_enabled;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ success: false, error: "No preference updates provided." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  try {
    await ensureProfile(user.id);
    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw error;

    const { error: preferenceError } = await supabase.from("alert_preferences").upsert({
      user_id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

    if (preferenceError) {
      console.warn("[preferences] alert_preferences sync failed:", preferenceError.message);
    }

    return NextResponse.json({
      success: true,
      profile,
      resendConfigured: emailDeliveryConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not update preferences." },
      { status: 500 }
    );
  }
}
