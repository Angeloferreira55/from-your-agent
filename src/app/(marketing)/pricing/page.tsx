import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Pricing — From Your Agent",
  description: "Simple, transparent pricing. Pay per postcard with volume discounts. No contracts, no minimums.",
};

const tiers = [
  {
    name: "Starter",
    range: "1 - 99 cards / month",
    mailed: 1.25,
    unmailed: 0.90,
    popular: false,
    description: "Perfect for agents just getting started with relationship marketing.",
  },
  {
    name: "Standard",
    range: "100 - 499 cards / month",
    mailed: 1.10,
    unmailed: 0.85,
    popular: true,
    description: "The most popular tier. Great for established agents with a solid sphere.",
  },
  {
    name: "Volume",
    range: "500+ cards / month",
    mailed: 1.00,
    unmailed: 0.85,
    popular: false,
    description: "Best value for top producers and teams with large databases.",
  },
];

const included = [
  "6x9 full-color postcards",
  "Professional printing & USPS mailing",
  "CASS-certified address verification",
  "Real-time delivery tracking",
  "Custom branding (headshot, logo, message)",
  "Curated local merchant offers",
  "Geo-targeted offer matching",
  "CSV import & database management",
  "Postcard preview before mailing",
  "No setup fees",
  "No contracts — cancel anytime",
  "No minimums — send as few or as many as you want",
];

const faqs = [
  {
    q: "What's the difference between mailed and unmailed pricing?",
    a: "Mailed price applies to postcards that are printed, stamped, and delivered. Unmailed price applies when you opt in to a campaign but choose not to mail to certain contacts — you're still charged a smaller amount for the personalization and offer slot reserved for those contacts.",
  },
  {
    q: "How does volume pricing work?",
    a: "Your tier is based on your total card count for the month. If you send 150 cards in a month, all 150 cards are priced at the Standard tier ($1.10 each), not just the ones over 100.",
  },
  {
    q: "Are there any hidden fees?",
    a: "None. The per-card price includes printing, postage, address verification, and delivery tracking. There are no monthly fees, setup fees, or cancellation fees.",
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#FDF2F4] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1a1a2e] md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pay per card. No hidden fees, no contracts, no minimums. Volume discounts applied automatically.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={tier.popular ? "border-2 border-[#C02646] shadow-xl relative" : ""}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#C02646] px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tier.range}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mt-2">
                    <span className="text-5xl font-extrabold">${tier.mailed.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground"> / mailed card</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ${tier.unmailed.toFixed(2)} / unmailed card
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">{tier.description}</p>
                  <Link href="/signup" className="mt-6 block">
                    <Button
                      className={
                        tier.popular
                          ? "w-full bg-[#C02646] hover:bg-[#A01E38] text-white"
                          : "w-full"
                      }
                      variant={tier.popular ? "default" : "outline"}
                      size="lg"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="border-t bg-[#F7F8FA] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-serif text-center text-3xl font-bold text-[#1a1a2e]">Everything Included</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Every tier includes the same full feature set. No feature gating.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-serif text-center text-3xl font-bold text-[#1a1a2e] flex items-center justify-center gap-2">
            <HelpCircle className="h-7 w-7 text-[#C02646]" />
            Pricing FAQ
          </h2>
          <div className="mt-10 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border p-5">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-[#FDF2F4] py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">One referral pays for an entire year</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            The average commission on a single referral easily covers the cost of mailing postcards to your entire sphere for 12 months.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-6 bg-[#C02646] hover:bg-[#A01E38] text-white text-lg px-8">
              Start Your First Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
