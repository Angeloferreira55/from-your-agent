"use client";

import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { PostcardVisibleFields } from "@/types/database";

const DEFAULT_VISIBLE: PostcardVisibleFields = {
  phone: true,
  email: true,
  license: true,
  website: false,
  brokerage_info: true,
};

interface PostcardBackProps {
  agentName?: string;
  companyName?: string | null;
  tagline?: string | null;
  customMessage?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  licenseNumber?: string | null;
  teamLogoUrl?: string | null;
  brokerageLogoUrl?: string | null;
  photoUrl?: string | null;
  brandColor?: string;
  brokeragePhone?: string | null;
  brokerageAddress?: string | null;
  visibleFields?: PostcardVisibleFields;
  recipientName?: string;
  recipientAddress?: string;
  className?: string;
}

export function PostcardBack({
  agentName = "Jane Smith",
  companyName = "Keller Williams Realty",
  tagline = "Your trusted neighborhood agent",
  customMessage = "Thanks for being a valued part of my network! Enjoy these exclusive local deals — and remember, I'm always here for your real estate needs.",
  phone = "(555) 123-4567",
  email = "jane@example.com",
  website = null,
  licenseNumber = "DRE #01234567",
  teamLogoUrl = null,
  brokerageLogoUrl = null,
  photoUrl = null,
  brandColor = "#C02646",
  brokeragePhone = null,
  brokerageAddress = null,
  visibleFields = DEFAULT_VISIBLE,
  recipientName = "John & Sarah Johnson",
  recipientAddress = "123 Main Street\nAnytown, CA 90210",
  className,
}: PostcardBackProps) {
  const v = { ...DEFAULT_VISIBLE, ...visibleFields };
  const hasLogos = teamLogoUrl || brokerageLogoUrl;
  const hasBrokerageInfo = v.brokerage_info && (brokeragePhone || brokerageAddress);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white shadow-sm",
        className
      )}
      style={{ aspectRatio: "9/6" }}
    >
      <div className="flex h-full">
        {/* Left half — Agent branding */}
        <div className="flex w-1/2 flex-col border-r p-4">
          {/* Photo + Logos side by side */}
          <div className="flex items-start gap-2 mb-1.5">
            <div
              className="h-20 w-20 shrink-0 rounded-lg border-2 overflow-hidden flex items-center justify-center bg-gray-100"
              style={{ borderColor: brandColor }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={agentName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            {(teamLogoUrl || brokerageLogoUrl) && (
              <div className="min-w-0 flex flex-col justify-start -mt-3">
                <div className="flex items-center gap-1.5">
                  {brokerageLogoUrl && (
                    <img
                      src={brokerageLogoUrl}
                      alt="Brokerage Logo"
                      className="h-12 max-w-[48px] object-contain shrink-0"
                    />
                  )}
                  {teamLogoUrl && (
                    <img
                      src={teamLogoUrl}
                      alt="Team Logo"
                      className="h-16 max-w-[64px] object-contain shrink-0"
                    />
                  )}
                </div>
                {v.brokerage_info && (brokeragePhone || brokerageAddress) && (
                  <div className="-mt-0.5">
                    {brokeragePhone && (
                      <p className="text-[7px] text-gray-400 leading-none">{brokeragePhone}</p>
                    )}
                    {brokerageAddress && (
                      <p className="text-[7px] text-gray-400 leading-none mt-px">{brokerageAddress}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent name + contact details */}
          <div className="mb-1">
            <p className="text-[11px] font-bold text-gray-900 leading-tight">{agentName}</p>
            {tagline && (
              <p className="text-[8px] italic mt-0.5" style={{ color: brandColor }}>
                {tagline}
              </p>
            )}
            <div className="mt-0.5 space-y-0">
              {(v.phone && phone) || (v.email && email) ? (
                <p className="text-[6.5px] text-gray-500 whitespace-nowrap">
                  {[v.phone && phone, v.email && email].filter(Boolean).join(" | ")}
                </p>
              ) : null}
              {v.website && website && (
                <p className="text-[8px] text-gray-500">{website}</p>
              )}
              {v.license && licenseNumber && (
                <p className="text-[8px] text-gray-400">{licenseNumber}</p>
              )}
            </div>
          </div>

          {/* Featured Deal */}
          <div className="flex-1 flex items-start gap-1 -ml-2.5">
            <img
              src="/sample-deal-closet-back.png"
              alt="Featured Deal"
              className="h-full max-w-[55%] object-contain rounded mix-blend-multiply shrink-0"
            />
            <div className="min-w-0 space-y-px mt-5">
              <p className="text-[9px] font-bold text-gray-900 leading-tight whitespace-nowrap">Custom Closet Guys</p>
              <p className="text-[6.5px] italic text-gray-500 leading-tight whitespace-nowrap mb-4">Where Style Meets Storage</p>
              <p className="text-[8px] font-bold text-gray-700 leading-tight">(505) 546-1788</p>
              <p className="text-[5.5px] text-gray-500 leading-tight">richard@customclosetguys.com</p>
              <p className="text-[6.5px] text-gray-500 leading-tight">customclosetguys.com</p>
            </div>
          </div>

          {/* Custom footer message */}
          {customMessage && (
            <div className="mt-auto pt-1 border-t border-gray-100">
              {customMessage.split("\n").map((line, i) => (
                <p key={i} className="text-[7px] text-gray-500 leading-tight">{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* Right half — Mailing area */}
        <div className="flex w-1/2 flex-col p-4">
          {/* Stamp area */}
          <div className="self-end mb-4">
            <div className="h-8 w-10 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-[6px] text-gray-400 text-center leading-tight">POSTAGE</p>
            </div>
          </div>

          {/* Accent bar */}
          <div
            className="h-0.5 w-10 rounded-full mb-3"
            style={{ backgroundColor: brandColor }}
          />

          {/* Recipient */}
          <div className="mt-auto">
            <p className="text-[10px] font-semibold text-gray-900">{recipientName}</p>
            {recipientAddress.split("\n").map((line, i) => (
              <p key={i} className="text-[9px] text-gray-600">{line}</p>
            ))}
          </div>

          {/* Barcode placeholder */}
          <div className="mt-3 flex gap-px">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800"
                style={{
                  width: 1.5,
                  height: Math.random() > 0.5 ? 8 : 12,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
