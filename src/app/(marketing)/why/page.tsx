import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Why From Your Agent — Direct Mail Marketing Made Easy",
  description:
    "From Your Agent helps real estate agents stay in consistent contact with clients and friends through done-for-you postcard mailing services.",
};

export default function WhyPage() {
  return (
    <div>
      {/* Why From Your Agent — Stats */}
      <section className="bg-[#F5F7FA] pt-16 pb-10">
        <div className="mx-auto max-w-4xl px-6">
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E8733A]" />
              <span><strong>91%</strong> of agents never contact clients after closing, yet <strong>88%</strong> of those clients say they&apos;d use the same agent again — the drop-off is almost entirely a follow-up failure.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E8733A]" />
              <span>Fewer than <strong>15%</strong> of past clients actually return or refer, despite intending to, because agents lose touch during the gap between transactions.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E8733A]" />
              <span>Texting is the dominant channel (<strong>94%</strong> of Realtors use it), followed by phone (<strong>91%</strong>) and email (<strong>89%</strong>), but this is mostly during active deals — not post-closing nurture.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E8733A]" />
              <span><strong>41%</strong> of an agent&apos;s business comes from repeat and referral clients (<strong>20%</strong> repeat, <strong>21%</strong> referral), and that share climbs past <strong>50%</strong> for agents with <strong>16+</strong> years of experience.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E8733A]" />
              <span><strong>48%</strong> of salespeople never follow up even once, and <strong>44%</strong> quit after a single &quot;no&quot; — yet data shows conversions spike after <strong>5–8</strong> touches.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Referral Banner */}
      <section className="bg-[#F5F7FA]">
        <div className="mx-auto max-w-5xl px-6 pb-10">
          <img
            src="/referral-banner.png"
            alt="70% Referral — One Success Spreading to Many"
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* Why Relationship Marketing */}
      <section className="bg-[#F5F7FA] pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-3">
                Relationships That Turn Into Revenue
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Relationships convert better than billboards</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />More than half of transactions start with familiarity or referral</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Repetition builds recognition. Recognition builds trust.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-3">
                Most of Your Past Clients Are Slipping Away
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Loyalty fades without connection</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />The main reason? No consistent follow-up</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Long-term success comes from consistent communication</li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-3">
                The Agent They Remember Gets the Call
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Maintain regular touchpoints with your audience</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Out of sight means replaced</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8733A]" />Be the first agent that comes to mind</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Flyer + CTA */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 flex flex-col items-center">
          <img
            src="/custom-closet-add.png"
            alt="Direct Mail Postcard Mockup"
            className="w-full max-w-2xl rounded-lg shadow-xl"
          />

          <p className="mt-10 text-lg text-gray-600 text-center max-w-2xl">
            Your past clients are your best source of future business. We make direct mail
            marketing for your sphere simple, seamless, and
            effective.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="text-[#0B1F3B] text-lg px-8">
                See Sample Postcards
              </Button>
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2">
            {[
              "Personalized with your brand & message",
              "Professional design & printing",
              "We handle postage & delivery",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Statement */}
      <section className="bg-[#0B1F3B] text-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold leading-snug">
            Simply upload your list of{" "}
            <span className="text-[#E8733A]">clients, friends, and database contacts</span>{" "}
            — we&apos;ll take care of the rest.
          </h2>
          <p className="mt-6 text-lg text-gray-300">
            We handle the design, printing, mailing, and delivery so you stay
            top-of-mind all year long — without adding more to your plate.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-8 bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8">
              Upload Your List
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
