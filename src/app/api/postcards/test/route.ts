import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPostcard } from "@/lib/lob/postcards";

/**
 * POST — Send test postcards to verify the pipeline.
 * Accepts either a single contact_id or an array of contact_ids.
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get agent profile
  const { data: agent } = await admin
    .from("agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!agent) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  // Support both single contact_id and array contact_ids
  const contactIds: string[] = body.contact_ids || (body.contact_id ? [body.contact_id] : []);
  const templateId: string | undefined = body.template_id;

  // Fetch selected contacts (or first active if none specified)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contacts: any[] = [];

  if (contactIds.length > 0) {
    const { data } = await admin
      .from("contacts")
      .select("*")
      .in("id", contactIds)
      .eq("agent_id", agent.id);
    contacts = data || [];
  } else {
    const { data } = await admin
      .from("contacts")
      .select("*")
      .eq("agent_id", agent.id)
      .eq("status", "active")
      .limit(1);
    contacts = data || [];
  }

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "No active contacts found. Upload contacts first." },
      { status: 400 }
    );
  }

  // Use the explicitly selected template, or fall back to default / most recent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let template: any = null;

  if (templateId) {
    const { data } = await admin
      .from("postcard_templates")
      .select("*")
      .eq("id", templateId)
      .single();
    template = data;
  }

  if (!template) {
    const { data: candidates } = await admin
      .from("postcard_templates")
      .select("*")
      .eq("type", "monthly")
      .eq("is_active", true)
      .not("front_html", "is", null)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    template = candidates?.[0] || null;
  }

  if (!template) {
    return NextResponse.json(
      { error: "No postcard template found. A template must be created first." },
      { status: 400 }
    );
  }

  // If monthly template, fetch the brokerage template for the top-right panel
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

  // Get active offers for the card
  const { data: offers } = await admin
    .from("offers")
    .select("*, merchants (*)")
    .eq("is_active", true)
    .limit(4);

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

  // Create or reuse a "Test" campaign for this month
  const now = new Date();
  const testMonth = now.getMonth() + 1;
  const testYear = now.getFullYear();

  let testCampaignId: string;

  const { data: existingTestCampaign } = await admin
    .from("campaigns")
    .select("id")
    .eq("name", `Test — ${testMonth}/${testYear}`)
    .limit(1)
    .maybeSingle();

  if (existingTestCampaign) {
    testCampaignId = existingTestCampaign.id;
  } else {
    const { data: newCampaign, error: campErr } = await admin
      .from("campaigns")
      .insert({
        name: `Test — ${testMonth}/${testYear}`,
        description: "Auto-created for test postcards",
        month: testMonth,
        year: testYear,
        template_id: template.id,
        offer_ids: offers?.map((o) => o.id) || [],
        status: "mailed",
        mail_date: now.toISOString().split("T")[0],
        cutoff_date: now.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (campErr || !newCampaign) {
      return NextResponse.json({ error: campErr?.message || "Failed to create test campaign" }, { status: 500 });
    }
    testCampaignId = newCampaign.id;
  }

  // Create or reuse an agent_campaign record
  let agentCampaignId: string;

  const { data: existingAc } = await admin
    .from("agent_campaigns")
    .select("id")
    .eq("agent_id", agent.id)
    .eq("campaign_id", testCampaignId)
    .limit(1)
    .maybeSingle();

  if (existingAc) {
    agentCampaignId = existingAc.id;
  } else {
    const { data: newAc, error: acErr } = await admin
      .from("agent_campaigns")
      .insert({
        agent_id: agent.id,
        campaign_id: testCampaignId,
        status: "opted_in",
        contact_count: contacts.length,
        contact_filter: { selected_ids: contacts.map((c) => c.id) },
      })
      .select()
      .single();

    if (acErr || !newAc) {
      return NextResponse.json({ error: acErr?.message || "Failed to create agent campaign" }, { status: 500 });
    }
    agentCampaignId = newAc.id;
  }

  // Send a postcard for each selected contact
  const results: Array<{ contact: string; success: boolean; lob_id?: string; lob_url?: string; error?: string }> = [];

  for (const contact of contacts) {
    // Create the postcard record in DB
    const { data: postcardRecord, error: insertErr } = await admin
      .from("postcards")
      .insert({
        agent_campaign_id: agentCampaignId,
        contact_id: contact.id,
        campaign_id: testCampaignId,
        offer_id: offers?.[0]?.id || null,
        status: "queued",
        merge_variables: { _test: "true" },
      })
      .select()
      .single();

    if (insertErr || !postcardRecord) {
      results.push({
        contact: `${contact.first_name} ${contact.last_name}`,
        success: false,
        error: insertErr?.message || "Failed to create record",
      });
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
          brokerage_logo_url: agent.brokerage_logo_url,
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
          first_name: contact.first_name,
          last_name: contact.last_name,
          address_line1: contact.address_line1,
          address_line2: contact.address_line2,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
        },
        template: {
          front_html: template.front_html,
          back_html: template.back_html,
          size: template.size,
          type: template.type,
          brokerageBackHtml,
        },
        offer,
        campaignId: testCampaignId,
        postcardDbId: postcardRecord.id,
        campaignMonth: testMonth,
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

      results.push({
        contact: `${contact.first_name} ${contact.last_name}`,
        success: true,
        lob_id: lobResult.id,
        lob_url: lobResult.url,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send via Lob";

      await admin
        .from("postcards")
        .update({
          status: "failed",
          merge_variables: { error: message, _test: "true" },
        })
        .eq("id", postcardRecord.id);

      results.push({
        contact: `${contact.first_name} ${contact.last_name}`,
        success: false,
        error: message,
      });
    }
  }

  const mailed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: mailed > 0,
    total: results.length,
    mailed,
    failed,
    results,
  });
}
