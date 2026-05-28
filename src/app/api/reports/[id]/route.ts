// ============================================================
// src/app/api/reports/[id]/route.ts
// DELETE a single report by ID.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
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

  const supabase = createServerSupabase();
  const { error } = await supabase.from("reports").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
