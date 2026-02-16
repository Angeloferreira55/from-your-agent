"use client";

import { cn } from "@/lib/utils";

interface PostcardFrontProps {
  campaignName?: string;
  month?: string;
  year?: number;
  imageUrl?: string | null;
  agentName?: string;
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
    </div>
  );
}
