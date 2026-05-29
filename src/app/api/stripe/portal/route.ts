import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getUserFromAuthorization } from "@/lib/server-auth";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthorization(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json(
      { success: false, error: "No Stripe customer found. Start checkout first." },
      { status: 400 }
    );
  }

  try {
    const session = await createBillingPortalSession(customerId);
    return NextResponse.json({ success: true, url: session.url });
  } catch (portalError) {
    return NextResponse.json(
      {
        success: false,
        error: portalError instanceof Error ? portalError.message : "Could not create billing portal session.",
      },
      { status: 500 }
    );
  }
}
