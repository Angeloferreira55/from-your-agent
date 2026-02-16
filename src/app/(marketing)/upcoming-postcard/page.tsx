import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin, Gift } from "lucide-react";

export const metadata = {
  title: "Upcoming Postcard — From Your Agent",
  description: "See this month's curated local merchant deal featured on every postcard.",
};

export default function UpcomingPostcardPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0B1F3B] text-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#E8733A] mb-3">
            Next Month&apos;s Exclusive Deal
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            This Month&apos;s Postcard
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            See the curated local deal your contacts will receive this month.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#E8733A]" />
              March 2026
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#E8733A]" />
              Albuquerque, NM
            </span>
            <span className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-[#E8733A]" />
              Custom Closet Guys
            </span>
          </div>
        </div>
      </section>

      {/* Postcard Preview */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-10 md:grid-cols-2 items-start">
            {/* Front */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Front of Postcard
              </p>
              <div className="overflow-hidden rounded-xl border shadow-lg bg-white" style={{ aspectRatio: "9/6" }}>
                <img
                  src="/custom-closet-add.png"
                  alt="Postcard Front — Custom Closet Guys"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Back */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Back of Postcard
              </p>
              <div className="overflow-hidden rounded-xl border shadow-lg bg-white" style={{ aspectRatio: "9/6" }}>
                <div className="flex h-full">
                  {/* Left half — Agent branding */}
                  <div className="flex w-1/2 flex-col border-r p-3 md:p-4">
                    {/* Photo + KW Logo */}
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <div className="h-14 w-14 md:h-20 md:w-20 shrink-0 rounded-lg border-2 border-[#B40101] overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <img
                          src="/sample-agent-woman.jpg"
                          alt="Liz Garcia"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col justify-start">
                        <img
                          src="/kw-logo.png"
                          alt="Keller Williams Realty"
                          className="h-8 md:h-12 w-auto object-contain object-left"
                        />
                        <p className="text-[5px] md:text-[7px] text-gray-400 leading-none mt-0.5">(505) 292-8900</p>
                        <p className="text-[5px] md:text-[7px] text-gray-400 leading-none mt-px">6703 Academy NE, Albuquerque, NM 87109</p>
                      </div>
                    </div>

                    {/* Agent name + contact details */}
                    <div className="mb-1">
                      <p className="text-[9px] md:text-[11px] font-bold text-gray-900 leading-tight">Liz Garcia</p>
                      <p className="text-[6px] md:text-[8px] italic text-[#B40101] mt-0.5">Your Trusted Real Estate Expert</p>
                      <p className="text-[5px] md:text-[6.5px] text-gray-500 whitespace-nowrap mt-0.5">
                        (505) 555-0147 | liz.garcia@kw.com
                      </p>
                      <p className="text-[5px] md:text-[8px] text-gray-400">NM Lic #67890</p>
                    </div>

                    {/* Featured Deal — Custom Closet Guys */}
                    <div className="flex-1 flex items-start gap-1 -ml-1 md:-ml-2.5">
                      <img
                        src="/sample-deal-closet-back.png"
                        alt="Custom Closet Guys"
                        className="h-full max-w-[55%] object-contain rounded mix-blend-multiply shrink-0"
                      />
                      <div className="min-w-0 space-y-px mt-2 md:mt-5">
                        <p className="text-[7px] md:text-[9px] font-bold text-gray-900 leading-tight whitespace-nowrap">Custom Closet Guys</p>
                        <p className="text-[5px] md:text-[6.5px] italic text-gray-500 leading-tight whitespace-nowrap mb-2 md:mb-4">Where Style Meets Storage</p>
                        <p className="text-[6px] md:text-[8px] font-bold text-gray-700 leading-tight">(505) 546-1788</p>
                        <p className="text-[4px] md:text-[5.5px] text-gray-500 leading-tight">richard@customclosetguys.com</p>
                        <p className="text-[5px] md:text-[6.5px] text-gray-500 leading-tight">customclosetguys.com</p>
                      </div>
                    </div>

                    {/* Custom message */}
                    <div className="mt-auto pt-1 border-t border-gray-100">
                      <p className="text-[5px] md:text-[7px] text-gray-500 leading-tight">
                        Thanks for being a valued part of my network! Enjoy this exclusive local deal — and remember, I&apos;m always here for your real estate needs.
                      </p>
                    </div>
                  </div>

                  {/* Right half — Mailing area */}
                  <div className="flex w-1/2 flex-col p-3 md:p-4">
                    {/* Stamp area */}
                    <div className="self-end mb-4">
                      <div className="h-6 w-8 md:h-8 md:w-10 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <p className="text-[5px] md:text-[6px] text-gray-400 text-center leading-tight">POSTAGE</p>
                      </div>
                    </div>

                    {/* Accent bar */}
                    <div className="h-0.5 w-8 md:w-10 rounded-full mb-3 bg-[#B40101]" />

                    {/* Recipient */}
                    <div className="mt-auto">
                      <p className="text-[8px] md:text-[10px] font-semibold text-gray-900">John &amp; Sarah Johnson</p>
                      <p className="text-[7px] md:text-[9px] text-gray-600">123 Main Street</p>
                      <p className="text-[7px] md:text-[9px] text-gray-600">Albuquerque, NM 87110</p>
                    </div>

                    {/* Barcode placeholder */}
                    <div className="mt-3 flex gap-px">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-800"
                          style={{
                            width: 1.5,
                            height: i % 3 === 0 ? 12 : 8,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deal Details */}
          <div className="mt-16 rounded-2xl bg-[#F7F8FA] p-8 md:p-12">
            <h2 className="font-serif text-2xl font-bold text-[#1a1a2e] md:text-3xl">
              Featured Deal: Custom Closet Guys
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              This month&apos;s postcard features an exclusive offer from Custom Closet Guys — FREE Consultation and $250 off your custom closet, as a gift from their agent. Your contacts will receive a beautifully designed 6x9 postcard with this deal on the front and your personalized branding on the back.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "FREE Consultation + $250 off any custom closet project",
                "Professional 6x9 full-color postcard",
                "Your headshot, logo, and branding on the back",
                "Delivered via USPS First-Class Mail",
                "Typically arrives the first week of March",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#E8733A]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* More Samples */}
      <section className="border-t bg-[#F7F8FA] py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-[#1a1a2e] md:text-3xl">
            Postcards Your Clients and Friends Will Enjoy
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every month features a new curated local deal — here&apos;s a sample of what goes out.
          </p>
          <div className="mt-10">
            <img
              src="/postcards-enjoy.png"
              alt="Sample postcards your clients and friends will enjoy"
              className="mx-auto w-full max-w-3xl rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-[#FFF5EE] py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">
            Want this postcard sent to your contacts?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Sign up, upload your list, and we&apos;ll handle the rest.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-6 bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
