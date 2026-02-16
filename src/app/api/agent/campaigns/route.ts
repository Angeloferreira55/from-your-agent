import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET — List campaigns available to this agent (with their opt-in status)
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get agent profile
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Fetch active/scheduled campaigns with agent's participation status
  const { data: campaigns, error } = await admin
    .from("campaigns")
    .select(`
      *,
      postcard_templates ( name, size ),
      agent_campaigns!left ( id, agent_id, opted_in, contact_count, total_cost )
    `)
    .in("status", ["draft", "scheduled", "generating", "ready_to_mail", "mailing", "mailed", "completed"])
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter agent_campaigns to only this agent's entries
  const enriched = (campaigns || []).map((c) => {
    const myParticipation = (c.agent_campaigns || []).find(
      (ac: { agent_id: string }) => ac.agent_id === profile.id
    );
    return {
      ...c,
      agent_campaigns: undefined,
      my_participation: myParticipation
        ? {
            id: myParticipation.id,
            opted_in: myParticipation.opted_in,
            contact_count: myParticipation.contact_count,
            total_cost: myParticipation.total_cost,
          }
        : null,
    };
  });

  return NextResponse.json({ campaigns: enriched });
}

// POST — Opt into a campaign with selected contacts
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const { campaign_id, contact_ids } = body;

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
  }

  // Verify campaign exists and is still accepting opt-ins
  const { data: campaign } = await admin
    .from("campaigns")
    .select("id, status, cutoff_date")
    .eq("id", campaign_id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!["draft", "scheduled"].includes(campaign.status)) {
    return NextResponse.json({ error: "Campaign is no longer accepting opt-ins" }, { status: 400 });
  }

  // Check if cutoff date has passed
  if (campaign.cutoff_date && new Date(campaign.cutoff_date) < new Date()) {
    return NextResponse.json({ error: "Opt-in cutoff date has passed" }, { status: 400 });
  }

  // Count contacts or use provided ids
  const contactCount = contact_ids?.length || 0;

  // Upsert agent_campaign record
  const { data: agentCampaign, error } = await admin
    .from("agent_campaigns")
    .upsert(
      {
        agent_id: profile.id,
        campaign_id,
        opted_in: true,
        contact_count: contactCount,
        selected_contact_ids: contact_ids || [],
      },
      { onConflict: "agent_id,campaign_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ agent_campaign: agentCampaign });
}

// DELETE — Opt out of a campaign
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const { campaign_id } = body;

  const { error } = await admin
    .from("agent_campaigns")
    .update({ opted_in: false })
    .eq("agent_id", profile.id)
    .eq("campaign_id", campaign_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
