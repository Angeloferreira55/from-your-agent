import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// Lob event types we care about
const STATUS_MAP: Record<string, string> = {
  "postcard.in_transit": "in_transit",
  "postcard.in_local_area": "in_local_area",
  "postcard.processed_for_delivery": "delivered",
  "postcard.delivered": "delivered",
  "postcard.returned_to_sender": "returned",
  "postcard.re-routed": "in_transit",
};

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expected = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify webhook signature if secret is configured
  const webhookSecret = process.env.LOB_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get("lob-signature");
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type?.id as string;
  const lobPostcardId = event.body?.id as string;

  if (!eventType || !lobPostcardId) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const newStatus = STATUS_MAP[eventType];
  if (!newStatus) {
    // Event type we don't track — acknowledge but don't process
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  // Find the postcard by Lob ID
  const { data: postcard } = await admin
    .from("postcards")
    .select("id, campaign_id, status")
    .eq("lob_postcard_id", lobPostcardId)
    .single();

  if (!postcard) {
    return NextResponse.json({ error: "Postcard not found" }, { status: 404 });
  }

  // Update postcard status
  const updates: Record<string, unknown> = { status: newStatus };

  if (event.body?.url) {
    updates.lob_url = event.body.url;
  }

  await admin
    .from("postcards")
    .update(updates)
    .eq("id", postcard.id);

  // Update campaign counters based on status
  if (newStatus === "delivered" && postcard.status !== "delivered") {
    await admin.rpc("increment_campaign_counter", {
      p_campaign_id: postcard.campaign_id,
      p_column: "delivered_count",
    });
  } else if (newStatus === "returned" && postcard.status !== "returned") {
    await admin.rpc("increment_campaign_counter", {
      p_campaign_id: postcard.campaign_id,
      p_column: "returned_count",
    });
  }

  return NextResponse.json({ ok: true, postcard_id: postcard.id, status: newStatus });
}
