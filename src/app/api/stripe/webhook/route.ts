import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { createStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
};

function requireWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return secret;
}

function planForSubscriptionStatus(status?: string) {
  return status && ["active", "trialing"].includes(status) ? "pro" : "free";
}

async function updateProfileForSubscription(subscription: Record<string, any>) {
  const supabase = createServerSupabase();
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  const { error } = await supabase
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

  if (error) throw error;
}

async function handleCheckoutCompleted(session: Record<string, any>) {
  const supabase = createServerSupabase();
  const userId = session.metadata?.supabase_user_id || session.client_reference_id;
  if (!userId) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "pro",
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      stripe_subscription_status: "active",
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  let event: StripeEvent;

  try {
    const webhookSecret = requireWebhookSecret();
    const stripe = createStripeClient();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret) as StripeEvent;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook verification failed.";
    return NextResponse.json(
      { received: false, error: message },
      { status: message.includes("STRIPE_WEBHOOK_SECRET") || message.includes("stripe package") ? 500 : 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data: processed, error: lookupError } = await supabase
    .from("processed_stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ received: false, error: lookupError.message }, { status: 500 });
  }

  if (processed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
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

    const { error: insertError } = await supabase.from("processed_stripe_events").insert({
      event_id: event.id,
      event_type: event.type,
    });

    if (insertError && insertError.code !== "23505") throw insertError;
  } catch (processingError) {
    return NextResponse.json(
      {
        received: false,
        error: processingError instanceof Error ? processingError.message : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
