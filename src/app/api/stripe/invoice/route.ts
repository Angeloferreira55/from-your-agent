import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { getPricePerCard } from "@/lib/stripe/config";
import type Stripe from "stripe";

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
    .select("stripe_customer_id, subscription_status, stripe_coupon_id")
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

  // Count postcards — bill ONLY cards that actually mailed (never failed/canceled/queued).
  const MAILED_STATUSES = ["mailed", "in_transit", "in_local_area", "delivered"];
  const { data: postcards } = await admin
    .from("postcards")
    .select("status")
    .eq("agent_campaign_id", agentCampaign.id);

  const allCards = (postcards || []).length;
  const totalCards = (postcards || []).filter((p) => MAILED_STATUSES.includes(p.status)).length;
  const unmailedCards = allCards - totalCards;

  if (totalCards === 0) {
    return NextResponse.json({ error: "No mailed postcards to bill" }, { status: 400 });
  }

  // Get campaign info for description
  const { data: campaign } = await admin
    .from("campaigns")
    .select("name, month, year")
    .eq("id", campaign_id)
    .single();

  const description = `${campaign?.name || "Campaign"} — ${campaign?.month}/${campaign?.year}`;

  const pricePerCard = getPricePerCard(totalCards);
  const subtotal = totalCards * pricePerCard;

  // Resolve a card to charge: the customer's default payment method, else their
  // first saved card — which we also set as the default so this and future
  // invoices can auto-charge. Without a default, charge_automatically invoices
  // just sit "open" and never collect.
  let defaultPm: string | null = null;
  try {
    const cust = await stripe.customers.retrieve(agent.stripe_customer_id);
    if (!("deleted" in cust)) {
      const dp = cust.invoice_settings?.default_payment_method;
      defaultPm = typeof dp === "string" ? dp : dp?.id || null;
    }
    if (!defaultPm) {
      const pms = await stripe.paymentMethods.list({ customer: agent.stripe_customer_id, type: "card", limit: 1 });
      if (pms.data[0]) {
        defaultPm = pms.data[0].id;
        await stripe.customers.update(agent.stripe_customer_id, {
          invoice_settings: { default_payment_method: defaultPm },
        });
      }
    }
  } catch {
    // No card available — invoice will finalize as "open" for manual collection.
  }

  // Create a DRAFT invoice first, then attach the line item DIRECTLY to it, then
  // finalize. Leaving the item "pending" (the old approach) produced $0 invoices
  // because it was never pulled onto this invoice. Attaching by invoice id and
  // excluding stray pending items guarantees the amount lands here.
  const invoiceParams: Stripe.InvoiceCreateParams = {
    customer: agent.stripe_customer_id,
    auto_advance: false,
    collection_method: "charge_automatically",
    pending_invoice_items_behavior: "exclude",
    metadata: {
      campaign_id,
      agent_id,
    },
  };
  if (defaultPm) invoiceParams.default_payment_method = defaultPm;

  // Apply coupon discount if agent has one
  if (agent.stripe_coupon_id) {
    invoiceParams.discounts = [{ coupon: agent.stripe_coupon_id }];
  }

  const invoice = await stripe.invoices.create(invoiceParams);

  // Attach the postcard charge directly to this invoice.
  await stripe.invoiceItems.create({
    customer: agent.stripe_customer_id,
    invoice: invoice.id,
    amount: Math.round(pricePerCard * totalCards * 100), // cents
    currency: "usd",
    description: `${description} — ${totalCards} postcards @ $${pricePerCard.toFixed(2)}`,
    tax_code: "txcd_10103001",
    metadata: { campaign_id, type: "postcard", count: String(totalCards) },
  });

  // Finalize, then attempt payment against the card on file.
  let finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
  if (finalizedInvoice.status === "open" && defaultPm) {
    try {
      finalizedInvoice = await stripe.invoices.pay(invoice.id);
    } catch {
      // Payment needs authentication or was declined — leave open for the agent
      // to complete via the hosted invoice link.
    }
  }

  // Create billing record

  await admin.from("billing_records").insert({
    agent_id,
    stripe_invoice_id: invoice.id,
    campaign_id,
    description,
    total_cards: totalCards,
    mailed_cards: totalCards,
    unmailed_cards: unmailedCards,
    price_per_mailed: pricePerCard,
    price_per_unmailed: 0,
    subtotal,
    tax: 0,
    total: finalizedInvoice.total != null ? finalizedInvoice.total / 100 : subtotal,
    status: finalizedInvoice.status === "paid" ? "paid" : "pending",
    billing_date: new Date().toISOString().split("T")[0],
  });

  // Mark this agent-campaign as billed so it can never be charged twice.
  await admin
    .from("agent_campaigns")
    .update({ billed: true })
    .eq("id", agentCampaign.id);

  const amountCharged = finalizedInvoice.total != null ? finalizedInvoice.total / 100 : subtotal;
  return NextResponse.json({
    invoice_id: invoice.id,
    invoice_url: finalizedInvoice.hosted_invoice_url,
    total: amountCharged,
    total_cards: totalCards,
    status: finalizedInvoice.status,
    paid: finalizedInvoice.status === "paid",
  });
}
