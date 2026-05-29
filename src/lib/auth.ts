"use client";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type MarketLensPlan = "free" | "pro";

export type MarketLensProfile = {
  user_id: string;
  plan: MarketLensPlan;
  created_at: string;
  daily_briefing_enabled?: boolean;
  email_alerts_enabled?: boolean;
};

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getOrCreateProfile(userId: string): Promise<MarketLensProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, plan, created_at, daily_briefing_enabled, email_alerts_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as MarketLensProfile;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({ user_id: userId, plan: "free" })
    .select("user_id, plan, created_at, daily_briefing_enabled, email_alerts_enabled")
    .single();

  if (insertError) throw insertError;
  return inserted as MarketLensProfile;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getOrCreateProfile(user.id);
}
