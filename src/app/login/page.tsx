"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile } from "@/lib/auth";
import { getAnonymousSessionId, migrateAnonymousWatchlistToUser } from "@/lib/watchlist";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function finishAuth(userId?: string) {
    if (!userId) return;
    const sessionId = getAnonymousSessionId();
    await getOrCreateProfile(userId);
    await migrateAnonymousWatchlistToUser(sessionId, userId);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await finishAuth(data.user?.id);
        router.push("/watchlist");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.session) {
        await finishAuth(data.user?.id);
        router.push("/watchlist");
        router.refresh();
      } else {
        setMessage("Check your email to confirm the account, then log in.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title={mode === "login" ? "Login" : "Create Account"} subtitle="Keep anonymous watchlists or attach them to an account">
      <div className="max-w-md">
        <div className="card p-5">
          <div className="flex gap-2 mb-5">
            {(["login", "signup"] as AuthMode[]).map((nextMode) => (
              <button
                key={nextMode}
                onClick={() => {
                  setMode(nextMode);
                  setMessage("");
                }}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg ${mode === nextMode ? "text-white" : ""}`}
                style={mode === nextMode ? { background: "var(--accent)" } : { background: "var(--bg-hover)", color: "var(--text-muted)" }}
              >
                {nextMode === "login" ? "Login" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Email</span>
              <input
                className="input-base mt-1 text-sm"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Password</span>
              <input
                className="input-base mt-1 text-sm"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {message && (
              <p className="rounded-lg p-3 text-xs" style={{ color: "#fbbf24", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                {message}
              </p>
            )}

            <button className="btn-primary w-full justify-center text-sm py-2.5" disabled={loading}>
              {loading ? "Working..." : mode === "login" ? "Login" : "Create free account"}
            </button>
          </form>

          <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Guest watchlists still work. When you log in, MarketLens migrates matching anonymous watchlist items into your account.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
