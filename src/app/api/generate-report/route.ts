// ============================================================
// src/app/api/generate-report/route.ts
// Secure backend route: receives form data, calls AI API,
// stores result in Supabase, returns the saved report.
//
// AI API keys are NEVER exposed to the frontend.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/lib/supabase";
import { buildAnalysisPrompt, parseAIResponse } from "@/lib/ai-prompt";
import { MOCK_REPORT_DATA } from "@/lib/mock-data";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { createOrUpdateTrendSignalFromReport } from "@/lib/tracked-signal";
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
    !process.env.OPENAI_API_KEY;

  let reportData = MOCK_REPORT_DATA;

  if (isMockMode) {
    console.log("[generate-report] Mock mode active — skipping AI call.");
  } else {
    // ── 4. Call AI API ──────────────────────────────────────
    try {
      const prompt = buildAnalysisPrompt({
        niche, location, customer, productType, priceRange: priceRange ?? "", competitors: competitors ?? "",
      });

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a senior market intelligence analyst. Return only valid JSON matching the user's requested schema.",
          },
          { role: "user", content: prompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned no report content.");
      }

      reportData = parseAIResponse(content);
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
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  const sessionId = req.headers.get("x-marketlens-session-id");

  if (!user && !sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: "Report could not be saved: missing anonymous session id.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user?.id ?? null,
      session_id: user ? null : sessionId,
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

  try {
    await createOrUpdateTrendSignalFromReport(data as SavedReport, {
      userId: user?.id,
      sessionId,
    });
  } catch (signalError) {
    console.warn(
      "[generate-report] Report saved, but trend signal creation failed:",
      signalError instanceof Error ? signalError.message : signalError
    );
  }

  // ── 6. Return success ──────────────────────────────────────
  return NextResponse.json({ success: true, report: data as SavedReport });
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
