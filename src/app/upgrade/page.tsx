"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { getCurrentProfile, type MarketLensPlan } from "@/lib/auth";

const FEATURES = [
  "Unlimited watchlist tracking",
  "Breakout alert thresholds",
  "Daily personalized briefings",
  "Deeper Reddit and Etsy signal context",
  "Priority signal monitoring",
  "Beta pricing coming soon",
];

export default function UpgradePage() {
  const [plan, setPlan] = useState<MarketLensPlan>("free");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    getCurrentProfile()
      .then((profile) => {
        if (profile?.plan) setPlan(profile.plan);
      })
      .catch(() => {});
  }, []);

  async function callStripeEndpoint(path: string, loadingState: "checkout" | "portal") {
    setLoading(loadingState);
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMessage("Log in or create an account before upgrading.");
        return;
      }

      const response = await fetch(path, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Stripe session could not be created.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <AppShell title="Pro Access" subtitle="Public beta access and pricing waitlist">
      <div className="max-w-3xl">
        <div className="rounded-2xl p-6 border mb-6" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent-bright)" }}>
            Public Beta
          </p>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Pro is not open yet</h2>
            <p className="text-sm pb-1" style={{ color: "var(--text-muted)" }}>beta pricing coming soon</p>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            MarketLens is currently collecting beta feedback on ecommerce trend quality, mobile usability, and analysis workflows. You can use the core product now; paid Pro will open after the data layer is stronger.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {FEATURES.map((feature) => (
            <div key={feature} className="card p-4 flex items-center gap-3">
              <span className="badge badge-blue text-[10px]">Beta</span>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{feature}</span>
            </div>
          ))}
        </div>

        <div className="card p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {plan === "pro" ? "Your account is on Pro" : "Request beta Pro access"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              No live payment is required for public beta. Use the Feedback button to request access or tell us what would make Pro worth paying for.
            </p>
            {message && (
              <p className="text-xs mt-3" style={{ color: "#fbbf24" }}>
                {message}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setMessage("Thanks. Use the Feedback button and choose 'Would pay' to request Pro access during beta.")}
              className="btn-primary text-sm px-5 py-2.5"
              disabled={loading !== null}
            >
              {plan === "pro" ? "Pro Active" : "Request Pro Access"}
            </button>
            <button
              onClick={() => callStripeEndpoint("/api/stripe/portal", "portal")}
              className="btn-secondary text-sm px-5 py-2.5"
              disabled={loading !== null}
            >
              {loading === "portal" ? "Opening..." : "Billing Portal"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.06)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#fbbf24" }}>
            Stripe test mode
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            Stripe checkout remains available for admin/demo testing only. It is not the public beta upgrade flow.
          </p>
          <button
            onClick={() => callStripeEndpoint("/api/stripe/checkout", "checkout")}
            className="btn-secondary text-xs px-4 py-2"
            disabled={loading !== null || plan === "pro"}
          >
            {loading === "checkout" ? "Opening..." : "Open test checkout"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
