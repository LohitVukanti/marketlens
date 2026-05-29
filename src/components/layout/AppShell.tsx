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
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        {title && (
          <header className="h-16 flex items-center px-8 border-b flex-shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
              {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
            </div>
            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="live-dot" />
                Live · Updated just now
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
