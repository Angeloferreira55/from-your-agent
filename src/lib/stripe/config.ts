/**
 * Stripe product/price configuration.
 * In production these would be created in the Stripe Dashboard and referenced by ID.
 * For development, we use these as defaults.
 */
export const STRIPE_CONFIG = {
  // The product representing postcard mailing
  productName: "Postcard Mailing",

  // Pricing tiers (matched to DB pricing_tiers)
  tiers: [
    { name: "Starter", minCards: 1, maxCards: 99, pricePerMailed: 1.25, pricePerUnmailed: 0.90 },
    { name: "Standard", minCards: 100, maxCards: 499, pricePerMailed: 1.10, pricePerUnmailed: 0.85 },
    { name: "Volume", minCards: 500, maxCards: null, pricePerMailed: 1.00, pricePerUnmailed: 0.85 },
  ],

  // Portal return URL
  portalReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing`,

  // Success/cancel URLs for checkout
  checkoutSuccessUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?success=true`,
  checkoutCancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
};

/**
 * Get the price per card based on total count.
 */
export function getPricePerCard(totalCards: number, mailed: boolean): number {
  for (const tier of STRIPE_CONFIG.tiers) {
    if (totalCards >= tier.minCards && (tier.maxCards === null || totalCards <= tier.maxCards)) {
      return mailed ? tier.pricePerMailed : tier.pricePerUnmailed;
    }
  }
  return mailed ? 1.25 : 0.90;
}
