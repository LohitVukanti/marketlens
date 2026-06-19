"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getAnonymousSessionId } from "@/lib/watchlist";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "data_issue", label: "Data issue" },
  { value: "confusing_ux", label: "Confusing UX" },
  { value: "feature_request", label: "Feature request" },
  { value: "would_pay", label: "Would pay" },
  { value: "would_not_pay", label: "Would not pay" },
  { value: "other", label: "Other" },
];

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!email && data.user?.email) setEmail(data.user.email);
      })
      .catch(() => {});
  }, [email, open]);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      const sessionId = getAnonymousSessionId();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.set("X-MarketLens-Session-Id", sessionId);
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          feedbackType,
          message,
          email,
          pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
          sessionId,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Feedback could not be sent.");
      }

      setStatus("Thanks. Your feedback was saved.");
      setMessage("");
      setFeedbackType("bug");
      setTimeout(() => setOpen(false), 1200);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback could not be sent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus("");
        }}
        className="fixed bottom-20 right-4 z-[70] rounded-full border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 md:bottom-5 md:right-5"
      >
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Send beta feedback</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Bugs, confusing data, mobile issues, and pay/not-pay reactions are all useful.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close feedback form"
              >
                x
              </button>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4 p-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Type
                </span>
                <select
                  className="input-base"
                  value={feedbackType}
                  onChange={(event) => setFeedbackType(event.target.value)}
                >
                  {FEEDBACK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Message
                </span>
                <textarea
                  className="input-base min-h-32 resize-y"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={4000}
                  required
                  placeholder="What happened, what felt confusing, or what would make this useful enough to keep using?"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Email optional
                </span>
                <input
                  className="input-base"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  placeholder="you@example.com"
                />
              </label>

              {status && (
                <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700">
                  {status}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || message.trim().length < 5}
                  className="btn-primary flex-1 justify-center"
                >
                  {submitting ? "Sending..." : "Send feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
