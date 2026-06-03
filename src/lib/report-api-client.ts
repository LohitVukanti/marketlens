"use client";

import { supabase } from "@/lib/supabase";
import { getAnonymousSessionId } from "@/lib/watchlist";

export async function reportRequestHeaders(extra?: HeadersInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return {
    ...extra,
    "X-MarketLens-Session-Id": getAnonymousSessionId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
