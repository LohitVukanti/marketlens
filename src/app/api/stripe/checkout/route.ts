import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  if (!user?.email) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, plan, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let customerId = profile?.stripe_customer_id as string | undefined;
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
