// ============================================================
// src/app/layout.tsx
// Root layout — sets fonts, metadata, and global wrappers.
// ============================================================

import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

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
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
