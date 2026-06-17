// ============================================================
// src/lib/ai-prompt.ts
// Builds the AI prompt and validates/parses the response JSON.
// Used by the OpenAI report generation route.
// ============================================================

import type { AnalysisFormInputs, ReportData, OpportunityFactor } from "@/types";

// ---- Prompt Builder -----------------------------------------

export function buildAnalysisPrompt(inputs: AnalysisFormInputs): string {
  const { niche, location, customer, productType, priceRange, competitors } = inputs;

  return `You are a senior ecommerce product trend analyst specializing in Etsy, Shopify, print-on-demand, handmade products, digital products, and online marketplace competition.

Analyze whether the following product opportunity is worth selling online and return ONLY a valid JSON object - no markdown fences, no commentary, no preamble. The JSON must match this exact schema:

{
  "marketScore": <integer 0-100. Calculated as the sum of 5 factors below, each scored 0-20>,
  "summary": <string: 2-3 paragraph executive summary covering ecommerce demand, trend maturity, saturation risk, and competitive landscape>,
  "targetCustomer": <string: detailed customer persona with demographics, psychographics, shopping behavior, average order value>,
  "competitorPositioning": <string: analysis of the competitive landscape, naming specific incumbents and their strategic weaknesses>,
  "pricingRecommendation": <string: specific pricing strategy with concrete price points, bundle ideas, and psychological pricing rationale>,
  "customerPainPoints": <array of 5-6 specific, concrete pain point strings>,
  "demandTrend": <string: trend analysis with any relevant market data, search trend signals, marketplace observations, or industry statistics. Do not invent sales or revenue data.>,
  "differentiationStrategy": <string: specific, actionable differentiation tactics unique to this product niche, buyer, and sales channel>,
  "marketingChannels": <array of 6-7 specific channel strings, each with a brief tactic note>,
  "risks": <array of 5-6 specific risk strings with mitigation hints>,
  "actionPlan": <array of exactly 6 sequential action item strings, each beginning with a timeframe like "Week 1-2:">,
  "competitorTable": [
    {
      "name": <string>,
      "positioning": <string: 1 sentence>,
      "estimatedPriceRange": <string: e.g. "$15-$35">,
      "strength": <string: 1 sentence>,
      "weakness": <string: 1 sentence>
    }
  ],
  "chartData": {
    "opportunityFactors": [
      { "label": "Demand Strength",     "value": <integer 0-20>, "description": <string: 1 sentence explaining this sub-score> },
      { "label": "Competition (inverted)", "value": <integer 0-20>, "description": <string: higher = less competition = better> },
      { "label": "Pricing Power",       "value": <integer 0-20>, "description": <string> },
      { "label": "Pain Severity",       "value": <integer 0-20>, "description": <string> },
      { "label": "Differentiation Potential", "value": <integer 0-20>, "description": <string> }
    ]
  }
}

IMPORTANT: marketScore MUST equal the exact sum of the 5 opportunityFactors values.

Product details to analyze:
- Product Keyword / Niche: ${niche}
- Target Market / Channel: ${location}
- Target Customer: ${customer}
- Product Type: ${productType}
${priceRange ? `- Price Range: ${priceRange}` : "- Price Range: Not specified (recommend one)"}
${competitors ? `- Known Competitors: ${competitors}` : "- Competitors: Not specified (identify the main ones)"}

Be specific, data-informed, ecommerce-focused, and immediately actionable. Clearly say when evidence is directional or needs validation. Do not promise revenue, sales volume, or guaranteed outcomes unless the user provided real sales data. Return only the JSON object.`;
}

// ---- Response Parser ----------------------------------------

/**
 * Parses and validates the raw AI response string into ReportData.
 * Throws if the JSON is malformed or missing required fields.
 */
export function parseAIResponse(raw: string): ReportData {
  // Strip markdown code fences if the model wrapped its JSON
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `AI returned invalid JSON. Raw response (first 500 chars): ${raw.slice(0, 500)}`
    );
  }

  const data = parsed as Record<string, unknown>;

  // Validate required top-level fields
  const required = [
    "marketScore",
    "summary",
    "targetCustomer",
    "customerPainPoints",
    "actionPlan",
    "competitorTable",
    "chartData",
  ];

  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`AI response missing required field: "${field}"`);
    }
  }

  // Ensure score is a valid integer
  const score = Number(data.marketScore);
  if (isNaN(score) || score < 0 || score > 100) {
    throw new Error(`Invalid marketScore: ${data.marketScore}`);
  }

  // Re-compute marketScore from factor sum to ensure consistency
  const factors = (
    (data.chartData as Record<string, unknown>)
      ?.opportunityFactors as OpportunityFactor[]
  ) ?? [];

  const computedScore = factors.reduce(
    (sum: number, f: OpportunityFactor) => sum + Number(f.value),
    0
  );

  return {
    ...data,
    marketScore: computedScore || score,
  } as ReportData;
}
