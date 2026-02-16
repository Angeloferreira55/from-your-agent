import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Palette,
  Send,
  MapPin,
  Mail,
  BrainCircuit,
  CreditCard,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "How It Works — From Your Agent",
  description: "Learn how From Your Agent helps real estate agents stay top of mind with monthly postcards.",
};

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Database",
    description:
      "Import your sphere of influence — past clients, prospects, friends, and family members. Upload a CSV from any CRM, or add contacts manually. Our smart column mapping auto-detects fields.",
    details: [
      "CSV import with auto-column mapping",
      "Manual contact entry",
      "CASS-certified address verification",
      "Duplicate detection",
    ],
  },
  {
    icon: Palette,
    number: "02",
    title: "Personalize Your Card",
    description:
      "Customize the back of every postcard with your headshot, company logo, brand color, tagline, and a personal message. Preview your card in real-time before it goes out.",
    details: [
      "Upload your headshot and logo",
      "Choose your brand color",
      "Write a personal message",
      "Live postcard preview",
    ],
  },
  {
    icon: MapPin,
    number: "03",
    title: "We Match Local Offers",
    description:
      "Each month, our team curates exclusive deals from popular local merchants — restaurants, spas, fitness studios, and more. We geo-match each contact to the nearest offers.",
    details: [
      "Curated local merchant deals",
      "Geo-targeted by proximity",
      "New offers every month",
      "Exclusive discounts your contacts will love",
    ],
  },
  {
    icon: Mail,
    number: "04",
    title: "Postcards Are Mailed",
    description:
      "Beautiful 6x9 full-color postcards are printed and mailed to your entire database. The front features the local deals, the back features you. Delivered via USPS First-Class Mail.",
    details: [
      "Professional 6x9 full-color printing",
      "USPS First-Class Mail delivery",
      "Typically arrives first week of each month",
      "Real-time delivery tracking",
    ],
  },
  {
    icon: BrainCircuit,
    number: "05",
    title: "Stay Top of Mind",
    description:
      "Your contacts receive a physical postcard with valuable local deals — and your name, face, and contact info. When they need an agent, you're the first person they think of.",
    details: [
      "Monthly touchpoint with your sphere",
      "Tangible marketing that doesn't get deleted",
      "Builds trust and recognition",
      "Drives referrals and repeat business",
    ],
  },
  {
    icon: CreditCard,
    number: "06",
    title: "Simple Pay-Per-Card Billing",
    description:
      "Only pay for what you send. No contracts, no minimums, no setup fees. Volume discounts kick in automatically as your database grows.",
    details: [
      "Pay per postcard — no monthly fee",
      "Volume discounts at 100+ and 500+ cards",
      "Cancel or pause anytime",
      "Transparent pricing, no hidden fees",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#FFF5EE] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1a1a2e] md:text-5xl">
            How It Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Six simple steps from signup to your contacts&apos; mailboxes.
            Automated relationship marketing that works while you sleep.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-16">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`flex flex-col gap-8 md:flex-row ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                } items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8733A] text-sm font-bold text-white">
                      {step.number}
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-[#1a1a2e]">{step.title}</h2>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                  <ul className="mt-4 space-y-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <Card className="w-full md:w-64 shrink-0">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                      <step.icon className="h-8 w-8 text-[#1B3A5C]" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-[#FFF5EE] py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">Ready to get started?</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Sign up in minutes. Upload your contacts. We handle the rest.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-6 bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8">
              Start Sending Postcards
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
