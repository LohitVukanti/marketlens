// src/components/layout/Sidebar.tsx
// Dark sidebar navigation for the platform shell
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/feed",         icon: "◈", label: "Trend Feed",      badge: "Live" },
  { href: "/watchlist",    icon: "☆", label: "Watchlist",       badge: null },
  { href: "/briefing",     icon: "◎", label: "Daily Briefing",  badge: "New" },
  { href: "/analyze",      icon: "⊕", label: "Deep Analysis",   badge: null },
  { href: "/saved-reports",icon: "⊞", label: "Saved Reports",   badge: null },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col border-r z-40"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>ML</div>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>MarketLens</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(99,102,241,0.2)", color: "var(--accent-bright)" }}>v2</span>
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
        </div>
      </nav>

      {/* Upgrade CTA */}
      <div className="p-3 mx-3 mb-4 rounded-xl border" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)" }}>
        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--accent-bright)" }}>Free Plan</p>
        <p className="text-[11px] mb-2" style={{ color: "var(--text-muted)" }}>3 reports left · Alerts locked</p>
        <button className="w-full text-xs font-semibold py-1.5 rounded-lg text-white"
          style={{ background: "var(--accent)" }}>Upgrade to Pro</button>
      </div>
    </aside>
  );
}
