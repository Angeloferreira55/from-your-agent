import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-config";

/**
 * POST /api/auth/check-admin
 * Called after signup or login. If the user's email is in the admin list,
 * promotes their role to "admin" using the service-role client.
 */
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ role: "agent" });
  }

  const admin = createAdminClient();

  // Fetch the user's profile
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, email, role")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ role: "agent" });
  }

  // Already admin — nothing to do
  if (profile.role === "admin") {
    return NextResponse.json({ role: "admin" });
  }

  // Check if this email should be admin
  if (isAdminEmail(profile.email)) {
    await admin
      .from("agent_profiles")
      .update({ role: "admin" })
      .eq("id", profile.id);

    return NextResponse.json({ role: "admin", promoted: true });
  }

  return NextResponse.json({ role: "agent" });
}
