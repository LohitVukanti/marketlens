// ============================================================
// src/app/api/generate-report/route.ts
// Secure backend route: receives form data, calls AI API,
// stores result in Supabase, returns the saved report.
//
// AI API keys are NEVER exposed to the frontend.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase";
import { buildAnalysisPrompt, parseAIResponse } from "@/lib/ai-prompt";
import { MOCK_REPORT_DATA } from "@/lib/mock-data";
import type {
  GenerateReportRequest,
  GenerateReportResponse,
  SavedReport,
} from "@/types";

// Rate limiting: track requests per IP (simple in-memory; use Redis in prod)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse<GenerateReportResponse>> {
  // ── 1. Rate limiting ──────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  // ── 2. Parse and validate request body ───────────────────
  let body: GenerateReportRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { niche, location, customer, productType, priceRange, competitors, useMock } = body;

  if (!niche || !location || !customer || !productType) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: niche, location, customer, productType." },
      { status: 400 }
    );
  }

  // ── 3. Mock mode: skip AI, return sample data ─────────────
  const isMockMode =
    useMock === true ||
    process.env.NEXT_PUBLIC_MOCK_MODE === "true" ||
    !process.env.ANTHROPIC_API_KEY;

  let reportData = MOCK_REPORT_DATA;

  if (isMockMode) {
    console.log("[generate-report] Mock mode active — skipping AI call.");
  } else {
    // ── 4. Call AI API ──────────────────────────────────────
    try {
      const prompt = buildAnalysisPrompt({
        niche, location, customer, productType, priceRange: priceRange ?? "", competitors: competitors ?? "",
      });

      const provider = process.env.AI_PROVIDER ?? "anthropic";

      if (provider === "anthropic") {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          throw new Error("AI returned no text content.");
        }
        reportData = parseAIResponse(textBlock.text);
      } else {
        // OpenAI fallback (requires OPENAI_API_KEY and 'openai' package)
        throw new Error(
          "OpenAI provider is not yet wired. Set AI_PROVIDER=anthropic and provide ANTHROPIC_API_KEY."
        );
      }
    } catch (err) {
      console.error("[generate-report] AI call failed:", err);
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? `AI generation failed: ${err.message}`
              : "Unknown AI error. Check server logs.",
        },
        { status: 500 }
      );
    }
  }

  // ── 5. Save to Supabase ────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("your-project")) {
    console.error("[generate-report] Supabase not configured — cannot save report.");
    return NextResponse.json(
      {
        success: false,
        error: "Report could not be saved: Supabase is not configured on the server.",
      },
      { status: 500 }
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      niche,
      location,
      target_customer: customer,
      product_type: productType,
      price_range: priceRange ?? null,
      competitors_input: competitors ?? null,
      report_data: reportData,
      is_mock: isMockMode,
    })
    .select()
    .single();

  if (error) {
    console.error("[generate-report] Supabase insert error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Report could not be saved: ${error.message}`,
      },
      { status: 500 }
    );
  }

  // ── 6. Return success ──────────────────────────────────────
  return NextResponse.json({ success: true, report: data as SavedReport });
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
