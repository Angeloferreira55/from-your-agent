/**
 * Simple zip code centroid lookup.
 * In production, this would use a full ZCTA database or API.
 * For now, we rely on coordinates stored in the contacts table
 * (populated during address verification via Lob).
 *
 * This module provides a fallback for common US zip code centroids
 * and a helper to batch-lookup coordinates.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface ZipCoordinate {
  zip: string;
  latitude: number;
  longitude: number;
}

/**
 * Get coordinates for contacts that have them (from Lob verification).
 * Returns a map of contact_id -> { lat, lng }.
 */
export async function getContactCoordinates(
  contactIds: string[]
): Promise<Map<string, { latitude: number; longitude: number }>> {
  const admin = createAdminClient();
  const coords = new Map<string, { latitude: number; longitude: number }>();

  if (contactIds.length === 0) return coords;

  // Batch fetch in groups of 100
  for (let i = 0; i < contactIds.length; i += 100) {
    const batch = contactIds.slice(i, i + 100);
    const { data } = await admin
      .from("contacts")
      .select("id, latitude, longitude")
      .in("id", batch)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (data) {
      for (const contact of data) {
        if (contact.latitude != null && contact.longitude != null) {
          coords.set(contact.id, {
            latitude: contact.latitude,
            longitude: contact.longitude,
          });
        }
      }
    }
  }

  return coords;
}

/**
 * Get coordinates for merchants/offers that have them.
 * Returns a map of offer_id -> { lat, lng, ...offer_data }.
 */
export async function getOfferCoordinates(
  offerIds: string[]
): Promise<
  Map<
    string,
    {
      latitude: number;
      longitude: number;
      title: string;
      discount_text: string;
      merchant_name: string;
      merchant_city: string;
      merchant_state: string;
      fine_print: string | null;
      redemption_code: string | null;
    }
  >
> {
  const admin = createAdminClient();
  const coords = new Map();

  if (offerIds.length === 0) return coords;

  const { data } = await admin
    .from("offers")
    .select("id, title, discount_text, fine_print, redemption_code, merchants (name, city, state, latitude, longitude)")
    .in("id", offerIds);

  if (data) {
    for (const offer of data) {
      const merchant = offer.merchants as unknown as Record<string, unknown> | null;
      if (merchant?.latitude != null && merchant?.longitude != null) {
        coords.set(offer.id, {
          latitude: merchant.latitude as number,
          longitude: merchant.longitude as number,
          title: offer.title,
          discount_text: offer.discount_text,
          merchant_name: (merchant.name as string) || "",
          merchant_city: (merchant.city as string) || "",
          merchant_state: (merchant.state as string) || "",
          fine_print: offer.fine_print,
          redemption_code: offer.redemption_code,
        });
      }
    }
  }

  return coords;
}
