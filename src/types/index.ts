// ============================================================
// src/types/index.ts
// Central type definitions for MarketLens
// ============================================================

/** The 5 scoring dimensions that make up the Market Opportunity Score */
export interface OpportunityFactor {
  label: string;
  value: number; // 0–20
  description: string;
}

/** A competitor entry in the competitor table */
export interface Competitor {
  name: string;
  positioning: string;
  estimatedPriceRange: string;
  strength: string;
  weakness: string;
}

/** Full AI-generated market intelligence report data */
export interface ReportData {
  marketScore: number; // 0–100 composite score
  summary: string;
  targetCustomer: string;
  competitorPositioning: string;
  pricingRecommendation: string;
  customerPainPoints: string[];
  demandTrend: string;
  differentiationStrategy: string;
  marketingChannels: string[];
  risks: string[];
  actionPlan: string[];
  competitorTable: Competitor[];
  chartData: {
    opportunityFactors: OpportunityFactor[];
  };
}

/** A saved report record (matches Supabase table schema) */
export interface SavedReport {
  id: string;
  created_at: string;
  user_id?: string | null;
  session_id?: string | null;
  niche: string;
  location: string;
  target_customer: string;
  product_type: string;
  price_range: string | null;
  competitors_input: string | null;
  report_data: ReportData;
  is_mock: boolean;
}

/** Form inputs from the New Analysis page */
export interface AnalysisFormInputs {
  niche: string;
  location: string;
  customer: string;
  productType: string;
  priceRange: string;
  competitors: string;
}

/** API request payload for /api/generate-report */
export interface GenerateReportRequest extends AnalysisFormInputs {
  useMock?: boolean;
}

/** API response from /api/generate-report */
export interface GenerateReportResponse {
  success: boolean;
  report?: SavedReport;
  error?: string;
}

/** Score band label and color based on numeric score */
export type ScoreBand = "strong" | "moderate" | "weak";

export function getScoreBand(score: number): ScoreBand {
  if (score >= 70) return "strong";
  if (score >= 45) return "moderate";
  return "weak";
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return "Strong Opportunity";
  if (score >= 45) return "Moderate Opportunity";
  return "Challenging Market";
}

// v3 trend platform types (feed, watchlist, briefing)
export * from "./trends";
