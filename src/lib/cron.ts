import { NextRequest, NextResponse } from "next/server";

export function authorizeCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = req.headers.get("x-cron-secret");
  return bearer === secret || headerSecret === secret;
}

export function unauthorizedCronResponse() {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET is not configured. Cron jobs are disabled." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: false, error: "Unauthorized cron request." }, { status: 401 });
}
