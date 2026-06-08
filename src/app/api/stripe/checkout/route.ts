import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { createBillingPortalSession, createCheckoutSession, createStripeCustomer } from "@/lib/stripe";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  if (!user?.email) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, plan, stripe_customer_id, stripe_subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let customerId = profile?.stripe_customer_id as string | undefined;
  const subscriptionStatus = profile?.stripe_subscription_status as string | undefined;

  if (profile?.plan === "pro" || ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus ?? "")) {
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Your account already has an active Pro subscription." },
        { status: 409 }
      );
    }

    try {
      const portal = await createBillingPortalSession(customerId);
      return NextResponse.json({
        success: true,
        url: portal.url,
        message: "Your account already has an active Pro subscription. Opening billing portal.",
      });
    } catch (portalError) {
      return NextResponse.json(
        {
          success: false,
          error: portalError instanceof Error ? portalError.message : "Open billing portal to manage your subscription.",
        },
        { status: 409 }
      );
    }
  }

  if (!customerId) {
    const customer = await createStripeCustomer(user.email, user.id);
    customerId = customer.id;

    const { error: upsertError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      plan: profile?.plan ?? "free",
      stripe_customer_id: customerId,
    });

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }
  }

  try {
    const session = await createCheckoutSession({ customerId, userId: user.id });
    return NextResponse.json({ success: true, url: session.url });
  } catch (checkoutError) {
    return NextResponse.json(
      {
        success: false,
        error: checkoutError instanceof Error ? checkoutError.message : "Could not create checkout session.",
      },
      { status: 500 }
    );
  }
}
