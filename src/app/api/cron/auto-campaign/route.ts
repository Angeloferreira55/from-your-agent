import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPostcardBatch } from "@/lib/lob/postcards";

const MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * POST — Auto-campaign cron endpoint.
 * Runs on the 25th of each month via Vercel Cron.
 * Targets NEXT month's campaign so postcards arrive by the first week.
 *
 * If an admin already created a campaign for the target month (draft/scheduled),
 * the cron adopts it — using that campaign's template and offers.
 * Otherwise it creates a new campaign automatically.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // Target NEXT month (cron runs on the 25th, mailing for next month)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const month = nextMonth.getMonth() + 1; // 1-indexed
  const year = nextMonth.getFullYear();

  // Check if a campaign already exists for the target month
  const { data: existing } = await admin
    .from("campaigns")
    .select("*, postcard_templates (*)")
    .eq("month", month)
    .eq("year", year)
    .not("status", "eq", "canceled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If already mailed/completed, nothing to do
  if (existing && ["mailing", "mailed", "completed"].includes(existing.status)) {
    return NextResponse.json({
      message: `Campaign for ${MONTHS[month]} ${year} already sent`,
      campaign_id: existing.id,
    });
  }

  // Determine template: use admin-created campaign's template, or fall back to best match
  let template = existing?.postcard_templates || null;

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
    return NextResponse.json({ error: "No template found" }, { status: 400 });
  }

  // Determine offers: use admin-created campaign's offers, or fall back to all active
  let offerIds: string[] = [];

  if (existing?.offer_ids?.length) {
    offerIds = existing.offer_ids;
  } else {
    const { data: activeOfferRows } = await admin
      .from("offers")
      .select("id")
      .eq("is_active", true);
    offerIds = (activeOfferRows || []).map((o: { id: string }) => o.id);
  }

  // Build offers map for merge variables
  const offersMap: Record<string, Record<string, unknown>> = {};
  if (offerIds.length > 0) {
    const { data: offerRows } = await admin
      .from("offers")
      .select("id, title, discount_text, fine_print, redemption_code, merchants (*)")
      .in("id", offerIds);

    for (const o of offerRows || []) {
      offersMap[o.id] = {
        title: o.title,
        discount_text: o.discount_text,
        merchant_name: (o.merchants as unknown as Record<string, string>)?.name || "",
        merchant_address: o.merchants
          ? `${(o.merchants as unknown as Record<string, string>).city || ""}, ${(o.merchants as unknown as Record<string, string>).state || ""}`
          : "",
        fine_print: o.fine_print,
        redemption_code: o.redemption_code,
      };
    }
  }

  // Either adopt the admin-created campaign or create a new one
  let campaign: { id: string; [key: string]: unknown };

  if (existing) {
    // Adopt admin-created campaign — update status to "mailing"
    const { data: updated, error: updateErr } = await admin
      .from("campaigns")
      .update({ status: "mailing", mail_date: now.toISOString().split("T")[0] })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({ error: updateErr?.message || "Failed to update campaign" }, { status: 500 });
    }
    campaign = updated;
  } else {
    // No campaign for this month — create one automatically
    const { data: created, error: campErr } = await admin
      .from("campaigns")
      .insert({
        name: `${MONTHS[month]} ${year} Postcards`,
        description: `Auto-generated monthly campaign for ${MONTHS[month]} ${year}`,
        month,
        year,
        template_id: template.id,
        offer_ids: offerIds,
        status: "mailing",
        mail_date: now.toISOString().split("T")[0],
        cutoff_date: now.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (campErr || !created) {
      return NextResponse.json({ error: campErr?.message || "Failed to create campaign" }, { status: 500 });
    }
    campaign = created;
  }

  // Get all active agents
  const { data: agents } = await admin
    .from("agent_profiles")
    .select("*")
    .in("subscription_status", ["active", "trialing"]);

  if (!agents || agents.length === 0) {
    await admin.from("campaigns").update({ status: "completed", mailed_count: 0 }).eq("id", campaign.id);
    return NextResponse.json({ message: "No active agents found", campaign_id: campaign.id });
  }

  const postcardParams: Parameters<typeof sendPostcardBatch>[0] = [];
  const dbRecords: Array<Record<string, unknown>> = [];

  for (const agent of agents) {
    // Get all active contacts for this agent
    const { data: contacts } = await admin
      .from("contacts")
      .select("*")
      .eq("agent_id", agent.id)
      .eq("status", "active");

    if (!contacts || contacts.length === 0) continue;

    // Create agent_campaign record (auto opt-in)
    const { data: agentCampaign } = await admin
      .from("agent_campaigns")
      .insert({
        agent_id: agent.id,
        campaign_id: campaign.id,
        status: "opted_in",
        contact_count: contacts.length,
        contact_filter: { selected_ids: contacts.map((c) => c.id) },
      })
      .select()
      .single();

    if (!agentCampaign) continue;

    for (const contact of contacts) {
      const firstOfferId = offerIds[0] || null;

      dbRecords.push({
        agent_campaign_id: agentCampaign.id,
        contact_id: contact.id,
        campaign_id: campaign.id,
        offer_id: firstOfferId,
        status: "queued",
        merge_variables: {},
      });
    }
  }

  if (dbRecords.length === 0) {
    await admin.from("campaigns").update({ status: "completed", mailed_count: 0 }).eq("id", campaign.id);
    return NextResponse.json({ message: "No contacts to mail", campaign_id: campaign.id });
  }

  // Insert postcard records
  const { data: insertedPostcards, error: insertErr } = await admin
    .from("postcards")
    .insert(dbRecords)
    .select();

  if (insertErr || !insertedPostcards) {
    await admin.from("campaigns").update({ status: "scheduled" }).eq("id", campaign.id);
    return NextResponse.json({ error: insertErr?.message || "Failed to create postcards" }, { status: 500 });
  }

  await admin
    .from("campaigns")
    .update({ total_postcards: insertedPostcards.length })
    .eq("id", campaign.id);

  // Pre-fetch brokerage templates for agents (cache by brokerage_id)
  const brokerageBackHtmlCache: Record<string, string | null> = {};

  // Build Lob params
  for (const pc of insertedPostcards) {
    const agentCampaigns = await admin
      .from("agent_campaigns")
      .select("*, agent_profiles (*)")
      .eq("id", pc.agent_campaign_id)
      .single();

    const ac = agentCampaigns?.data;
    if (!ac) continue;

    const agent = ac.agent_profiles;
    const { data: contact } = await admin
      .from("contacts")
      .select("*")
      .eq("id", pc.contact_id)
      .single();

    if (!contact || !agent) continue;

    const offer = pc.offer_id ? offersMap[pc.offer_id] : null;

    // Fetch brokerage template if monthly and agent has a brokerage
    let brokerageBackHtml: string | null = null;
    if (template.type === "monthly" && agent.brokerage_id) {
      if (!(agent.brokerage_id in brokerageBackHtmlCache)) {
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
        brokerageBackHtmlCache[agent.brokerage_id] = brokerageTemplate?.back_html || null;
      }
      brokerageBackHtml = brokerageBackHtmlCache[agent.brokerage_id];
    }

    postcardParams.push({
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
      offer: offer as Parameters<typeof sendPostcardBatch>[0][0]["offer"],
      campaignId: campaign.id,
      postcardDbId: pc.id,
      campaignMonth: month,
    });
  }

  // Send via Lob
  const results = await sendPostcardBatch(postcardParams, 50);

  let mailedCount = 0;
  for (const result of results) {
    if (result.lobId) {
      await admin
        .from("postcards")
        .update({ lob_postcard_id: result.lobId, status: "mailed", mailed: true })
        .eq("id", result.postcardDbId);
      mailedCount++;
    } else {
      await admin
        .from("postcards")
        .update({ status: "failed", merge_variables: { error: result.error || "Unknown" } })
        .eq("id", result.postcardDbId);
    }
  }

  // Finalize campaign
  await admin
    .from("campaigns")
    .update({ status: "mailed", mailed_count: mailedCount })
    .eq("id", campaign.id);

  return NextResponse.json({
    success: true,
    campaign_id: campaign.id,
    month: MONTHS[month],
    year,
    total: results.length,
    mailed: mailedCount,
    failed: results.length - mailedCount,
  });
}
