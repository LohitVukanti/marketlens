import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
};

function verifyStripeSignature(payload: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const expectedSignature = parts.v1;
  if (!timestamp || !expectedSignature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  if (digest.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expectedSignature));
}

function planForSubscriptionStatus(status?: string) {
  return status && ["active", "trialing"].includes(status) ? "pro" : "free";
}

async function updateProfileForSubscription(subscription: Record<string, any>) {
  const supabase = createServerSupabase();
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase
    .from("profiles")
    .update({
      plan: planForSubscriptionStatus(subscription.status),
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      plan_current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    })
    .eq("user_id", userId);
}

async function handleCheckoutCompleted(session: Record<string, any>) {
  const supabase = createServerSupabase();
  const userId = session.metadata?.supabase_user_id || session.client_reference_id;
  if (!userId) return;

  await supabase
    .from("profiles")
    .update({
      plan: "pro",
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      stripe_subscription_status: "active",
    })
    .eq("user_id", userId);
}

export async function POST(req: NextRequest) {
  const payload = await req.text();

  try {
    if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"))) {
      return NextResponse.json({ received: false, error: "Invalid signature." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { received: false, error: error instanceof Error ? error.message : "Webhook verification failed." },
      { status: 500 }
    );
  }

  const event = JSON.parse(payload) as StripeEvent;

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await updateProfileForSubscription(event.data.object);
  }

  return NextResponse.json({ received: true });
}
