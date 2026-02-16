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
                  {/* Left half — Agent branding (Scavoy style) */}
                  <div className="flex w-1/2 flex-col border-r p-3 md:p-4">
                    {/* Agent photo + name centered */}
                    <div className="flex items-start gap-2 mb-1">
                      <div className="h-16 w-14 md:h-24 md:w-20 shrink-0 rounded-md border-2 border-[#B40101] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                        <img
                          src="/sample-agent-woman.jpg"
                          alt="Liz Garcia"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center mt-1 md:mt-2">
                        <p className="text-[10px] md:text-[13px] font-bold text-gray-900 leading-tight">Liz Garcia Realtor&reg;</p>
                        <p className="text-[6px] md:text-[8px] italic text-[#B40101] mt-0.5">Client Focused, Results Driven</p>
                        <p className="text-[7px] md:text-[9px] font-semibold text-gray-700 mt-0.5">Keller Williams Realty</p>
                        <p className="text-[6px] md:text-[8px] text-gray-500 mt-0.5">(505) 555-0147</p>
                        <p className="text-[5px] md:text-[7px] text-gray-500">liz.garcia@kw.com</p>
                        <p className="text-[5px] md:text-[7px] text-gray-500">www.lizgarcia.kwrealty.com</p>
                      </div>
                    </div>

                    {/* Featured Deal section (like the CMA offer area) */}
                    <div className="mt-auto border-t border-gray-200 pt-1.5">
                      <div className="flex items-start gap-1.5">
                        <img
                          src="/sample-deal-closet-back.png"
                          alt="Custom Closet Guys"
                          className="h-10 md:h-16 w-auto object-contain rounded mix-blend-multiply shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[5px] md:text-[7px] text-gray-500 leading-tight">
                            Present this postcard and enjoy a FREE Consultation + $250 off your custom closet, as a gift from your friends at Keller Williams Realty!
                          </p>
                          <p className="text-[5px] md:text-[6.5px] font-semibold text-gray-600 mt-0.5">(505) 546-1788 &bull; customclosetguys.com</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right half — Brokerage branding (Scavoy style) */}
                  <div
                    className="relative flex w-1/2 flex-col p-3 md:p-4 overflow-hidden"
                    style={{ backgroundColor: '#B40101' }}
                  >
                    {/* Background image + overlay */}
                    <img
                      src="/brokerages/kw-bg.jpg"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(100, 0, 0, 0.55)' }} />

                    {/* Content on top of background */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Brokerage logo */}
                      <div className="flex items-center gap-1.5 mb-auto">
                        <img
                          src="/brokerages/kw-logo-white.png"
                          alt="Keller Williams Realty"
                          className="h-6 md:h-10 w-auto object-contain"
                        />
                      </div>

                      {/* Slogan */}
                      <div className="my-auto text-center">
                        <p className="text-[10px] md:text-[15px] font-serif italic text-white leading-snug">
                          Not Just Agents.
                        </p>
                        <p className="text-[10px] md:text-[15px] font-serif italic text-white leading-snug">
                          Advisors.
                        </p>
                      </div>

                      {/* Social icons + website */}
                      <div className="mt-auto">
                        <div className="flex items-center gap-1 md:gap-1.5 mb-1">
                          {['f', 'in', 'ig', 'yt'].map((icon) => (
                            <div
                              key={icon}
                              className="h-3 w-3 md:h-4 md:w-4 rounded-sm bg-white/20 flex items-center justify-center"
                            >
                              <span className="text-[4px] md:text-[6px] font-bold text-white">{icon}</span>
                            </div>
                          ))}
                          <p className="text-[5px] md:text-[7px] text-white/90 ml-auto font-medium">www.kw.com</p>
                        </div>
                        {/* Disclaimer */}
                        <p className="text-[3px] md:text-[4.5px] text-white/60 leading-tight">
                          For questions about this postcard or offer please call (505) 555-0147 &bull; www.FromYourAgent.com &bull; Each office is independently owned and operated. If your home is currently on the market, please don&apos;t consider this a solicitation.
                        </p>
                      </div>
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
