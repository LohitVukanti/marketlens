type StripeSessionResponse = {
  id: string;
  url?: string;
  customer?: string;
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

function requireStripeSecret() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return key;
}

export function createStripeClient() {
  let Stripe;
  try {
    Stripe = Function("return require")()("stripe");
  } catch {
    throw new Error("The stripe package is required for webhook verification. Run npm install stripe.");
  }

  return Stripe(requireStripeSecret());
}

async function stripeRequest<T>(path: string, params: URLSearchParams) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireStripeSecret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Stripe request failed with ${response.status}`);
  }

  return payload as T;
}

export async function createStripeCustomer(email: string, userId: string) {
  const params = new URLSearchParams();
  params.set("email", email);
  params.set("metadata[supabase_user_id]", userId);

  return stripeRequest<{ id: string }>("/customers", params);
}

export async function createCheckoutSession({
  customerId,
  userId,
}: {
  customerId: string;
  userId: string;
}) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!priceId) throw new Error("STRIPE_PRO_PRICE_ID is not configured.");

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("customer", customerId);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", `${appUrl}/upgrade?checkout=success`);
  params.set("cancel_url", `${appUrl}/upgrade?checkout=cancelled`);
  params.set("client_reference_id", userId);
  params.set("metadata[supabase_user_id]", userId);
  params.set("subscription_data[metadata][supabase_user_id]", userId);
  params.set("allow_promotion_codes", "true");

  return stripeRequest<StripeSessionResponse>("/checkout/sessions", params);
}

export async function createBillingPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("return_url", `${appUrl}/upgrade`);

  return stripeRequest<StripeSessionResponse>("/billing_portal/sessions", params);
}
