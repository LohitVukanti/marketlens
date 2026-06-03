// ============================================================
// src/app/api/reports/route.ts
// GET owner-scoped saved reports from Supabase.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { MOCK_SAVED_REPORT } from "@/lib/mock-data";
import { applyReportOwnerFilter, getReportOwner } from "@/lib/report-access";

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Return mock data if Supabase isn't configured
  if (!supabaseUrl || supabaseUrl.includes("your-project")) {
    return NextResponse.json({ success: true, reports: [MOCK_SAVED_REPORT] });
  }

  const owner = await getReportOwner(req);
  if (!owner.userId && !owner.sessionId) {
    return NextResponse.json({ success: true, reports: [] });
  }

  const supabase = createServerSupabase();
  const query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data, error } = await applyReportOwnerFilter(query, owner);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, reports: data });
}
