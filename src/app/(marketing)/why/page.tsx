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
      {/* Referral Banner */}
      <section className="bg-[#F5F7FA]">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-10">
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
              <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-4">
                Building Trust to Build Your Referrals
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In a high-dollar, complicated transaction like buying or selling a home, consumers won&apos;t make the decision to trust an agent by looking at their face on a bus bench. They want a referral from someone they trust! That&apos;s why 54% of home buyers last year either already knew their agent or found them from a referral. A relationship marketing program will ensure your referral network knows, likes and trusts you enough to refer their friends and family.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-4">
                You Are Losing 80% of Your Customers
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                According to the National Association of REALTORS, over 80% of home buyers and sellers say they would use their real estate agent again or refer them to friends. But only 20% of them actually do! Why? The number one reason consumers say they don&apos;t go back to their real estate agent for future transactions or refer their friends is that the agent DIDN&apos;T KEEP IN TOUCH! Maintain high quality contact with your clients and friends - it&apos;s critical to your success.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-4">
                Staying Top of Mind is the Key to Referrals
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you don&apos;t keep in constant contact and reward your customers and sphere for their relationship with you, it becomes easier and easier to lose their business and referrals to someone else. Top referral generators know you need to touch your sphere at least 2-3 times per month. When someone in your sphere hears the words &quot;real estate&quot; they need to immediately think of, and recommend, YOU!
              </p>
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
            Because referrals are the name of the game, we make direct mail
            marketing for your clients and friends simple, seamless, and
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
