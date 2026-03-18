import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBillingReminderEmail, sendBillingReminderFinalEmail } from "@/lib/email/client";

// POST — Send a test billing reminder email to the requesting admin
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("role, first_name, email")
    .eq("user_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type = "reminder", to } = await req.json();
  const sendTo = to || profile.email;
  const firstName = profile.first_name || "there";

  if (type === "final") {
    await sendBillingReminderFinalEmail(sendTo, firstName);
  } else {
    await sendBillingReminderEmail(sendTo, firstName);
  }

  return NextResponse.json({ ok: true, sent_to: sendTo, type });
}
