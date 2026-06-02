import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin, Gift } from "lucide-react";

export const metadata = {
  title: "This Month's Postcard — June 2026 — From Your Agent",
  description: "June 2026: 10% off roof repairs or $500 off a roof replacement from Roof Repair Today — this month's curated local merchant deal featured on every postcard.",
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
              June 2026
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#E8733A]" />
              Albuquerque, NM
            </span>
            <span className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-[#E8733A]" />
              Roof Repair Today
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
                  src="/roof-repair-front.png"
                  alt="Postcard Front — Roof Repair Today"
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
                <div className="flex flex-col h-full">
                  {/* Top half — Featured Offer Panel (your designed postcard back, spanning top-left + top-right) */}
                  <div className="relative flex h-1/2 overflow-hidden" style={{ backgroundColor: '#1B3A5C' }}>
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />

                    {/* Headline */}
                    <p
                      className="absolute text-center font-bold uppercase text-white leading-tight text-[8px] md:text-[13px]"
                      style={{ left: '0.4%', top: '4.6%', width: '99%', fontFamily: "'Century Gothic', Futura, sans-serif" }}
                    >
                      Extend the Life of Your Roof
                    </p>

                    {/* Roof photo (top-left) */}
                    <img
                      src="/roof-repair-logo.jpg"
                      alt="Roof Repair Today"
                      className="absolute object-contain"
                      style={{ left: '4.2%', top: '15.6%', width: '45.9%', height: '69.2%' }}
                    />

                    {/* What we offer (top-right) */}
                    <p
                      className="absolute text-center text-white leading-tight whitespace-pre-line text-[5.5px] md:text-[8.5px]"
                      style={{ left: '50.7%', top: '14.9%', width: '48.6%' }}
                    >
                      {"WE OFFER :\nRoof Repairs · Roof Maintenance\nRoof Replacement\nSilicone Roof Coating"}
                    </p>

                    {/* The deal (top-right) */}
                    <p
                      className="absolute text-center font-bold uppercase text-white leading-tight whitespace-pre-line text-[7px] md:text-[12px]"
                      style={{ left: '50.9%', top: '39.3%', width: '48.8%', fontFamily: "'Century Gothic', Futura, sans-serif" }}
                    >
                      {"10% OFF Roof Repairs\n$500 OFF Roof Replacement\nor Roof Coating"}
                    </p>

                    {/* Merchant contact (top-right) */}
                    <p
                      className="absolute text-center text-white leading-tight whitespace-pre-line font-mono text-[5px] md:text-[8px]"
                      style={{ left: '50.6%', top: '68.3%', width: '48.8%' }}
                    >
                      {"Roof Repair Today\n(505) 433-0844\nteam@roofrepairtoday.com\nwww.roofrepairtoday.com"}
                    </p>

                    {/* Fine print */}
                    <p
                      className="absolute text-center text-white/90 leading-tight text-[3px] md:text-[4.5px]"
                      style={{ left: '0.4%', top: '92.7%', width: '99.4%' }}
                    >
                      Offer valid from 6/1/2026 through 9/1/2026, on presentation of this postcard. One coupon per person.
                    </p>
                  </div>

                  {/* Fine horizontal line */}
                  <div className="h-[0.5px] bg-gray-300 w-full" />

                  {/* Bottom half */}
                  <div className="flex h-1/2">
                    {/* Agent branding */}
                    <div className="flex w-1/2 items-start gap-2 p-3 md:p-4 border-r border-gray-200">
                      <div className="h-14 w-12 md:h-20 md:w-16 shrink-0 rounded-md border-2 border-[#B40101] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                        <img
                          src="/liz-garcia.png"
                          alt="Liz Garcia"
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center mt-0.5 md:mt-1">
                        <p className="text-[9px] md:text-[12px] font-bold text-gray-900 leading-tight">Liz Garcia Realtor®</p>
                        <p className="text-[5px] md:text-[7px] italic text-[#B40101] mt-0.5">Client Focused, Results Driven</p>
                        <p className="text-[6px] md:text-[8px] font-semibold text-gray-700 mt-0.5">Keller Williams Realty</p>
                        <p className="text-[5px] md:text-[7px] text-gray-500 mt-0.5">(505) 555-0147</p>
                        <p className="text-[4px] md:text-[6px] text-gray-500">liz.garcia@kw.com</p>
                        <p className="text-[4px] md:text-[6px] text-gray-500">www.lizgarcia.kwrealty.com</p>
                      </div>
                    </div>
                    {/* Mailing area */}
                    <div className="flex w-1/2 flex-col justify-between p-2 md:p-3 bg-white">
                      <div className="flex justify-end">
                        <div className="h-5 w-7 md:h-7 md:w-9 border border-dashed border-gray-300 rounded-sm flex items-center justify-center">
                          <p className="text-[4px] md:text-[6px] text-gray-400 text-center leading-tight">POSTAGE</p>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <p className="text-[7px] md:text-[10px] font-semibold text-gray-900 leading-tight">
                          The Martinez Family
                        </p>
                        <p className="text-[6px] md:text-[9px] text-gray-600 leading-tight">4820 Juniper Hill Rd NE</p>
                        <p className="text-[6px] md:text-[9px] text-gray-600 leading-tight">Albuquerque, NM 87111</p>
                      </div>
                      <p className="text-[3px] md:text-[4.5px] text-gray-400 leading-tight mt-1">
                        For questions about this postcard or offer please call (505) 555-0147 &bull; www.FromYourAgent.com &bull; Each office is independently owned and operated.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deal Details */}
          <div className="mt-16 rounded-2xl bg-[#F7F8FA] p-8 md:p-12">
            <h2 className="font-serif text-2xl font-bold text-[#1a1a2e] md:text-3xl">
              Featured Deal: Roof Repair Today
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              This month&apos;s postcard features an exclusive offer from Roof Repair Today — extend the life of your roof with a free roof inspection plus 10% off roof repairs or $500 off a roof replacement or coating, as a gift from their agent. Your contacts will receive a beautifully designed 6x9 postcard with this deal on the front and your personalized branding on the back.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Free roof inspection + detailed photo report",
                "10% off roof repairs, or $500 off a roof replacement or coating",
                "Professional 6x9 full-color postcard",
                "Your headshot, logo, and branding on the back",
                "Delivered via USPS First-Class Mail",
                "Offer valid June 1 – September 1, 2026",
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
            Every month features a new curated local deal or exclusive offer we negotiate for you.
          </p>
          <div className="mt-10">
            <img
              src="/add-a-heading.png"
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
