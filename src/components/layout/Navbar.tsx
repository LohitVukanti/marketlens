// ============================================================
// src/components/layout/Navbar.tsx
// Sticky top navigation bar with branding and page links.
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Trend Feed" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/briefing", label: "Briefing" },
  { href: "/analyze", label: "New Analysis" },
  { href: "/saved-reports", label: "Saved Reports" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="border-b border-indigo-100 bg-indigo-50/80 px-4 py-2 text-center text-xs text-indigo-800">
        <span className="font-semibold">MarketLens Beta</span> - ecommerce trend intelligence is still being improved. Trend signals are research starting points.
      </div>
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-md">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M2 12 L5 7 L8 9 L11 4 L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="6" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-serif text-xl text-slate-900 hidden sm:block">MarketLens</span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 sm:hidden">
            Beta
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0",
                  isActive
                    ? "text-brand-700 bg-brand-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <Link href="/analyze" className="btn-primary hidden lg:inline-flex text-xs px-4 py-2">
          Run Analysis
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Open navigation menu"
        >
          Menu
        </button>
      </nav>
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-3 text-sm font-semibold",
                    isActive ? "bg-brand-50 text-brand-700" : "bg-slate-50 text-slate-700"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
