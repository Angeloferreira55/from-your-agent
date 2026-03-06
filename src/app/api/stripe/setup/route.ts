import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/stripe/helpers";
import { STRIPE_CONFIG } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("agent_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const customerId = await getOrCreateStripeCustomer(profile.id);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: STRIPE_CONFIG.checkoutSuccessUrl,
      cancel_url: STRIPE_CONFIG.checkoutCancelUrl,
      metadata: {
        agent_id: profile.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe setup] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
