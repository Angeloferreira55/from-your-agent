import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { reportUsage } from "@/lib/stripe/helpers";
import { getPricePerCard } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Verify admin role
  const { data: adminProfile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { agent_id, campaign_id } = body;

  if (!agent_id || !campaign_id) {
    return NextResponse.json({ error: "agent_id and campaign_id required" }, { status: 400 });
  }

  // Verify agent has payment method on file
  const { data: agent } = await admin
    .from("agent_profiles")
    .select("stripe_customer_id, subscription_status")
    .eq("id", agent_id)
    .single();

  if (!agent?.stripe_customer_id) {
    return NextResponse.json({ error: "Agent has no payment method on file" }, { status: 400 });
  }

  if (agent.subscription_status !== "active") {
    return NextResponse.json({ error: "Agent subscription not active" }, { status: 400 });
  }

  // Check if already billed
  const { data: agentCampaign } = await admin
    .from("agent_campaigns")
    .select("id, contact_count, billed")
    .eq("agent_id", agent_id)
    .eq("campaign_id", campaign_id)
    .single();

  if (!agentCampaign) {
    return NextResponse.json({ error: "Agent campaign not found" }, { status: 404 });
  }

  if (agentCampaign.billed) {
    return NextResponse.json({ error: "Already billed" }, { status: 400 });
  }

  // Count mailed vs unmailed postcards
  const { data: postcards } = await admin
    .from("postcards")
    .select("id, mailed")
    .eq("agent_campaign_id", agentCampaign.id);

  const mailedCards = (postcards || []).filter((p) => p.mailed).length;
  const unmailedCards = (postcards || []).filter((p) => !p.mailed).length;
  const totalCards = mailedCards + unmailedCards;

  if (totalCards === 0) {
    return NextResponse.json({ error: "No postcards to bill" }, { status: 400 });
  }

  // Get campaign info for description
  const { data: campaign } = await admin
    .from("campaigns")
    .select("name, month, year")
    .eq("id", campaign_id)
    .single();

  const description = `${campaign?.name || "Campaign"} — ${campaign?.month}/${campaign?.year}`;

  // Create invoice items via reportUsage
  await reportUsage(agent.stripe_customer_id, mailedCards, unmailedCards, campaign_id, description);

  // Create and finalize Stripe invoice (auto-charges card on file)
  const invoice = await stripe.invoices.create({
    customer: agent.stripe_customer_id,
    auto_advance: true,
    collection_method: "charge_automatically",
    metadata: {
      campaign_id,
      agent_id,
    },
  });

  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

  // Create billing record
  const pricePerMailed = getPricePerCard(totalCards, true);
  const pricePerUnmailed = getPricePerCard(totalCards, false);
  const subtotal = mailedCards * pricePerMailed + unmailedCards * pricePerUnmailed;

  await admin.from("billing_records").insert({
    agent_id,
    stripe_invoice_id: invoice.id,
    campaign_id,
    description,
    total_cards: totalCards,
    mailed_cards: mailedCards,
    unmailed_cards: unmailedCards,
    price_per_mailed: pricePerMailed,
    price_per_unmailed: pricePerUnmailed,
    subtotal,
    tax: 0,
    total: subtotal,
    status: "pending",
    billing_date: new Date().toISOString().split("T")[0],
  });

  return NextResponse.json({
    invoice_id: invoice.id,
    invoice_url: finalizedInvoice.hosted_invoice_url,
    total: subtotal,
    mailed_cards: mailedCards,
    unmailed_cards: unmailedCards,
  });
}
