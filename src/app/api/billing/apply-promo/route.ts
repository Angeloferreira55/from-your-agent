import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, stripe_coupon_id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (profile.stripe_coupon_id) {
    return NextResponse.json({ error: "You already have an active discount" }, { status: 400 });
  }

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Promo code is required" }, { status: 400 });

  // Look up the promotion code in Stripe
  const promoCodes = await stripe.promotionCodes.list({
    code: code.toUpperCase(),
    active: true,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });

  if (promoCodes.data.length === 0) {
    return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
  }

  const promoCode = promoCodes.data[0];
  const coupon = typeof promoCode.promotion?.coupon === "object" ? promoCode.promotion.coupon : null;

  if (!coupon) {
    return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
  }

  // Store the coupon ID on the agent profile for use during billing
  await admin
    .from("agent_profiles")
    .update({ stripe_coupon_id: coupon.id })
    .eq("id", profile.id);

  const discount = coupon.percent_off
    ? `${coupon.percent_off}% off`
    : `$${((coupon.amount_off || 0) / 100).toFixed(2)} off`;

  return NextResponse.json({
    success: true,
    discount,
    code: promoCode.code,
  });
}
