// ============================================================
// src/components/charts/OpportunityCharts.tsx
// Recharts visualizations for the dashboard report.
// All chart components are client-side only.
// ============================================================

"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import type { OpportunityFactor } from "@/types";

// ---- Color palette for bars ---------------------------------
const BAR_COLORS = ["#4f46e5", "#7c3aed", "#059669", "#d97706", "#1d4ed8"];

// ---- Custom Tooltip -----------------------------------------
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-slate-500">
          Score: <span className="font-bold text-brand-700">{entry.value}/20</span>
        </p>
      ))}
    </div>
  );
}

// ---- Radar / Spider Chart -----------------------------------
export function OpportunityRadar({
  factors,
}: {
  factors: OpportunityFactor[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={factors} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid gridType="polygon" stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748b", fontFamily: "var(--font-sans)" }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ---- Horizontal Bar Chart -----------------------------------
export function OpportunityBarChart({
  factors,
}: {
  factors: OpportunityFactor[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={factors}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barCategoryGap="30%"
      >
        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
        <XAxis
          type="number"
          domain={[0, 20]}
          tickCount={5}
          tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 10, fill: "#64748b", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
          {factors.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Score breakdown donut (simplified bar version) ---------
export function ScoreBreakdownBars({
  factors,
}: {
  factors: OpportunityFactor[];
}) {
  const total = factors.reduce((s, f) => s + f.value, 0);

  return (
    <div className="space-y-3">
      {factors.map((f, i) => {
        const pct = (f.value / 20) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-600 font-medium">{f.label}</span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {f.value}/20
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
            </div>
            {f.description && (
              <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
            )}
          </div>
        );
      })}
      <div className="pt-2 border-t border-slate-100 flex justify-between">
        <span className="text-xs font-semibold text-slate-500">Total Score</span>
        <span className="text-xs font-bold text-brand-700">{total}/100</span>
      </div>
    </div>
  );
}
