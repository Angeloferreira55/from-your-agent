import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

async function requireAdmin(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();
  if (profile?.role !== "admin") return null;
  return profile;
}

// GET — list all promotion codes
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const promoCodes = await stripe.promotionCodes.list({
    limit: 50,
    expand: ["data.promotion.coupon"],
  });

  const codes = promoCodes.data.map((pc) => {
    const coupon = pc.promotion?.coupon;
    const couponObj = typeof coupon === "object" && coupon ? coupon : null;
    return {
      id: pc.id,
      code: pc.code,
      active: pc.active,
      coupon_id: couponObj?.id ?? null,
      percent_off: couponObj?.percent_off ?? null,
      amount_off: couponObj?.amount_off ?? null,
      currency: couponObj?.currency ?? null,
      max_redemptions: pc.max_redemptions,
      times_redeemed: pc.times_redeemed,
      expires_at: pc.expires_at,
      created: pc.created,
    };
  });

  return NextResponse.json({ promos: codes });
}

// POST — create a new coupon + promotion code
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { code, discount_type, discount_value, max_redemptions, expires_at } = body;

  if (!code || !discount_type || !discount_value) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create the coupon
  const couponCreateParams = discount_type === "percent"
    ? { duration: "forever" as const, percent_off: Number(discount_value) }
    : { duration: "forever" as const, amount_off: Math.round(Number(discount_value) * 100), currency: "usd" };

  const coupon = await stripe.coupons.create(couponCreateParams);

  // Create the promotion code
  const promoCreateParams: Parameters<typeof stripe.promotionCodes.create>[0] = {
    promotion: { type: "coupon" as const, coupon: coupon.id },
    code: code.toUpperCase(),
  };

  if (max_redemptions) {
    promoCreateParams.max_redemptions = Number(max_redemptions);
  }
  if (expires_at) {
    promoCreateParams.expires_at = Math.floor(new Date(expires_at).getTime() / 1000);
  }

  const promoCode = await stripe.promotionCodes.create(promoCreateParams);

  return NextResponse.json({
    id: promoCode.id,
    code: promoCode.code,
    coupon_id: coupon.id,
  }, { status: 201 });
}

// PATCH — deactivate a promotion code
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, active } = body;

  await stripe.promotionCodes.update(id, { active: !!active });

  return NextResponse.json({ ok: true });
}
