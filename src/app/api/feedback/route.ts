import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { sendEmail } from "@/lib/resend";

const FEEDBACK_TYPES = new Set([
  "bug",
  "data_issue",
  "confusing_ux",
  "feature_request",
  "would_pay",
  "would_not_pay",
  "other",
]);

const FEEDBACK_LABELS: Record<string, string> = {
  bug: "Bug",
  data_issue: "Data issue",
  confusing_ux: "Confusing UX",
  feature_request: "Feature request",
  would_pay: "Would pay",
  would_not_pay: "Would not pay",
  other: "Other",
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rateLimitKey(request: NextRequest, sessionId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  return sessionId || ip;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);

  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const feedbackType = cleanText(payload.feedbackType, 50);
  const message = cleanText(payload.message, 4000);
  const email = cleanText(payload.email, 254) || null;
  const pageUrl = cleanText(payload.pageUrl, 1000) || null;
  const sessionId =
    cleanText(payload.sessionId, 200) ||
    cleanText(request.headers.get("x-marketlens-session-id"), 200) ||
    null;

  if (!FEEDBACK_TYPES.has(feedbackType)) {
    return NextResponse.json({ success: false, error: "Choose a valid feedback type." }, { status: 400 });
  }

  if (message.length < 5) {
    return NextResponse.json({ success: false, error: "Feedback message is too short." }, { status: 400 });
  }

  const key = rateLimitKey(request, sessionId ?? "");
  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { success: false, error: "Too many feedback submissions. Please try again later." },
      { status: 429 }
    );
  }

  const user = await getUserFromAuthorization(request.headers.get("authorization"));
  const userAgent = cleanText(request.headers.get("user-agent"), 1000) || null;
  const supabase = createServerSupabase();

  const row = {
    user_id: user?.id ?? null,
    session_id: sessionId,
    email,
    feedback_type: feedbackType,
    message,
    page_url: pageUrl,
    user_agent: userAgent,
  };

  const { data, error } = await supabase
    .from("beta_feedback")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[feedback] Supabase insert failed:", error.message);
    return NextResponse.json(
      { success: false, error: "Feedback could not be saved. Please try again." },
      { status: 500 }
    );
  }

  let emailSent = false;
  const to = process.env.FEEDBACK_TO_EMAIL || "riccu15@gmail.com";
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
      const safePage = pageUrl ? escapeHtml(pageUrl) : "n/a";
      const safeEmail = email ? escapeHtml(email) : "n/a";
      const safeSession = sessionId ? escapeHtml(sessionId) : "n/a";
      const safeUser = user?.id ? escapeHtml(user.id) : "n/a";

      await sendEmail({
        to,
        subject: `MarketLens beta feedback: ${FEEDBACK_LABELS[feedbackType]}`,
        text: [
          `Type: ${FEEDBACK_LABELS[feedbackType]}`,
          `Email: ${email || "n/a"}`,
          `User: ${user?.id || "n/a"}`,
          `Session: ${sessionId || "n/a"}`,
          `Page: ${pageUrl || "n/a"}`,
          "",
          message,
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2>MarketLens beta feedback</h2>
            <p><strong>Type:</strong> ${escapeHtml(FEEDBACK_LABELS[feedbackType])}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>User:</strong> ${safeUser}</p>
            <p><strong>Session:</strong> ${safeSession}</p>
            <p><strong>Page:</strong> ${safePage}</p>
            <hr />
            <p>${safeMessage}</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (emailError) {
      console.warn(
        "[feedback] Saved feedback but email delivery failed:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }
  }

  return NextResponse.json({
    success: true,
    feedbackId: data?.id,
    emailSent,
  });
}
