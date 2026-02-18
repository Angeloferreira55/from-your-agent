import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "setup") break;

      const customerId = session.customer as string;
      await admin
        .from("agent_profiles")
        .update({ subscription_status: "active" })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeInvoiceId = invoice.id;

      await admin
        .from("billing_records")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("stripe_invoice_id", stripeInvoiceId);

      const campaignId = invoice.metadata?.campaign_id;
      if (campaignId) {
        const { data: agentProfile } = await admin
          .from("agent_profiles")
          .select("id")
          .eq("stripe_customer_id", invoice.customer as string)
          .single();

        if (agentProfile) {
          await admin
            .from("agent_campaigns")
            .update({ billed: true })
            .eq("agent_id", agentProfile.id)
            .eq("campaign_id", campaignId);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      await admin
        .from("billing_records")
        .update({ status: "failed" })
        .eq("stripe_invoice_id", invoice.id);

      await admin
        .from("agent_profiles")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
