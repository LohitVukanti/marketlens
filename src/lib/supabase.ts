// ============================================================
// src/lib/supabase.ts
// Supabase client instances for client-side and server-side use.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseKey = "placeholder-anon-key";

// ---- Client-side Supabase instance (uses anon key) ----------
// Safe to use in browser components. Respects Row Level Security.
export const supabase = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseAnonKey || fallbackSupabaseKey
);

// ---- Server-side Supabase instance (uses service role key) --
// Only use in API routes / Server Components. Bypasses RLS.
export function createServerSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!serviceRoleKey) {
    console.warn(
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Falling back to anon key — RLS will apply."
    );
  }

  return createClient(
    supabaseUrl || fallbackSupabaseUrl,
    serviceRoleKey || supabaseAnonKey || fallbackSupabaseKey,
    {
      auth: {
        // Disable auto session refresh in server context
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/** Returns true if Supabase is configured (both env vars present) */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project") &&
      !supabaseAnonKey.includes("your_supabase")
  );
}
