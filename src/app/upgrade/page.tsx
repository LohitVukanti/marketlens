"use client";

import AppShell from "@/components/layout/AppShell";

const FEATURES = [
  "Unlimited watchlist tracking",
  "Breakout alert thresholds",
  "Daily personalized briefings",
  "Deeper Reddit and Etsy signal context",
  "Premium signals placeholder",
  "Advanced alerts placeholder",
];

export default function UpgradePage() {
  return (
    <AppShell title="Upgrade" subtitle="Monetization foundation placeholder">
      <div className="max-w-3xl">
        <div className="rounded-2xl p-6 border mb-6" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent-bright)" }}>
            Pro Plan
          </p>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>$19</h2>
            <p className="text-sm pb-1" style={{ color: "var(--text-muted)" }}>/ month placeholder</p>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Pro is not connected to billing yet. This page defines the offer, plan language, and upgrade path for the Stripe phase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {FEATURES.map((feature) => (
            <div key={feature} className="card p-4 flex items-center gap-3">
              <span className="badge badge-blue text-[10px]">Pro</span>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{feature}</span>
            </div>
          ))}
        </div>

        <div className="card p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Stripe checkout coming soon</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Current implementation keeps the app usable for free while preparing plan gates and database ownership.
            </p>
          </div>
          <button className="btn-primary text-sm px-5 py-2.5 opacity-60 cursor-not-allowed" disabled>
            Coming soon
          </button>
        </div>
      </div>
    </AppShell>
  );
}
