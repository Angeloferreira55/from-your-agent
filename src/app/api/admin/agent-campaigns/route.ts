import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();
  if (profile?.role !== "admin") return null;
  return profile;
}

// GET — list agent_campaigns for a campaign (admin only)
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaign_id");
  if (!campaignId) return NextResponse.json({ agent_campaigns: [] });

  const { data, error } = await admin
    .from("agent_campaigns")
    .select("id, agent_id, status, contact_count, agent_profiles ( id, first_name, last_name, email, company_name )")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent_campaigns: data || [] });
}
