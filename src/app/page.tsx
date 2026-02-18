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
  BrainCircuit,
  MapPin,
  Shield,
  Send,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1a1a2e] md:text-6xl md:leading-[1.15]">
              Own Your Market Through{" "}
              <span className="text-[#E8733A]">Relationship Marketing</span>.{" "}
              Stay Top of Mind. You Will Stay{" "}
              <span className="text-[#E8733A]">Top of Market</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Turn Your Database Into Your #1 Lead Source.
            </p>
            <div className="mt-8">
              <img
                src="/postcards-enjoy.png"
                alt="Sample postcards your clients and friends will enjoy"
                className="mx-auto max-w-4xl w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See The Process
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[
                "Zero Setup Fees",
                "No Contracts",
                "Cancel Anytime",
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
            The Process
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
                  "Import your contacts — past clients, prospects, friends & family. Upload via CSV or add manually.",
              },
              {
                icon: Gift,
                step: "2",
                title: "Monthly Offers",
                description:
                  "Each month we curate an exclusive local merchant deal — dining, wellness, home services, entertainment & more.",
              },
              {
                icon: Palette,
                step: "3",
                title: "Personalize",
                description:
                  "Add your headshot, logo, brand color, and a personal message. Every postcard is uniquely yours.",
              },
              {
                icon: BrainCircuit,
                step: "4",
                title: "Results",
                description:
                  "Beautiful postcards arrive in your contacts' mailboxes every month. You stay top of mind — automatically.",
              },
            ].map((item) => (
              <Card key={item.step} className="bg-white text-center shadow-sm">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <item.icon className="h-7 w-7 text-[#1B3A5C]" />
                  </div>
                  <div className="mt-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E8733A] text-xs font-bold text-white">
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
        </div>
      </section>

      {/* ═══════════════ VALUE PROPOSITION ═══════════════ */}
      <section className="border-t bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
                Our Approach
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
                  title: "Curated Local Deals",
                  desc: "Every month features a great local merchant deal your contacts will actually use. Real value in their mailbox.",
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
                    <item.icon className="h-5 w-5 text-[#1B3A5C]" />
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

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="border-t bg-[#FFF5EE] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-4xl">
            Ready to grow your referral business?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A single referral doesn&apos;t just pay for itself — it funds your entire marketing pipeline.
            <br />
            One closing covers 12 months of monthly mailers to 150 contacts.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="mt-8 bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>Zero setup fees</span>
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
