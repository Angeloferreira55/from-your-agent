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
      {/* Hero */}
      <section className="bg-[#F5F7FA] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#0B1F3B] leading-tight">
              We Make Direct Mail Marketing for Your{" "}
              <span className="text-[#E8733A]">Clients &amp; Friends</span> Easy.
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              From Your Agent helps you stay in consistent contact with your
              clients, friends, and database through completely done-for-you
              postcard mailing services.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
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

            <ul className="mt-8 space-y-2">
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

          <div className="flex-1 max-w-lg">
            <img
              src="/sample-deal-closet.png"
              alt="Direct Mail Postcard Mockup"
              className="w-full rounded-lg shadow-xl"
            />
          </div>
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
