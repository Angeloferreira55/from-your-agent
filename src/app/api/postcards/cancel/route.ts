import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lobPostcards } from "@/lib/lob/client";

export const maxDuration = 120;

// POST — Cancel all postcards for a given campaign + agent (admin only)
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

  const { campaign_id, agent_id } = await req.json();
  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
  }

  // Build query — optionally filter by agent
  let query = admin
    .from("postcards")
    .select("id, lob_postcard_id, agent_campaign_id")
    .eq("campaign_id", campaign_id)
    .not("lob_postcard_id", "is", null)
    .in("status", ["mailed", "queued"]);

  if (agent_id) {
    const { data: agentCampaigns } = await admin
      .from("agent_campaigns")
      .select("id")
      .eq("agent_id", agent_id)
      .eq("campaign_id", campaign_id);

    const acIds = (agentCampaigns || []).map((ac) => ac.id);
    if (acIds.length === 0) {
      return NextResponse.json({ error: "No agent campaign found" }, { status: 404 });
    }
    query = query.in("agent_campaign_id", acIds);
  }

  const { data: postcards } = await query;

  if (!postcards || postcards.length === 0) {
    return NextResponse.json({ error: "No postcards to cancel" }, { status: 400 });
  }

  let canceled = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const pc of postcards) {
    try {
      await lobPostcards.cancel(pc.lob_postcard_id);
      await admin
        .from("postcards")
        .update({ status: "canceled" })
        .eq("id", pc.id);
      canceled++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(msg);
      failed++;
    }
  }

  return NextResponse.json({
    total: postcards.length,
    canceled,
    failed,
    errors: errors.slice(0, 5),
  });
}
