import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPostcard } from "@/lib/lob/postcards";
import { createPostcardsApi, getLobTestKey } from "@/lib/lob/client";

export const maxDuration = 120;

/**
 * POST — Generate a Lob TEST proof for a single agent (admin only).
 *
 * Renders exactly what Lob would print for this campaign + agent, using a TEST
 * key so NOTHING is mailed and NO charge is incurred. The recipient is the agent
 * themselves (a self-addressed proof). Returns the proof PDF URL. No DB records
 * are written — this is a preview, not a send.
 */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Refuse to run without a TEST key — a "test" must never touch the live key.
  const testKey = getLobTestKey();
  if (!testKey) {
    return NextResponse.json(
      { error: "No Lob TEST key configured. Set LOB_TEST_API_KEY (test_...) to enable test proofs." },
      { status: 400 }
    );
  }

  const { campaign_id, agent_id } = (await req.json()) as { campaign_id?: string; agent_id?: string };
  if (!campaign_id || !agent_id) {
    return NextResponse.json({ error: "campaign_id and agent_id are required" }, { status: 400 });
  }

  // Campaign + template
  const { data: campaign, error: campErr } = await admin
    .from("campaigns")
    .select("*, postcard_templates (*)")
    .eq("id", campaign_id)
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const template = campaign.postcard_templates;
  if (!template || !template.front_html) {
    return NextResponse.json({ error: "No template assigned to this campaign" }, { status: 400 });
  }

  // Agent
  const { data: agent, error: agentErr } = await admin
    .from("agent_profiles")
    .select("*")
    .eq("id", agent_id)
    .single();

  if (agentErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // First offer for merge variables (matches the manual per-agent send behavior)
  const offerIds: string[] = campaign.offer_ids || [];
  let offer: Record<string, unknown> | null = null;
  if (offerIds.length > 0) {
    const { data: o } = await admin
      .from("offers")
      .select("*, merchants (*)")
      .eq("id", offerIds[0])
      .maybeSingle();
    if (o) {
      offer = {
        title: o.title,
        discount_text: o.discount_text,
        merchant_name: o.merchants?.name || "",
        merchant_address: o.merchants ? `${o.merchants.city || ""}, ${o.merchants.state || ""}` : "",
        fine_print: o.fine_print,
        redemption_code: o.redemption_code,
      };
    }
  }

  // Brokerage back panel + logo (same as the live send path)
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
      const { data: bt } = await admin
        .from("postcard_templates")
        .select("back_html")
        .eq("type", "brokerage")
        .eq("brokerage_id", agent.brokerage_id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      brokerageBackHtml = bt?.back_html || null;
    }
  }

  // Self-addressed recipient — the proof "mails" to the agent's own address.
  const contact = {
    first_name: agent.first_name,
    last_name: agent.last_name,
    address_line1: agent.address_line1 || "6703 Academy Rd NE",
    city: agent.city || "Albuquerque",
    state: agent.state || "NM",
    zip: agent.zip || "87109",
  };

  const testClient = createPostcardsApi(testKey);

  try {
    const res = await createPostcard({
      agent: {
        ...agent,
        brokerage_logo_url: brokerageLogoUrl || agent.brokerage_logo_url,
      },
      contact,
      template: {
        front_html: template.front_html,
        back_html: template.back_html,
        size: template.size || "6x9",
        type: template.type,
        brokerageBackHtml,
      },
      offer,
      campaignId: `TEST-${campaign_id}`,
      postcardDbId: `test-${agent_id}-${campaign.month || 0}`,
      campaignMonth: campaign.month,
      lobClient: testClient,
    });

    return NextResponse.json({
      test: true,
      lob_id: res.id,
      proof_url: res.url,
      agent: `${agent.first_name} ${agent.last_name}`.trim(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
