// ============================================================
// src/components/ui/index.tsx
// Reusable UI primitives used across pages.
// ============================================================

import { cn } from "@/lib/utils";

// ---- Badge --------------------------------------------------
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "amber" | "red" | "blue" | "purple";
  className?: string;
}

const BADGE_VARIANTS: Record<string, string> = {
  default: "bg-slate-100 text-slate-600",
  green:   "bg-emerald-100 text-emerald-700",
  amber:   "bg-amber-100 text-amber-700",
  red:     "bg-red-100 text-red-700",
  blue:    "bg-blue-100 text-blue-700",
  purple:  "bg-brand-50 text-brand-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        BADGE_VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ---- Section Card -------------------------------------------
export function SectionCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card p-5 sm:p-6", className)}>
      <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}

// ---- Circular Score Ring ------------------------------------
export function ScoreRing({
  score,
  size = 100,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70 ? "#059669" : score >= 45 ? "#d97706" : "#dc2626";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="8"
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 1.2s ease",
        }}
      />
      {/* Score text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 4}
        fontWeight="700"
        fill={color}
        fontFamily="var(--font-sans)"
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + size / 6.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 8}
        fill="#94a3b8"
        fontFamily="var(--font-sans)"
      >
        /100
      </text>
    </svg>
  );
}

// ---- Loading Spinner ----------------------------------------
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// ---- Skeleton loader ----------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

// ---- Empty state --------------------------------------------
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-serif text-xl text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// ---- Alert box ----------------------------------------------
export function AlertBox({
  type = "error",
  message,
}: {
  type?: "error" | "warning" | "success";
  message: string;
}) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[type])}>
      {message}
    </div>
  );
}

// ---- Prose text block (for AI-generated text) ---------------
export function ProseBlock({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // Split on double newlines to render paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className={cn("text-sm text-slate-600 leading-relaxed ai-prose", className)}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

// ---- Factor bar (for score breakdown) -----------------------
export function FactorBar({
  label,
  value,
  max = 20,
  description,
}: {
  label: string;
  value: number;
  max?: number;
  description?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor =
    pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-700 tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-slate-400 mt-1 hidden group-hover:block">
          {description}
        </p>
      )}
    </div>
  );
}
