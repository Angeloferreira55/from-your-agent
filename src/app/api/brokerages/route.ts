import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();
  const { data: brokerages, error } = await admin
    .from("brokerages")
    .select("id, name, slogan, website, logo_url, second_logo_url, background_url, brand_color, overlay_color, text_color, social_links, disclaimer")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ brokerages });
}
