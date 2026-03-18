import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBillingReminderFinalEmail } from "@/lib/email/client";

export const maxDuration = 60;

/**
 * POST — Final billing reminder cron endpoint.
 * Runs on the 20th of each month (1 day before the 21st send date).
 * Emails all agents who still have no Stripe payment method on file.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: agents } = await admin
    .from("agent_profiles")
    .select("id, first_name, email, stripe_customer_id")
    .is("stripe_customer_id", null)
    .not("email", "is", null);

  if (!agents || agents.length === 0) {
    return NextResponse.json({ message: "No agents to remind", sent: 0 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const agent of agents) {
    try {
      const { count } = await admin
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("status", "active");

      const contactCount = count || 0;
      if (contactCount === 0) {
        skipped++;
        continue;
      }

      await sendBillingReminderFinalEmail(agent.email, agent.first_name || "there");
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${agent.email}: ${msg}`);
    }
  }

  return NextResponse.json({ sent, skipped, errors: errors.slice(0, 10) });
}
