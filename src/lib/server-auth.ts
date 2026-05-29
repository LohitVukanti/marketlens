import { createClient } from "@supabase/supabase-js";

export async function getUserFromAuthorization(authHeader: string | null) {
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user;
}
