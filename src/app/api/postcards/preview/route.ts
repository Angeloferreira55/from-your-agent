import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate, buildMergeVariables } from "@/lib/lob/templates";

// POST — Generate a preview of rendered HTML (no Lob call)
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { template_id, contact_id, offer_id } = await req.json();

  // Get agent profile
  const { data: agent } = await admin
    .from("agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!agent) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Get template
  const { data: template } = await admin
    .from("postcard_templates")
    .select("*")
    .eq("id", template_id)
    .single();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // Get contact (optional — use dummy if not provided)
  let contact = {
    first_name: "Jane",
    last_name: "Doe",
    address_line1: "123 Main Street",
    address_line2: null as string | null,
    city: "Anytown",
    state: "CA",
    zip: "90210",
  };

  if (contact_id) {
    const { data } = await admin
      .from("contacts")
      .select("*")
      .eq("id", contact_id)
      .single();
    if (data) contact = data;
  }

  // Get offer (optional)
  let offer = null;
  if (offer_id) {
    const { data } = await admin
      .from("offers")
      .select("*, merchants (*)")
      .eq("id", offer_id)
      .single();
    if (data) {
      offer = {
        title: data.title,
        discount_text: data.discount_text,
        merchant_name: data.merchants?.name || "",
        merchant_address: data.merchants
          ? `${data.merchants.city || ""}, ${data.merchants.state || ""}`
          : "",
        fine_print: data.fine_print,
        redemption_code: data.redemption_code,
      };
    }
  }

  const mergeVars = buildMergeVariables(agent, contact, offer);
  const frontHtml = renderTemplate(template.front_html, mergeVars);
  const backHtml = renderTemplate(template.back_html, mergeVars);

  return NextResponse.json({
    front_html: frontHtml,
    back_html: backHtml,
    merge_variables: mergeVars,
  });
}
