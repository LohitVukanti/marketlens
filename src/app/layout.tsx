// ============================================================
// src/app/layout.tsx
// Root layout — sets fonts, metadata, and global wrappers.
// ============================================================

import type { Metadata } from "next";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  title: "MarketLens — AI Market Intelligence",
  description:
    "Get a complete AI-powered market intelligence report for any business idea. Competitor analysis, pricing strategy, demand trends, and a step-by-step action plan in under 60 seconds.",
  keywords: [
    "market research",
    "business intelligence",
    "AI market analysis",
    "competitor analysis",
    "pricing strategy",
    "small business tools",
  ],
  openGraph: {
    title: "MarketLens — AI Market Intelligence",
    description: "Know your market before you commit.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
