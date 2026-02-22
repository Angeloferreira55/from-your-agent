import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPostcardBatch } from "@/lib/lob/postcards";
import { matchContactsToOffers } from "@/lib/geo/matching";

// POST — Trigger mailing for a campaign (admin only)
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Admin check
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { campaign_id } = await req.json();
  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
  }

  // Get campaign with template
  const { data: campaign, error: campaignErr } = await admin
    .from("campaigns")
    .select("*, postcard_templates (*)")
    .eq("id", campaign_id)
    .single();

  if (campaignErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!["scheduled", "ready_to_mail"].includes(campaign.status)) {
    return NextResponse.json({ error: `Campaign status is '${campaign.status}', cannot mail` }, { status: 400 });
  }

  const template = campaign.postcard_templates;
  if (!template) {
    return NextResponse.json({ error: "No template assigned" }, { status: 400 });
  }

  // Update campaign status to "mailing"
  await admin
    .from("campaigns")
    .update({ status: "mailing" })
    .eq("id", campaign_id);

  // Get all opted-in agent_campaigns with agent profiles
  const { data: agentCampaigns } = await admin
    .from("agent_campaigns")
    .select("*, agent_profiles (*)")
    .eq("campaign_id", campaign_id)
    .eq("status", "opted_in");

  if (!agentCampaigns || agentCampaigns.length === 0) {
    await admin.from("campaigns").update({ status: "scheduled" }).eq("id", campaign_id);
    return NextResponse.json({ error: "No agents opted in" }, { status: 400 });
  }

  // Get offers for this campaign
  const offerIds = campaign.offer_ids || [];
  let offersMap: Record<string, Record<string, unknown>> = {};
  if (offerIds.length > 0) {
    const { data: offers } = await admin
      .from("offers")
      .select("*, merchants (*)")
      .in("id", offerIds);

    if (offers) {
      offersMap = Object.fromEntries(
        offers.map((o) => [
          o.id,
          {
            title: o.title,
            discount_text: o.discount_text,
            merchant_name: o.merchants?.name || "",
            merchant_address: o.merchants
              ? `${o.merchants.city || ""}, ${o.merchants.state || ""}`
              : "",
            fine_print: o.fine_print,
            redemption_code: o.redemption_code,
          },
        ])
      );
    }
  }

  // Build postcard records and queue for Lob
  const postcardParams = [];
  const dbRecords = [];

  for (const ac of agentCampaigns) {
    const agent = ac.agent_profiles;
    if (!agent) continue;

    // Get contacts for this agent campaign — check contact_filter for selected IDs
    const contactFilter = ac.contact_filter as { selected_ids?: string[] } | null;
    const selectedIds = contactFilter?.selected_ids || [];
    let contacts;

    if (selectedIds.length > 0) {
      const { data } = await admin
        .from("contacts")
        .select("*")
        .in("id", selectedIds)
        .eq("status", "active");
      contacts = data || [];
    } else {
      const { data } = await admin
        .from("contacts")
        .select("*")
        .eq("agent_id", agent.id)
        .eq("status", "active");
      contacts = data || [];
    }

    // Geo-match contacts to nearest offers
    const contactIds = contacts.map((c: { id: string }) => c.id);
    const geoMatches = await matchContactsToOffers(contactIds, offerIds);

    for (const contact of contacts) {
      const match = geoMatches.get(contact.id);
      const matchedOfferId = match?.offerId || offerIds[0] || null;

      dbRecords.push({
        agent_campaign_id: ac.id,
        contact_id: contact.id,
        campaign_id: campaign_id,
        offer_id: matchedOfferId,
        status: "queued" as const,
        merge_variables: {},
      });
    }
  }

  // Bulk insert postcard records into DB
  if (dbRecords.length === 0) {
    await admin.from("campaigns").update({ status: "scheduled" }).eq("id", campaign_id);
    return NextResponse.json({ error: "No contacts to mail to" }, { status: 400 });
  }

  const { data: insertedPostcards, error: insertErr } = await admin
    .from("postcards")
    .insert(dbRecords)
    .select();

  if (insertErr) {
    await admin.from("campaigns").update({ status: "scheduled" }).eq("id", campaign_id);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Update campaign totals
  await admin
    .from("campaigns")
    .update({ total_postcards: insertedPostcards.length })
    .eq("id", campaign_id);

  // Pre-fetch brokerage templates (cache by brokerage_id)
  const brokerageBackHtmlCache: Record<string, string | null> = {};

  // Now build Lob params for each postcard record
  for (const pc of insertedPostcards) {
    // Get the agent campaign + agent data
    const ac = agentCampaigns.find((a) => a.id === pc.agent_campaign_id);
    if (!ac) continue;

    const agent = ac.agent_profiles;

    // Get the contact
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
      offer: offer as CreatePostcardParams["offer"],
      campaignId: campaign_id,
      postcardDbId: pc.id,
      campaignMonth: campaign.month,
    });
  }

  // Send via Lob in batches
  const results = await sendPostcardBatch(postcardParams, 50);

  // Update DB with Lob IDs and statuses
  let mailedCount = 0;
  for (const result of results) {
    if (result.lobId) {
      await admin
        .from("postcards")
        .update({
          lob_postcard_id: result.lobId,
          status: "mailed",
          mailed: true,
        })
        .eq("id", result.postcardDbId);
      mailedCount++;
    } else {
      await admin
        .from("postcards")
        .update({
          status: "failed",
          merge_variables: { error: result.error || "Unknown" },
        })
        .eq("id", result.postcardDbId);
    }
  }

  // Update campaign status
  await admin
    .from("campaigns")
    .update({
      status: "mailed",
      mailed_count: mailedCount,
    })
    .eq("id", campaign_id);

  // Update agent_campaign contact counts
  for (const ac of agentCampaigns) {
    const count = results.filter((r) => {
      const pc = insertedPostcards.find((p) => p.id === r.postcardDbId);
      return pc?.agent_campaign_id === ac.id && r.lobId;
    }).length;

    await admin
      .from("agent_campaigns")
      .update({ contact_count: count })
      .eq("id", ac.id);
  }

  return NextResponse.json({
    total: results.length,
    mailed: mailedCount,
    failed: results.length - mailedCount,
  });
}

// Type import for the params
type CreatePostcardParams = Parameters<typeof sendPostcardBatch>[0][0];
