import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, stripe_customer_id, subscription_status, stripe_coupon_id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Get payment method info from Stripe
  let paymentMethod = null;
  if (profile.stripe_customer_id) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: "card",
        limit: 1,
      });
      if (paymentMethods.data.length > 0) {
        const pm = paymentMethods.data[0];
        paymentMethod = {
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          exp_month: pm.card?.exp_month,
          exp_year: pm.card?.exp_year,
        };
      }
    } catch {
      // Customer may not exist in Stripe yet
    }
  }

  // Get billing records
  const { data: billingRecords } = await admin
    .from("billing_records")
    .select("*")
    .eq("agent_id", profile.id)
    .order("billing_date", { ascending: false })
    .limit(20);

  // Get unbilled card count
  const { data: unbilledCampaigns } = await admin
    .from("agent_campaigns")
    .select("contact_count")
    .eq("agent_id", profile.id)
    .eq("billed", false);

  const unbilledCards = (unbilledCampaigns || []).reduce(
    (sum, ac) => sum + (ac.contact_count || 0),
    0
  );

  // Get pricing tiers
  const { data: tiers } = await admin
    .from("pricing_tiers")
    .select("*")
    .eq("is_active", true)
    .order("min_cards", { ascending: true });

  // Get active discount info if agent has a coupon
  let activeDiscount: string | null = null;
  if (profile.stripe_coupon_id) {
    try {
      const coupon = await stripe.coupons.retrieve(profile.stripe_coupon_id);
      if (coupon.valid) {
        activeDiscount = coupon.percent_off
          ? `${coupon.percent_off}% off`
          : `$${((coupon.amount_off || 0) / 100).toFixed(2)} off`;
      }
    } catch {
      // Coupon may have been deleted
    }
  }

  return NextResponse.json({
    subscription_status: profile.subscription_status,
    payment_method: paymentMethod,
    billing_records: billingRecords || [],
    current_month_estimate: {
      unbilled_cards: unbilledCards,
    },
    pricing_tiers: tiers || [],
    active_discount: activeDiscount,
  });
}
