import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(req.url);
  const previewAgentId = url.searchParams.get("agent_id");
  const templateId = url.searchParams.get("template_id");
  const monthParam = url.searchParams.get("month");
  const campaignMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;

  const { data: currentAgent, error: currentAgentError } = await admin
    .from("agent_profiles")
    .select("id, role, first_name, last_name, email")
    .eq("user_id", userId)
    .single();

  if (currentAgentError || !currentAgent) {
    return NextResponse.json({ error: currentAgentError?.message || "Profile not found" }, { status: 404 });
  }

  let targetAgent = null;
  let targetAgentError = null;
  if (previewAgentId) {
    const result = await admin
      .from("agent_profiles")
      .select("id, first_name, last_name, email, company_name")
      .eq("id", previewAgentId)
      .single();
    targetAgent = result.data;
    targetAgentError = result.error;
  }

  return NextResponse.json({
    previewAgentId,
    templateId,
    campaignMonth,
    currentAgent,
    targetAgent,
    targetAgentError: targetAgentError?.message || null,
  });
}
