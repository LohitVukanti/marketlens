// ============================================================
// src/app/analyze/page.tsx
// New Analysis page — form inputs + submit logic.
// Calls /api/generate-report (secure backend route).
// ============================================================
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { AlertBox, Spinner } from "@/components/ui";
import type { AnalysisFormInputs, GenerateReportResponse } from "@/types";

const PRODUCT_TYPES = [
  "Physical product (retail / wholesale)",
  "Digital product / online course",
  "Local service / restaurant / café",
  "E-commerce / Etsy / Shopify store",
  "B2B service / consulting",
  "Subscription / SaaS",
  "Freelance / creative services",
  "Real estate / property",
  "Mobile app / software",
];

const LOADING_STEPS = [
  "Identifying market demand signals…",
  "Profiling target customer segment…",
  "Mapping competitive landscape…",
  "Calculating pricing power…",
  "Assessing differentiation potential…",
  "Generating action plan…",
];

// ---- Form Field Component -----------------------------------
function Field({
  label,
  optional,
  children,
  hint,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="field-label">
        {label}
        {optional && (
          <span className="ml-2 text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full text-[10px] normal-case font-semibold tracking-normal">
            Optional
          </span>
        )}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================
export default function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMockParam = searchParams.get("mock") === "true";

  const [form, setForm] = useState<AnalysisFormInputs>({
    niche: "",
    location: "",
    customer: "",
    productType: "",
    priceRange: "",
    competitors: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // If ?mock=true, auto-submit with mock flag
  useEffect(() => {
    if (isMockParam) {
      handleMockSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle through loading messages
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const set = (field: keyof AnalysisFormInputs) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): string | null {
    if (!form.niche.trim())    return "Please describe your business idea or niche.";
    if (!form.location.trim()) return "Please enter a location or target market.";
    if (!form.customer.trim()) return "Please describe your target customer.";
    if (!form.productType)     return "Please select a product or service type.";
    return null;
  }

  async function submit(useMock = false) {
    if (!useMock) {
      const err = validate();
      if (err) { setError(err); return; }
    }
    setError(null);
    setLoading(true);

    try {
      const payload = useMock
        ? { niche: "Handmade Soy Candles", location: "Tampa, FL", customer: "Millennial women 25-38", productType: "E-commerce / Etsy / Shopify store", priceRange: "$26-$48", competitors: "Yankee Candle, Bath & Body Works", useMock: true }
        : { ...form, useMock: false };

      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: GenerateReportResponse = await res.json();

      if (!data.success || !data.report) {
        throw new Error(data.error ?? "Unknown error from server.");
      }

      // Store in sessionStorage so the dashboard page can read it
      sessionStorage.setItem("ml_report", JSON.stringify(data.report));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleMockSubmit() { submit(true); }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); submit(false); }

  // ---- Loading screen ----------------------------------------
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <Spinner className="mx-auto mb-6" />
            <h2 className="font-serif text-2xl text-slate-800 mb-2">Analyzing your market…</h2>
            <p className="text-sm text-slate-400 mb-8">
              Our AI is running research, scoring your opportunity, and drafting your report.
            </p>
            <div className="space-y-3 text-left">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    i < loadingStep
                      ? "text-emerald-600"
                      : i === loadingStep
                      ? "text-brand-700 font-medium"
                      : "text-slate-300"
                  }`}
                >
                  <span className="text-base">
                    {i < loadingStep ? "✓" : i === loadingStep ? "⟳" : "○"}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ---- Form --------------------------------------------------
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-3">New Market Analysis</h1>
          <p className="text-slate-500">
            Fill in what you know — the more detail you provide, the sharper and more actionable your intelligence report will be.
          </p>
        </div>

        {/* Scoring explainer */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6 flex gap-3 text-sm">
          <span className="text-lg flex-shrink-0">📐</span>
          <div>
            <p className="font-semibold text-brand-800 mb-1">How your score is calculated</p>
            <p className="text-brand-700 text-xs leading-relaxed">
              We combine 5 econometric factors — Demand Strength, Competition Intensity (inverted), Pricing Power, Customer Pain Severity, and Differentiation Potential — each scored 0–20 — into a composite Market Opportunity Score (0–100).
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field
                label="Business idea or niche *"
                hint="Be specific: 'handmade soy candles' beats 'candles'"
              >
                <input
                  className="input-base"
                  placeholder="e.g. handmade soy candles, Korean BBQ restaurant, online fitness coaching"
                  value={form.niche}
                  onChange={set("niche")}
                  maxLength={200}
                />
              </Field>
            </div>

            <Field label="Location or target market *">
              <input
                className="input-base"
                placeholder="e.g. Tampa, FL or Online US market"
                value={form.location}
                onChange={set("location")}
                maxLength={100}
              />
            </Field>

            <Field label="Target customer *" hint="Demographics, psychographics, lifestyle">
              <input
                className="input-base"
                placeholder="e.g. millennial women 25-35, budget-conscious parents"
                value={form.customer}
                onChange={set("customer")}
                maxLength={200}
              />
            </Field>

            <Field label="Product or service type *">
              <select
                className="input-base"
                value={form.productType}
                onChange={set("productType")}
              >
                <option value="">Select type…</option>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Price range" optional hint="e.g. $15–$45/item or $80/hr">
              <input
                className="input-base"
                placeholder="e.g. $15–$45 per item"
                value={form.priceRange}
                onChange={set("priceRange")}
                maxLength={100}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Main competitors"
                optional
                hint="Comma-separated list of brands or business names you know of"
              >
                <input
                  className="input-base"
                  placeholder="e.g. Yankee Candle, Bath & Body Works, local boutiques"
                  value={form.competitors}
                  onChange={set("competitors")}
                  maxLength={300}
                />
              </Field>
            </div>
          </div>

          {/* Error */}
          {error && <AlertBox type="error" message={error} />}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center py-3.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Generate Report
            </button>
            <button
              type="button"
              onClick={handleMockSubmit}
              className="btn-secondary flex-1 justify-center py-3.5 border-dashed text-slate-400 hover:text-slate-600"
            >
              Use mock data (no API key needed)
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Your data is sent securely to our backend — API keys are never exposed to the browser.
          </p>
        </form>
      </main>
    </>
  );
}
