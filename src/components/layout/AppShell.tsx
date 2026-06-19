// src/components/layout/AppShell.tsx
// Wraps platform pages with sidebar + topbar
"use client";
import Sidebar from "./Sidebar";

export default function AppShell({ children, title, subtitle }: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="platform-theme flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar />
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen pt-14 pb-24 md:pt-0 md:pb-0 min-w-0">
        {/* Top bar */}
        {title && (
          <header className="min-h-16 flex flex-col gap-3 px-4 py-4 border-b flex-shrink-0 sm:flex-row sm:items-center sm:px-6 lg:px-8"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
              {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
            </div>
            {/* Right side */}
            <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
              <div className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ borderColor: "rgba(99,102,241,0.25)", color: "var(--accent-bright)", background: "rgba(99,102,241,0.08)" }}>
                MarketLens Beta
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="live-dot" />
                Research signals · not sales predictions
              </div>
            </div>
          </header>
        )}
        <div
          className="border-b px-4 py-2 text-xs sm:px-6 lg:px-8"
          style={{ borderColor: "var(--border)", background: "rgba(99,102,241,0.05)", color: "var(--text-secondary)" }}
        >
          <span className="font-semibold" style={{ color: "var(--accent-bright)" }}>
            MarketLens Beta
          </span>{" "}
          - ecommerce trend intelligence is still being improved. Trend signals are research starting points, not guaranteed sales predictions.
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
