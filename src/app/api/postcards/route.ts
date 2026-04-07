import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET — List postcards for the current agent (or all if admin)
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaign_id");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = admin
    .from("postcards")
    .select(`
      *,
      contacts ( first_name, last_name, city, state ),
      campaigns ( name, month, year ),
      agent_campaigns ( id, agent_id, agent_profiles ( first_name, last_name, email, company_name ) )
    `, { count: "exact" });

  // Admin sees all, agents see only theirs
  if (profile.role !== "admin") {
    // Get agent_campaign IDs for this agent
    const { data: agentCampaigns } = await admin
      .from("agent_campaigns")
      .select("id")
      .eq("agent_id", profile.id);

    const acIds = (agentCampaigns || []).map((ac) => ac.id);
    if (acIds.length === 0) {
      return NextResponse.json({ postcards: [], total: 0 });
    }
    query = query.in("agent_campaign_id", acIds);
  }

  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (status) query = query.eq("status", status);

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data: postcards, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    postcards: postcards || [],
    total: count || 0,
    page,
    limit,
  });
}
