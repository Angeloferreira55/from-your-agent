import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate, buildMergeVariables } from "@/lib/lob/templates";
import { resolveHtml, LOB_DIMENSIONS, injectFrontOverlay, renderFullBackHtml, designHasFrontPlaceholders } from "@/lib/lob/render-design";
import type { AgentPlaceholderData } from "@/lib/lob/render-design";

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

  // Fetch brokerage data for front placeholders / overlay + back template
  let brokerageBackHtml: string | null = null;
  let brokerageLogoUrl: string | null = null;
  if (agent.brokerage_id) {
    // Fetch brokerage logo for front placeholders / overlay
    const { data: brokerage } = await admin
      .from("brokerages")
      .select("logo_url")
      .eq("id", agent.brokerage_id)
      .single();
    brokerageLogoUrl = brokerage?.logo_url || null;

    if (template.type === "monthly") {
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
  }

  const mergeVars = buildMergeVariables(agent, contact, offer);
  const agentName = `${agent.first_name} ${agent.last_name}`.trim();
  const hasPlaceholders = designHasFrontPlaceholders(template.front_html);

  // Brokerage logo only appears on the back (brokerage panel) — not on the front
  const agentData: AgentPlaceholderData = {
    agent_name: agentName,
    brokerage_name: agent.company_name || undefined,
    brokerage_logo_url: undefined,
    agent_phone: agent.phone || undefined,
  };

  const resolvedFront = renderTemplate(
    resolveHtml(template.front_html, dims.front, 900, hasPlaceholders ? agentData : undefined),
    mergeVars
  );

  const frontHtml = hasPlaceholders
    ? resolvedFront
    : injectFrontOverlay(resolvedFront, agentName, agent.company_name, dims.front.width, null);

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
