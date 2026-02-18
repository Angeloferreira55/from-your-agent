import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_CONFIG } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No payment method on file" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: STRIPE_CONFIG.portalReturnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
