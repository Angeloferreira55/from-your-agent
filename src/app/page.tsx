import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  Mail,
  Upload,
  Gift,
  Palette,
  PartyPopper,
  MapPin,
  Shield,
  Send,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";

/* ── Sample postcard data for the Past Promotions gallery ── */
const samplePostcards = [
  {
    month: "January",
    theme: "New Year Savings",
    color: "#2563EB",
    emoji: "🍔",
    deal: "$20 OFF",
    bg: "from-amber-50 via-orange-50 to-red-50",
  },
  {
    month: "February",
    theme: "Valentine's Treats",
    color: "#C02646",
    emoji: "🧁",
    deal: "$15 OFF",
    bg: "from-pink-50 via-rose-50 to-red-50",
  },
  {
    month: "March",
    theme: "Spring Into Savings",
    color: "#059669",
    emoji: "🥗",
    deal: "$10 OFF",
    bg: "from-green-50 via-emerald-50 to-teal-50",
  },
  {
    month: "April",
    theme: "Local Favorites",
    color: "#7C3AED",
    emoji: "🍕",
    deal: "BOGO",
    bg: "from-violet-50 via-purple-50 to-fuchsia-50",
  },
];

const testimonials = [
  {
    quote:
      "I got 3 referrals in my first two months. My sphere loves getting the postcards — they actually thank me for the local deals.",
    name: "Sarah M.",
    title: "Real Estate Agent",
    company: "Keller Williams — Phoenix, AZ",
  },
  {
    quote:
      "This is the easiest marketing I've ever done. Upload my contacts, and the postcards go out every month. I wish I'd started years ago.",
    name: "James R.",
    title: "Broker Associate",
    company: "RE/MAX — Denver, CO",
  },
  {
    quote:
      "My clients love the local deals, and I love that my face shows up in their mailbox every month. It's the best $1 per contact I spend.",
    name: "Monica L.",
    title: "Realtor",
    company: "Coldwell Banker — Austin, TX",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1a1a2e] md:text-6xl md:leading-[1.15]">
              Helping Real Estate Agents Build{" "}
              <span className="text-[#C02646]">Repeat</span> &{" "}
              <span className="text-[#C02646]">Referral</span> Business.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Reward your customers and friends with
              outstanding free offers &amp; discounts as a gift from their agent.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-[#C02646] hover:bg-[#A01E38] text-white text-lg px-8"
                >
                  Subscribe Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[
                "No Sign Up Fees",
                "No Contracts",
                "No Commitments",
                "No Minimums",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="border-t bg-[#F7F8FA] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-center text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Four simple steps from sign-up to your contacts&apos; mailboxes
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Upload,
                step: "1",
                title: "Upload",
                description:
                  "Import your sphere of influence — past clients, prospects, friends & family. Upload via CSV or add manually.",
              },
              {
                icon: Gift,
                step: "2",
                title: "Monthly Offers",
                description:
                  "Each month we curate exclusive local merchant deals — restaurants, spas, gyms & more — for your contacts.",
              },
              {
                icon: Palette,
                step: "3",
                title: "Personalize",
                description:
                  "Add your headshot, logo, brand color, and a personal message. Every postcard is uniquely yours.",
              },
              {
                icon: PartyPopper,
                step: "4",
                title: "Results",
                description:
                  "Beautiful postcards arrive in your contacts' mailboxes every month. You stay top of mind — automatically.",
              },
            ].map((item) => (
              <Card key={item.step} className="bg-white text-center shadow-sm">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <item.icon className="h-7 w-7 text-[#007AFF]" />
                  </div>
                  <div className="mt-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#C02646] text-xs font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/how-it-works">
              <Button variant="link" className="text-[#C02646]">
                Learn more about how it works{" "}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ VALUE PROPOSITION ═══════════════ */}
      <section className="border-t bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
                Why From Your Agent?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Physical mail doesn&apos;t get deleted, swiped away, or lost in
                an inbox. A beautifully printed postcard with local deals your
                contacts actually want — delivered monthly with your face, name,
                and branding — keeps you top of mind in the most tangible way
                possible.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: Mail,
                  title: "Physical Mail That Sticks",
                  desc: "97% of direct mail gets opened vs. 20% for email. Your postcard lives on the fridge, not the spam folder.",
                },
                {
                  icon: MapPin,
                  title: "Geo-Targeted Local Deals",
                  desc: "Every contact receives offers from merchants closest to them. Real value they'll actually use.",
                },
                {
                  icon: Shield,
                  title: "Fully Branded to You",
                  desc: "Your headshot, logo, colors, and personal message on every card. It's your marketing, automated.",
                },
                {
                  icon: Send,
                  title: "Delivery Tracking",
                  desc: "Know exactly when every postcard is printed, mailed, and delivered. Full visibility in your dashboard.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <item.icon className="h-5 w-5 text-[#007AFF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PAST PROMOTIONS GALLERY ═══════════════ */}
      <section className="border-t bg-[#F7F8FA] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-center text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            See What Your Contacts Receive
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Each month features new curated local deals. Here are some past
            promotions.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {samplePostcards.map((card) => (
              <div
                key={card.month}
                className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                style={{ aspectRatio: "9/6.5" }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 text-white"
                  style={{ backgroundColor: card.color }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                    {card.month} 2026 — Exclusive Local Deals
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {card.theme}
                  </p>
                </div>

                {/* Image area with deal badge */}
                <div className={`relative flex-1 bg-gradient-to-br ${card.bg}`}>
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl">{card.emoji}</span>
                  </div>
                  {/* Deal badge */}
                  <div
                    className="absolute right-3 top-3 rounded-lg px-3 py-1.5 text-white shadow-lg"
                    style={{ backgroundColor: card.color }}
                  >
                    <p className="text-xs font-extrabold leading-tight">{card.deal}</p>
                  </div>
                  {/* Gift from overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
                    <p className="text-[10px] text-white/80">Enjoy this as a gift from</p>
                    <p className="text-sm font-bold text-white">Your Name Here</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-4 py-2">
                  <p className="text-[8px] text-gray-400 text-center">
                    From Your Agent — Exclusive neighborhood deals
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST SECTION ═══════════════ */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            Trusted by Agents at the Nation&apos;s Top Brokerages
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Real estate professionals across the country use From Your Agent to
            stay top of mind and grow their referral business.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {[
              "No Sign Up Fees",
              "No Contracts",
              "No Commitments",
              "No Minimums",
            ].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[#C02646]/20 bg-[#FDF2F4] px-5 py-2 text-sm font-medium text-[#C02646]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="border-t bg-[#F7F8FA] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-center text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            What Agents Are Saying
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <blockquote className="text-sm text-gray-700 italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.title}, {t.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING PREVIEW ═══════════════ */}
      <section className="border-t bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-center text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Pay per card. No hidden fees, no contracts, no minimums.
          </p>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                range: "1 - 99 cards",
                mailed: "$1.25",
                popular: false,
              },
              {
                name: "Standard",
                range: "100 - 499 cards",
                mailed: "$1.10",
                popular: true,
              },
              {
                name: "Volume",
                range: "500+ cards",
                mailed: "$1.00",
                popular: false,
              },
            ].map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.popular
                    ? "border-2 border-[#C02646] shadow-lg"
                    : ""
                }
              >
                <CardContent className="pt-6 text-center">
                  {tier.popular && (
                    <span className="mb-3 inline-block rounded-full bg-[#FDF2F4] px-3 py-1 text-xs font-semibold text-[#C02646]">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.range}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold">
                      {tier.mailed}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / card
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2 text-left text-sm">
                    {[
                      "6x9 full-color postcards",
                      "Address verification",
                      "Delivery tracking",
                      "Custom branding",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-6 block">
                    <Button
                      className={
                        tier.popular
                          ? "w-full bg-[#C02646] hover:bg-[#A01E38] text-white"
                          : "w-full"
                      }
                      variant={tier.popular ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/pricing">
              <Button variant="link" className="text-[#C02646]">
                See full pricing details{" "}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="border-t bg-[#FDF2F4] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            Ready to grow your referral business?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join hundreds of agents who stay top of mind with monthly postcards.
            One referral pays for an entire year.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="mt-8 bg-[#C02646] hover:bg-[#A01E38] text-white text-lg px-8"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>No sign up fees</span>
            <span>·</span>
            <span>No contracts</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
