// ============================================================
// src/app/page.tsx
// Landing page — value prop, use cases, how it works, CTA.
// ============================================================

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

const USE_CASES = [
  { icon: "🛍️", title: "Etsy & Shopify Sellers", desc: "Find white-space opportunities before launching your store." },
  { icon: "🍕", title: "Restaurant Owners", desc: "Understand local competition and optimal pricing for your cuisine." },
  { icon: "📦", title: "Product Entrepreneurs", desc: "Validate demand and identify differentiation before spending a dollar." },
  { icon: "💼", title: "Small Businesses", desc: "Get data-backed strategies you'd normally pay a consultant $5K for." },
  { icon: "🎓", title: "Students & Researchers", desc: "Real market data analysis for case studies and entrepreneurship courses." },
  { icon: "🏠", title: "Local Service Providers", desc: "Price competitively and market smarter in your specific city and neighborhood." },
];

const HOW_IT_WORKS = [
  { num: "01", title: "Describe your idea", desc: "Enter your niche, location, target customers, and known competitors." },
  { num: "02", title: "AI analyzes the market", desc: "Our model scores demand strength, competition, pricing power, pain severity, and differentiation." },
  { num: "03", title: "Get your full report", desc: "A complete dashboard with charts, competitor table, pricing strategy, and a clear action plan." },
  { num: "04", title: "Execute with confidence", desc: "Save, export, and revisit reports as your strategy evolves." },
];

const STATS = [
  { n: "10+", label: "Intelligence Metrics" },
  { n: "< 60s", label: "Report Generation" },
  { n: "5-Factor", label: "Scoring Model" },
  { n: "Free", label: "MVP Access" },
];

const PLATFORM_LINKS = [
  {
    href: "/feed",
    icon: "◈",
    title: "Trend Feed",
    desc: "Browse live ecommerce opportunity signals ranked by our 5-factor scoring model.",
    badge: "Live",
  },
  {
    href: "/watchlist",
    icon: "☆",
    title: "Watchlist",
    desc: "Track niches you care about and spot score changes before everyone else.",
    badge: null,
  },
  {
    href: "/briefing",
    icon: "◎",
    title: "Daily Briefing",
    desc: "Get a morning intelligence summary: top movers, alerts, and one deep-dive pick.",
    badge: "New",
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          {/* Background decoration */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-8 border border-brand-100">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-dot" />
              AI-Powered Market Intelligence
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-slate-900 mb-6 leading-[1.1]">
              Know your market<br />
              <em className="gradient-text not-italic">before you commit</em>
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Get a complete market intelligence report for any business idea — competitor analysis, pricing strategy, demand trends, and a step-by-step action plan — in under 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Link href="/analyze" className="btn-primary text-base px-8 py-4 shadow-lg">
                Generate Free Report →
              </Link>
              <Link href="/analyze?mock=true" className="btn-secondary text-base px-6 py-4">
                See Example Report
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {PLATFORM_LINKS.map(({ href, title, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 transition-all"
                >
                  {title}
                  {badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              No account required · Works without API key in demo mode
            </p>
          </div>

          {/* Dashboard preview card */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
            <div className="card overflow-hidden shadow-xl border-slate-200">
              <div className="bg-gradient-to-r from-brand-700 to-violet-600 px-6 py-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {["bg-red-400","bg-amber-400","bg-emerald-400"].map(c=>(
                    <div key={c} className={`w-3 h-3 rounded-full ${c} opacity-80`}/>
                  ))}
                </div>
                <span className="text-white/60 text-xs font-mono">marketlens.app/dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Market Score", value: "74/100", color: "text-emerald-600" },
                  { label: "Competitors", value: "5 mapped", color: "text-brand-700" },
                  { label: "Action Steps", value: "6 steps", color: "text-violet-600" },
                  { label: "Pain Points", value: "6 found", color: "text-amber-600" },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Score Breakdown</p>
                  {[
                    { label: "Demand Strength", w: "80%", color: "bg-brand-500" },
                    { label: "Pricing Power", w: "75%", color: "bg-violet-500" },
                    { label: "Pain Severity", w: "85%", color: "bg-emerald-500" },
                    { label: "Differentiation", w: "70%", color: "bg-amber-500" },
                    { label: "Competition (inv.)", w: "60%", color: "bg-blue-500" },
                  ].map(b => (
                    <div key={b.label} className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-slate-500 w-36 flex-shrink-0">{b.label}</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${b.color}`} style={{ width: b.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform ──────────────────────────────────────── */}
        <section className="py-16 bg-surface-secondary border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-3">
                Explore the intelligence platform
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Check trends daily, track your niches, and read your morning briefing — no report required.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLATFORM_LINKS.map(({ href, icon, title, desc, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="card p-6 hover:shadow-card-hover transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{icon}</span>
                    {badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                        {badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans font-semibold text-slate-800 mb-2 group-hover:text-brand-700 transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 flex-1">{desc}</p>
                  <span className="mt-4 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
                    Open {title} →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────── */}
        <section className="bg-brand-700 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.n}>
                <p className="font-serif text-3xl text-white mb-1">{s.n}</p>
                <p className="text-brand-200 text-xs font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Use Cases ─────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-4">Built for entrepreneurs like you</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Whether you're validating your first idea or expanding your existing business, MarketLens gives you the intelligence to move fast and move smart.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {USE_CASES.map(uc => (
                <div key={uc.title} className="card p-6 hover:shadow-card-hover transition-shadow">
                  <div className="text-3xl mb-3">{uc.icon}</div>
                  <h3 className="font-sans font-semibold text-slate-800 mb-2">{uc.title}</h3>
                  <p className="text-sm text-slate-500">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────── */}
        <section className="py-20 bg-surface-secondary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-4">How it works</h2>
              <p className="text-slate-500 max-w-md mx-auto">Four simple steps from idea to full market intelligence report.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.num} className="relative">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-brand-100 -translate-y-px z-0" />
                  )}
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold mb-4">
                      {step.num}
                    </div>
                    <h3 className="font-sans font-semibold text-slate-800 mb-2 text-sm">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-4">
              Ready to find your market edge?
            </h2>
            <p className="text-slate-500 mb-8">
              Generate your first market intelligence report in under a minute. No account required.
            </p>
            <Link href="/analyze" className="btn-primary text-base px-10 py-4 shadow-lg mx-auto">
              Start Your Free Analysis →
            </Link>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className="border-t border-slate-100 py-8 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} MarketLens · AI-Powered Market Intelligence</p>
            <p>Built with Next.js · Tailwind · OpenAI · Supabase</p>
          </div>
        </footer>
      </main>
    </>
  );
}
