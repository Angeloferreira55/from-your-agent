import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  // Handle image upload if present
  if (body._upload) {
    const { base64, type, ext, contentType } = body._upload;
    const validTypes = ["logo", "photo", "brokerage_logo", "team_logo"];
    if (!base64 || !validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
    }

    const bucket = type === "photo" ? "agent-photos" : "agent-logos";
    const filePath = `${userId}/${type}.${ext || "jpg"}`;
    const buffer = Buffer.from(base64, "base64");

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/jpeg" });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Append cache-buster so browser always loads the new image
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

    const fieldMap: Record<string, string> = {
      logo: "logo_url",
      photo: "photo_url",
      brokerage_logo: "brokerage_logo_url",
      team_logo: "team_logo_url",
    };

    const { error: updateError } = await admin
      .from("agent_profiles")
      .update({ [fieldMap[type]]: urlWithCacheBust })
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: urlWithCacheBust });
  }

  // Regular profile update
  const allowedFields = [
    "first_name", "last_name", "phone", "company_name", "license_number",
    "logo_url", "photo_url", "brokerage_logo_url", "team_logo_url",
    "custom_message", "tagline", "brand_color",
    "address_line1", "address_line2", "city", "state", "zip",
    "brokerage_phone", "brokerage_address_line1", "brokerage_address_line2",
    "brokerage_city", "brokerage_state", "brokerage_zip",
    "website", "postcard_visible_fields", "brokerage_id", "agent_card_design", "seasonal_footer",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: profile, error } = await admin
    .from("agent_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // If seasonal_footer column doesn't exist yet, retry without it
    if (error.message?.includes("seasonal_footer") || error.message?.includes("schema cache")) {
      console.warn("[PATCH /api/profile] seasonal_footer column missing, retrying without it");
      delete updates.seasonal_footer;
      const { data: retryProfile, error: retryError } = await admin
        .from("agent_profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();
      if (retryError) {
        console.error("[PATCH /api/profile] Retry error:", retryError.message, retryError.details);
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
      return NextResponse.json({ profile: retryProfile });
    }
    console.error("[PATCH /api/profile] Supabase error:", error.message, error.details);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile });
}
