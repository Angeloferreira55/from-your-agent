import { haversineDistance } from "./distance";
import { getContactCoordinates, getOfferCoordinates } from "./zip-lookup";

export interface OfferMatch {
  contactId: string;
  offerId: string;
  distance: number; // miles
  offerTitle: string;
  discountText: string;
  merchantName: string;
}

/**
 * For each contact, find the nearest offer from the campaign's offer pool.
 * Falls back to the first offer if no coordinates are available.
 */
export async function matchContactsToOffers(
  contactIds: string[],
  offerIds: string[]
): Promise<Map<string, OfferMatch>> {
  const matches = new Map<string, OfferMatch>();

  if (contactIds.length === 0 || offerIds.length === 0) return matches;

  // Fetch coordinates
  const contactCoords = await getContactCoordinates(contactIds);
  const offerCoords = await getOfferCoordinates(offerIds);

  const offerEntries = Array.from(offerCoords.entries());

  for (const contactId of contactIds) {
    const contactLoc = contactCoords.get(contactId);

    if (!contactLoc || offerEntries.length === 0) {
      // No coordinates — fall back to first offer
      const firstOffer = offerEntries[0];
      if (firstOffer) {
        matches.set(contactId, {
          contactId,
          offerId: firstOffer[0],
          distance: -1, // unknown
          offerTitle: firstOffer[1].title,
          discountText: firstOffer[1].discount_text,
          merchantName: firstOffer[1].merchant_name,
        });
      }
      continue;
    }

    // Find nearest offer by distance
    let nearestId = offerEntries[0][0];
    let nearestDist = Infinity;
    let nearestData = offerEntries[0][1];

    for (const [offerId, offerData] of offerEntries) {
      const dist = haversineDistance(
        contactLoc.latitude,
        contactLoc.longitude,
        offerData.latitude,
        offerData.longitude
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = offerId;
        nearestData = offerData;
      }
    }

    matches.set(contactId, {
      contactId,
      offerId: nearestId,
      distance: Math.round(nearestDist * 10) / 10,
      offerTitle: nearestData.title,
      discountText: nearestData.discount_text,
      merchantName: nearestData.merchant_name,
    });
  }

  return matches;
}

/**
 * Preview which offers would be matched for an agent's contacts
 * against a set of campaign offers.
 */
export async function previewOfferMatches(
  agentId: string,
  offerIds: string[]
): Promise<OfferMatch[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Get all active contacts for this agent
  const { data: contacts } = await admin
    .from("contacts")
    .select("id")
    .eq("agent_id", agentId)
    .eq("status", "active");

  if (!contacts || contacts.length === 0) return [];

  const contactIds = contacts.map((c) => c.id);
  const matches = await matchContactsToOffers(contactIds, offerIds);
  return Array.from(matches.values());
}
