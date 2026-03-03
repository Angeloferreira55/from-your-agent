import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPostcard } from "@/lib/lob/postcards";
import { getOrCreateStripeCustomer, reportUsage } from "@/lib/stripe/helpers";

/**
 * POST — Order bulk printed postcards shipped to the agent's office address.
 * All postcards are identical (same design) and sent to the brokerage/office address.
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: agent } = await admin
    .from("agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!agent) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { template_id, quantity } = await req.json();

  if (!template_id) return NextResponse.json({ error: "template_id is required" }, { status: 400 });
  const qty = Math.min(Math.max(Math.round(Number(quantity) || 0), 1), 500);

  // Require brokerage/office address for delivery
  const deliveryAddress = {
    address_line1: agent.brokerage_address_line1 || agent.address_line1,
    city: agent.brokerage_city || agent.city,
    state: agent.brokerage_state || agent.state,
    zip: agent.brokerage_zip || agent.zip,
  };

  if (!deliveryAddress.address_line1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zip) {
    return NextResponse.json(
      { error: "No office address on file. Please add your brokerage or personal address in Settings." },
      { status: 400 }
    );
  }

  // Fetch template
  const { data: template } = await admin
    .from("postcard_templates")
    .select("*")
    .eq("id", template_id)
    .single();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // Fetch brokerage template + logo
  let brokerageBackHtml: string | null = null;
  let brokerageLogoUrl: string | null = null;
  if (agent.brokerage_id) {
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

  // Get an active offer for the card
  const { data: offers } = await admin
    .from("offers")
    .select("*, merchants (*)")
    .eq("is_active", true)
    .limit(1);

  const offer = offers?.[0]
    ? {
        title: offers[0].title,
        discount_text: offers[0].discount_text,
        merchant_name: offers[0].merchants?.name || "",
        merchant_address: offers[0].merchants
          ? `${offers[0].merchants.city || ""}, ${offers[0].merchants.state || ""}`
          : "",
        fine_print: offers[0].fine_print,
        redemption_code: offers[0].redemption_code,
      }
    : null;

  // Create a "Print Order" campaign
  const now = new Date();
  const orderMonth = now.getMonth() + 1;
  const orderYear = now.getFullYear();

  const { data: campaign, error: campErr } = await admin
    .from("campaigns")
    .insert({
      name: `Print Order — ${orderMonth}/${orderYear} (${qty} cards)`,
      description: `Bulk print order: ${qty} postcards shipped to office`,
      month: orderMonth,
      year: orderYear,
      template_id: template.id,
      offer_ids: offers?.map((o) => o.id) || [],
      status: "mailed",
      total_postcards: qty,
      mail_date: now.toISOString().split("T")[0],
      cutoff_date: now.toISOString().split("T")[0],
    })
    .select()
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: campErr?.message || "Failed to create order" }, { status: 500 });
  }

  // Create agent_campaign record
  const { data: agentCampaign, error: acErr } = await admin
    .from("agent_campaigns")
    .insert({
      agent_id: agent.id,
      campaign_id: campaign.id,
      status: "opted_in",
      contact_count: qty,
    })
    .select()
    .single();

  if (acErr || !agentCampaign) {
    return NextResponse.json({ error: acErr?.message || "Failed to create agent campaign" }, { status: 500 });
  }

  // Create postcard records and send via Lob
  const agentName = `${agent.first_name} ${agent.last_name}`.trim();
  let mailedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < qty; i++) {
    const { data: postcardRecord, error: insertErr } = await admin
      .from("postcards")
      .insert({
        agent_campaign_id: agentCampaign.id,
        campaign_id: campaign.id,
        offer_id: offers?.[0]?.id || null,
        status: "queued",
        merge_variables: { _print_order: "true", _copy: String(i + 1) },
      })
      .select()
      .single();

    if (insertErr || !postcardRecord) {
      failedCount++;
      continue;
    }

    try {
      const lobResult = await createPostcard({
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
          brokerage_logo_url: brokerageLogoUrl || agent.brokerage_logo_url,
          brand_color: agent.brand_color,
          address_line1: agent.address_line1,
          city: agent.city,
          state: agent.state,
          zip: agent.zip,
          license_number: agent.license_number,
          team_logo_url: agent.team_logo_url,
          seasonal_footer: agent.seasonal_footer,
          agent_card_design: agent.agent_card_design,
        },
        contact: {
          first_name: agentName,
          last_name: agent.company_name || "",
          address_line1: deliveryAddress.address_line1,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
        },
        template: {
          front_html: template.front_html,
          back_html: template.back_html,
          size: template.size,
          type: template.type,
          brokerageBackHtml,
        },
        offer,
        campaignId: campaign.id,
        postcardDbId: postcardRecord.id,
        campaignMonth: orderMonth,
      });

      await admin
        .from("postcards")
        .update({
          lob_postcard_id: lobResult.id,
          lob_url: lobResult.url,
          status: "mailed",
          mailed: true,
        })
        .eq("id", postcardRecord.id);

      mailedCount++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send via Lob";
      await admin
        .from("postcards")
        .update({
          status: "failed",
          merge_variables: { error: message, _print_order: "true" },
        })
        .eq("id", postcardRecord.id);
      failedCount++;
    }
  }

  // Update campaign counts
  await admin
    .from("campaigns")
    .update({ mailed_count: mailedCount })
    .eq("id", campaign.id);

  await admin
    .from("agent_campaigns")
    .update({ contact_count: mailedCount })
    .eq("id", agentCampaign.id);

  // Charge via Stripe — combine all agent cards for volume pricing tier
  if (mailedCount > 0) {
    try {
      // Count all postcards this agent has across all campaigns
      const { data: allAgentCampaigns } = await admin
        .from("agent_campaigns")
        .select("id")
        .eq("agent_id", agent.id);

      let totalAgentCards = mailedCount;
      if (allAgentCampaigns && allAgentCampaigns.length > 0) {
        const otherIds = allAgentCampaigns
          .map((ac) => ac.id)
          .filter((id) => id !== agentCampaign.id);
        if (otherIds.length > 0) {
          const { count } = await admin
            .from("postcards")
            .select("id", { count: "exact", head: true })
            .in("agent_campaign_id", otherIds)
            .in("status", ["queued", "mailed", "in_transit", "in_local_area", "delivered"]);
          totalAgentCards += count || 0;
        }
      }

      const customerId = await getOrCreateStripeCustomer(agent.id);
      await reportUsage(customerId, mailedCount, 0, campaign.id, `Print Order — ${qty} postcards`, totalAgentCards);
    } catch (stripeErr) {
      console.error("[order-prints] Stripe charge failed:", stripeErr);
    }
  }

  return NextResponse.json({
    success: mailedCount > 0,
    total: qty,
    mailed: mailedCount,
    failed: failedCount,
    campaign_id: campaign.id,
  });
}
