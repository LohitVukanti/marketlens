// ============================================================
// src/app/api/reports/[id]/route.ts
// GET/DELETE a single owner-scoped report by ID.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { applyReportOwnerFilter, getReportOwner, getScopedReport } from "@/lib/report-access";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("your-project")) {
    return NextResponse.json({ success: true, report: null });
  }

  const owner = await getReportOwner(req);
  if (!owner.userId && !owner.sessionId) {
    return NextResponse.json({ success: false, error: "Report not found or access denied." }, { status: 404 });
  }

  const { data, error } = await getScopedReport(id, owner);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ success: false, error: "Report not found or access denied." }, { status: 404 });
  }

  return NextResponse.json({ success: true, report: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("your-project")) {
    // Mock mode — just pretend it succeeded
    return NextResponse.json({ success: true });
  }

  const owner = await getReportOwner(req);
  if (!owner.userId && !owner.sessionId) {
    return NextResponse.json({ success: false, error: "Report not found or access denied." }, { status: 404 });
  }

  const supabase = createServerSupabase();
  const query = supabase.from("reports").delete().eq("id", id);
  const { error, count } = await applyReportOwnerFilter(query, owner).select("id", { count: "exact" });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ success: false, error: "Report not found or access denied." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
