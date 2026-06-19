// src/components/layout/Sidebar.tsx
// Dark sidebar navigation for the platform shell
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateProfile, type MarketLensPlan } from "@/lib/auth";

const NAV = [
  { href: "/feed",         icon: "◈", label: "Trend Feed",      badge: "Live" },
  { href: "/watchlist",    icon: "☆", label: "Watchlist",       badge: null },
  { href: "/briefing",     icon: "◎", label: "Daily Briefing",  badge: "New" },
  { href: "/analyze",      icon: "⊕", label: "Deep Analysis",   badge: null },
  { href: "/saved-reports",icon: "⊞", label: "Saved Reports",   badge: null },
];

export default function Sidebar() {
  const path = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<MarketLensPlan>("free");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    async function loadAccount() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? null);

      if (user) {
        try {
          const profile = await getOrCreateProfile(user.id);
          setPlan(profile.plan);
        } catch (error) {
          console.warn("[auth] Unable to load profile:", error);
        }
      } else {
        setPlan("free");
      }
    }

    loadAccount();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAccount();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setEmail(null);
    setPlan("free");
  }

  return (
    <>
    <aside className="fixed top-0 left-0 h-screen w-56 hidden md:flex flex-col border-r z-40"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>ML</div>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>MarketLens</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(99,102,241,0.2)", color: "var(--accent-bright)" }}>v3</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3"
          style={{ color: "var(--text-muted)" }}>Platform</p>
        {NAV.map(({ href, icon, label, badge }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`nav-link ${active ? "active" : ""}`}>
              <span className="text-base w-5 text-center">{icon}</span>
              <span className="flex-1">{label}</span>
              {badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  badge === "Live"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-indigo-500/20 text-indigo-300"
                }`}>{badge}</span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3"
            style={{ color: "var(--text-muted)" }}>Account</p>
          <Link href="/" className="nav-link">
            <span className="text-base w-5 text-center">⌂</span>
            <span>Home</span>
          </Link>
          <Link href="/upgrade" className={`nav-link ${path === "/upgrade" ? "active" : ""}`}>
            <span className="text-base w-5 text-center">◇</span>
            <span>Pro Access</span>
          </Link>
          {email ? (
            <button onClick={handleLogout} className="nav-link w-full text-left">
              <span className="text-base w-5 text-center">↩</span>
              <span>Logout</span>
            </button>
          ) : (
            <Link href="/login" className={`nav-link ${path === "/login" ? "active" : ""}`}>
              <span className="text-base w-5 text-center">↪</span>
              <span>Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Upgrade CTA */}
      <div className="p-3 mx-3 mb-4 rounded-xl border" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)" }}>
        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--accent-bright)" }}>
          {plan === "pro" ? "Pro Plan" : "Free Plan"}
        </p>
        <p className="text-[11px] mb-2 truncate" style={{ color: "var(--text-muted)" }}>
          {email || "Guest mode"} · {plan === "pro" ? "Unlimited watchlist" : "3 watched signals"}
        </p>
        <Link href="/upgrade" className="block w-full text-center text-xs font-semibold py-1.5 rounded-lg text-white"
          style={{ background: "var(--accent)" }}>{plan === "pro" ? "Manage Plan" : "Request Pro Access"}</Link>
      </div>
    </aside>
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b px-4 md:hidden"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <Link href="/feed" className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          ML
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            MarketLens
          </p>
          <p className="text-[10px]" style={{ color: "var(--accent-bright)" }}>
            Beta
          </p>
        </div>
      </Link>
      <Link
        href="/login"
        className="ml-auto rounded-lg px-3 py-2 text-xs font-semibold"
        style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
      >
        {email ? "Account" : "Login"}
      </Link>
    </header>

    <nav
      className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 rounded-2xl border p-1 shadow-2xl md:hidden"
      style={{ background: "rgba(17,21,32,0.96)", borderColor: "var(--border)" }}
      aria-label="Mobile navigation"
    >
      {[
        { href: "/feed", icon: "◈", label: "Feed" },
        { href: "/analyze", icon: "⊕", label: "Analyze" },
        { href: "/watchlist", icon: "☆", label: "Watch" },
        { href: "/briefing", icon: "◎", label: "Brief" },
        { href: "/saved-reports", icon: "⊞", label: "Saved" },
      ].map((item) => {
        const active = path === item.href || path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition"
            style={
              active
                ? { background: "rgba(99,102,241,0.18)", color: "var(--accent-bright)" }
                : { color: "var(--text-muted)" }
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
