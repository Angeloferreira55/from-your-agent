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

  // Verify existing customer ID is valid on this Stripe account
  if (agent.stripe_customer_id) {
    try {
      await stripe.customers.retrieve(agent.stripe_customer_id);
      return agent.stripe_customer_id;
    } catch {
      // Customer doesn't exist on this Stripe account — create a new one
    }
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
  cardCount: number,
  _unused: number,
  campaignId: string,
  description: string,
  totalForPricing?: number
): Promise<void> {
  const { getPricePerCard } = await import("./config");

  if (cardCount > 0) {
    // Use totalForPricing for tier calculation if provided (e.g. mailed + prints combined)
    const pricePerCard = getPricePerCard(totalForPricing ?? cardCount);
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(pricePerCard * cardCount * 100), // cents
      currency: "usd",
      description: `${description} — ${cardCount} postcards @ $${pricePerCard.toFixed(2)}`,
      metadata: {
        campaign_id: campaignId,
        type: "postcard",
        count: String(cardCount),
      },
    });
  }
}
