import { stripe } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Create or retrieve a Stripe customer for an agent.
 */
export async function getOrCreateStripeCustomer(agentId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: agent } = await admin
    .from("agent_profiles")
    .select("stripe_customer_id, email, first_name, last_name, company_name")
    .eq("id", agentId)
    .single();

  if (!agent) throw new Error("Agent not found");

  // Return existing customer ID if already set
  if (agent.stripe_customer_id) {
    return agent.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: agent.email,
    name: `${agent.first_name} ${agent.last_name}`,
    metadata: {
      agent_id: agentId,
      company: agent.company_name || "",
    },
  });

  // Save customer ID to profile
  await admin
    .from("agent_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", agentId);

  return customer.id;
}

/**
 * Report usage (postcard count) for billing.
 * Uses Stripe's usage-based billing via invoice items.
 */
export async function reportUsage(
  customerId: string,
  mailedCards: number,
  unmailedCards: number,
  campaignId: string,
  description: string
): Promise<void> {
  const { getPricePerCard } = await import("./config");
  const totalCards = mailedCards + unmailedCards;

  // Create invoice items for mailed cards
  if (mailedCards > 0) {
    const pricePerMailed = getPricePerCard(totalCards, true);
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(pricePerMailed * mailedCards * 100), // cents
      currency: "usd",
      description: `${description} — ${mailedCards} mailed postcards @ $${pricePerMailed.toFixed(2)}`,
      metadata: {
        campaign_id: campaignId,
        type: "mailed",
        count: String(mailedCards),
      },
    });
  }

  // Create invoice items for unmailed (opted-in but not mailed) cards
  if (unmailedCards > 0) {
    const pricePerUnmailed = getPricePerCard(totalCards, false);
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(pricePerUnmailed * unmailedCards * 100), // cents
      currency: "usd",
      description: `${description} — ${unmailedCards} unmailed postcards @ $${pricePerUnmailed.toFixed(2)}`,
      metadata: {
        campaign_id: campaignId,
        type: "unmailed",
        count: String(unmailedCards),
      },
    });
  }
}
