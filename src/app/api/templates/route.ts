import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  const brokerageId = request.nextUrl.searchParams.get("brokerage_id");

  if (brokerageId) {
    // Fetch the brokerage-specific template
    const { data, error } = await admin
      .from("postcard_templates")
      .select("id, name, back_html, is_default, type, brokerage_id")
      .eq("type", "brokerage")
      .eq("brokerage_id", brokerageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no brokerage-specific template, fall back to default brokerage template
    if (!data) {
      const { data: fallback, error: fbErr } = await admin
        .from("postcard_templates")
        .select("id, name, back_html, is_default, type, brokerage_id")
        .eq("type", "brokerage")
        .is("brokerage_id", null)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fbErr) {
        return NextResponse.json({ error: fbErr.message }, { status: 500 });
      }
      return NextResponse.json({ template: fallback });
    }

    return NextResponse.json({ template: data });
  }

  // No brokerage_id: return default template (existing behavior)
  const { data, error } = await admin
    .from("postcard_templates")
    .select("id, name, back_html, is_default, type, brokerage_id")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
