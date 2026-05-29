import { NextRequest, NextResponse } from "next/server";

export function authorizeCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = req.headers.get("x-cron-secret");
  return bearer === secret || headerSecret === secret;
}

export function unauthorizedCronResponse() {
  return NextResponse.json({ success: false, error: "Unauthorized cron request." }, { status: 401 });
}
