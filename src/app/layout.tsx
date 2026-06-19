// ============================================================
// src/app/layout.tsx
// Root layout — sets fonts, metadata, and global wrappers.
// ============================================================

import type { Metadata } from "next";
import FeedbackWidget from "@/components/ui/FeedbackWidget";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  title: "MarketLens - Ecommerce Product Trend Intelligence",
  description:
    "Find ecommerce product trends before they go mainstream. Track acceleration, saturation, source confidence, and product opportunity signals for Etsy, Shopify, and POD sellers.",
  keywords: [
    "ecommerce trends",
    "product research",
    "Etsy trends",
    "Shopify product ideas",
    "print on demand trends",
    "trend intelligence",
  ],
  openGraph: {
    title: "MarketLens - Ecommerce Product Trend Intelligence",
    description: "Find ecommerce product trends before they go mainstream.",
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
        <FeedbackWidget />
      </body>
    </html>
  );
}
