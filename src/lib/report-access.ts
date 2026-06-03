import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";

export type ReportOwner = {
  userId?: string | null;
  sessionId?: string | null;
};

export async function getReportOwner(req: NextRequest): Promise<ReportOwner> {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  const sessionId = req.headers.get("x-marketlens-session-id");

  return {
    userId: user?.id ?? null,
    sessionId: sessionId || null,
  };
}

export function applyReportOwnerFilter(query: any, owner: ReportOwner) {
  if (owner.userId) return query.eq("user_id", owner.userId);
  if (owner.sessionId) return query.eq("session_id", owner.sessionId).is("user_id", null);
  return query.is("id", null);
}

export async function getScopedReport(reportId: string, owner: ReportOwner) {
  const supabase = createServerSupabase();
  const query = supabase.from("reports").select("*").eq("id", reportId);
  const { data, error } = await applyReportOwnerFilter(query, owner).maybeSingle();

  return { data, error };
}
