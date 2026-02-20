import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate, buildMergeVariables } from "@/lib/lob/templates";
import { resolveHtml, LOB_DIMENSIONS, injectFrontOverlay, renderFullBackHtml } from "@/lib/lob/render-design";

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

  const sizeKey = (template.size || "6x9") as keyof typeof LOB_DIMENSIONS;
  const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];

  // Fetch brokerage template if monthly
  let brokerageBackHtml: string | null = null;
  if (template.type === "monthly" && agent.brokerage_id) {
    const { data: brokerageTemplate } = await admin
      .from("postcard_templates")
      .select("back_html")
      .eq("type", "brokerage")
      .eq("brokerage_id", agent.brokerage_id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    brokerageBackHtml = brokerageTemplate?.back_html || null;
  }

  const mergeVars = buildMergeVariables(agent, contact, offer);
  const agentName = `${agent.first_name} ${agent.last_name}`.trim();
  const frontHtml = injectFrontOverlay(
    renderTemplate(resolveHtml(template.front_html, dims.front, 900), mergeVars),
    agentName,
    agent.company_name
  );

  const now = new Date();
  const rawBackHtml = renderFullBackHtml({
    templateBackHtml: template.back_html,
    templateType: template.type,
    brokerageBackHtml,
    agentCardDesign: agent.agent_card_design,
    agent: {
      first_name: agent.first_name,
      last_name: agent.last_name,
      company_name: agent.company_name,
      phone: agent.phone,
      email: agent.email,
      tagline: agent.tagline,
      custom_message: agent.custom_message,
      photo_url: agent.photo_url,
      logo_url: agent.logo_url,
      brand_color: agent.brand_color,
      license_number: agent.license_number,
      team_logo_url: agent.team_logo_url,
      seasonal_footer: agent.seasonal_footer,
    },
    offer,
    campaignMonth: now.getMonth() + 1,
    size: template.size,
  });
  const backHtml = renderTemplate(rawBackHtml, mergeVars);

  return NextResponse.json({
    front_html: frontHtml,
    back_html: backHtml,
    merge_variables: mergeVars,
  });
}
