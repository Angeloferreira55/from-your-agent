import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();
  if (profile?.role !== "admin") return null;
  return profile;
}

// GET — list merchants with their offers
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: merchants, error } = await admin
    .from("merchants")
    .select("*, offers(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ merchants });
}

// POST — create merchant + offer together
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  // Create merchant
  const { data: merchant, error: merchantError } = await admin
    .from("merchants")
    .insert({
      name: body.merchant_name,
      category: body.category,
      address_line1: body.address_line1 || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      phone: body.phone || null,
      website: body.website || null,
      region_id: body.region_id || null,
    })
    .select()
    .single();

  if (merchantError) return NextResponse.json({ error: merchantError.message }, { status: 500 });

  // Create offer if provided
  if (body.offer_title) {
    const { error: offerError } = await admin
      .from("offers")
      .insert({
        merchant_id: merchant.id,
        title: body.offer_title,
        description: body.offer_description || null,
        discount_text: body.discount_text,
        fine_print: body.fine_print || null,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
        redemption_instructions: body.redemption_instructions || null,
        region_id: body.region_id || null,
        featured: body.featured || false,
      });

    if (offerError) return NextResponse.json({ error: offerError.message }, { status: 500 });
  }

  return NextResponse.json(merchant, { status: 201 });
}

// PATCH — update merchant or offer
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { type, id, ...updates } = body;

  if (type === "offer") {
    const { data, error } = await admin
      .from("offers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Default: update merchant
  const { data, error } = await admin
    .from("merchants")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete merchant (cascades to offers) or single offer
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  if (body.type === "offer") {
    const { error } = await admin.from("offers").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from("merchants").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
