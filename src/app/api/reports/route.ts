// ============================================================
// src/app/api/reports/route.ts
// GET all saved reports from Supabase.
// ============================================================

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { MOCK_SAVED_REPORT } from "@/lib/mock-data";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Return mock data if Supabase isn't configured
  if (!supabaseUrl || supabaseUrl.includes("your-project")) {
    return NextResponse.json({ success: true, reports: [MOCK_SAVED_REPORT] });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, reports: data });
}
