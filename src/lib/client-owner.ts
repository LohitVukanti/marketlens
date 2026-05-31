"use client";

import { getCurrentUser, getOrCreateProfile } from "@/lib/auth";
import { getAnonymousSessionId, migrateAnonymousWatchlistToUser, type WatchlistOwner } from "@/lib/watchlist";

export async function getClientWatchlistOwner(): Promise<WatchlistOwner> {
  const sessionId = getAnonymousSessionId();
  const user = await getCurrentUser();

  if (!user) return { sessionId, plan: "free" };

  const profile = await getOrCreateProfile(user.id);
  await migrateAnonymousWatchlistToUser(sessionId, user.id);
  return { sessionId, userId: user.id, plan: profile.plan };
}
