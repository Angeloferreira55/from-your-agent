import QRCode from "qrcode";
import { Mail, Gift, Store, Sparkles } from "lucide-react";
import { PrintButton } from "./PrintButton";

export const metadata = {
  title: "Become a Partner — From Your Agent",
  robots: { index: false },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.from-your-agent.com";
const PARTNER_URL = `${SITE_URL}/partner`;

export default async function PartnerFlyerPage() {
  const qrDataUrl = await QRCode.toDataURL(PARTNER_URL, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: { dark: "#0B1F3B", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      <PrintButton />

      {/* One 8.5x11 page */}
      <div className="mx-auto flex w-[8.5in] min-h-[11in] flex-col bg-white p-[0.75in] shadow-xl print:shadow-none">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#E8733A]">
            From Your Agent
          </p>
          <h1 className="mt-4 font-serif text-[42px] font-bold leading-tight text-[#0B1F3B]">
            Get your business in front of local homeowners
          </h1>
          <p className="mt-3 text-2xl font-medium text-[#E8733A]">for free.*</p>
        </div>

        {/* Intro */}
        <p className="mt-8 text-center text-lg leading-relaxed text-gray-700">
          Every month we mail beautifully designed postcards to homes across the area. Your offer
          gets featured in front of real local families — and it costs you nothing to be included.
        </p>

        {/* Benefits */}
        <div className="mt-10 grid grid-cols-3 gap-6">
          {[
            { icon: Mail, title: "Mailed to local homes", body: "Full-color postcards delivered to homeowners every month." },
            { icon: Gift, title: "No cost to be featured", body: "You only honor the discount you choose to give." },
            { icon: Store, title: "New customers at your door", body: "Turn neighborhood mail into real foot traffic." },
          ].map((b) => (
            <div key={b.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1F3B]">
                <b.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="mt-3 font-semibold text-[#0B1F3B]">{b.title}</h3>
              <p className="mt-1 text-sm leading-snug text-gray-600">{b.body}</p>
            </div>
          ))}
        </div>

        {/* QR + CTA */}
        <div className="mt-auto pt-10">
          <div className="flex items-center gap-8 rounded-2xl bg-[#F7F8FA] p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Scan to register" className="h-40 w-40 shrink-0 rounded-lg bg-white p-2" />
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#E8733A]">
                <Sparkles className="h-4 w-4" /> Ready in 2 minutes
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-[#0B1F3B]">
                Scan to register your offer
              </h2>
              <p className="mt-2 text-lg text-gray-700">
                Or visit{" "}
                <span className="font-semibold text-[#0B1F3B]">from-your-agent.com/partner</span>
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            No cost, no obligation. We&apos;ll confirm your offer before it appears on any postcard.
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            *Free to be featured — you only cover the discount you choose to offer.
          </p>
        </div>
      </div>
    </div>
  );
}
