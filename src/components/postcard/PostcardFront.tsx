"use client";

import { cn } from "@/lib/utils";

interface PostcardFrontProps {
  campaignName?: string;
  month?: string;
  year?: number;
  imageUrl?: string | null;
  agentName?: string;
  companyName?: string | null;
  brokerageLogoUrl?: string | null;
  brandColor?: string;
  className?: string;
}

export function PostcardFront({
  campaignName = "Monthly Deals",
  month = "February",
  year = 2026,
  imageUrl = "/sample-deal-closet.png",
  agentName = "Jane Smith",
  companyName = null,
  brokerageLogoUrl = null,
  brandColor = "#C02646",
  className,
}: PostcardFrontProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white shadow-sm",
        className
      )}
      style={{ aspectRatio: "9/6" }}
    >
      {/* Full-page deal image */}
      <img
        src={imageUrl || "/sample-deal-closet.png"}
        alt="Featured deal"
        className="h-full w-full object-fill"
      />

      {/* Bottom overlay bar with agent & brokerage info */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-[4%] pb-[3%]">
        {/* Brokerage name — bottom left */}
        {companyName && (
          <span
            className="text-[clamp(0.5rem,1.6vw,0.85rem)] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
            style={{ color: "#fff" }}
          >
            {companyName}
          </span>
        )}

        {/* "as a gift from [agent name]" — bottom right */}
        {agentName && (
          <span
            className="text-[clamp(0.45rem,1.4vw,0.75rem)] italic drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
            style={{ color: "#fff" }}
          >
            as a gift from {agentName}
          </span>
        )}
      </div>
    </div>
  );
}
