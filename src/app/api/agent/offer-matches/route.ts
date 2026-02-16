import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { previewOfferMatches } from "@/lib/geo/matching";

// GET — Preview which offers would be matched for this agent's contacts
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaign_id");

  if (!campaignId) {
    return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
  }

  // Get campaign offers
  const { data: campaign } = await admin
    .from("campaigns")
    .select("offer_ids")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const matches = await previewOfferMatches(profile.id, campaign.offer_ids || []);

  // Aggregate: count contacts per offer
  const offerCounts: Record<string, { offerId: string; merchantName: string; offerTitle: string; discountText: string; contactCount: number; avgDistance: number }> = {};
  for (const match of matches) {
    if (!offerCounts[match.offerId]) {
      offerCounts[match.offerId] = {
        offerId: match.offerId,
        merchantName: match.merchantName,
        offerTitle: match.offerTitle,
        discountText: match.discountText,
        contactCount: 0,
        avgDistance: 0,
      };
    }
    offerCounts[match.offerId].contactCount++;
    if (match.distance >= 0) {
      offerCounts[match.offerId].avgDistance += match.distance;
    }
  }

  // Calculate averages
  for (const entry of Object.values(offerCounts)) {
    if (entry.contactCount > 0 && entry.avgDistance > 0) {
      entry.avgDistance = Math.round((entry.avgDistance / entry.contactCount) * 10) / 10;
    }
  }

  return NextResponse.json({
    matches: Object.values(offerCounts),
    totalContacts: matches.length,
  });
}
