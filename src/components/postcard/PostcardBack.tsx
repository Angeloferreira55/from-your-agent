"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { PostcardVisibleFields } from "@/types/database";
import type { DesignConfig } from "@/components/admin/TemplateDesigner";
import { recolorSvgDataUri } from "@/components/admin/TemplateDesigner";

const DESIGN_BASIS = 675;

const FONT_MAP: Record<string, string> = {
  "sans-serif": "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  calibri: "Calibri, 'Gill Sans', sans-serif",
  segoe: "'Segoe UI', Tahoma, sans-serif",
  serif: "Georgia, serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  garamond: "Garamond, serif",
  bookman: "'Bookman Old Style', Bookman, serif",
  cambria: "Cambria, Georgia, serif",
  courier: "'Courier New', Courier, monospace",
  consolas: "Consolas, 'Courier New', monospace",
  monaco: "Monaco, 'Courier New', monospace",
  impact: "Impact, 'Arial Black', sans-serif",
  "century-gothic": "'Century Gothic', 'Apple Gothic', sans-serif",
  futura: "Futura, 'Century Gothic', sans-serif",
  "gill-sans": "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  optima: "Optima, 'Segoe UI', sans-serif",
  candara: "Candara, Calibri, sans-serif",
  franklin: "'Franklin Gothic Medium', 'Franklin Gothic', sans-serif",
};

const DEFAULT_VISIBLE: PostcardVisibleFields = {
  phone: true,
  email: true,
  license: true,
  website: false,
  brokerage_info: true,
};

/* ── Seasonal Footer Themes ── */
interface SeasonalTheme {
  label: string;
  gradient: string;
  text: string; // simple text content for the footer
  textColor: string;
}

const SEASONAL_FOOTERS: Record<string, SeasonalTheme> = {
  none: { label: "None", gradient: "", text: "", textColor: "" },
  january: {
    label: "New Year",
    gradient: "linear-gradient(90deg, #1e3a5f 0%, #c9a84c 50%, #1e3a5f 100%)",
    text: "Wishing You a Wonderful New Year",
    textColor: "rgba(255,255,255,0.9)",
  },
  february: {
    label: "Valentine's",
    gradient: "linear-gradient(90deg, #f9a8c9 0%, #e8314f 50%, #f9a8c9 100%)",
    text: "Happy Valentine's Day",
    textColor: "rgba(255,255,255,0.9)",
  },
  march: {
    label: "St. Patrick's",
    gradient: "linear-gradient(90deg, #2d8f4e 0%, #4fc978 50%, #2d8f4e 100%)",
    text: "Happy St. Patrick's Day",
    textColor: "rgba(255,255,255,0.9)",
  },
  april: {
    label: "Spring",
    gradient: "linear-gradient(90deg, #a8d8a8 0%, #f5e663 50%, #a8d8a8 100%)",
    text: "Happy Spring",
    textColor: "rgba(55,65,81,0.9)",
  },
  may: {
    label: "Mother's Day",
    gradient: "linear-gradient(90deg, #f4a6d7 0%, #d8b4fe 50%, #f4a6d7 100%)",
    text: "Happy Mother's Day",
    textColor: "rgba(255,255,255,0.9)",
  },
  june: {
    label: "Summer",
    gradient: "linear-gradient(90deg, #87ceeb 0%, #ffd700 50%, #87ceeb 100%)",
    text: "Have a Great Summer",
    textColor: "rgba(55,65,81,0.9)",
  },
  july: {
    label: "Independence Day",
    gradient: "linear-gradient(90deg, #bf0a30 0%, #002868 50%, #bf0a30 100%)",
    text: "Happy 4th of July",
    textColor: "rgba(255,255,255,0.9)",
  },
  august: {
    label: "Late Summer",
    gradient: "linear-gradient(90deg, #f97316 0%, #0d9488 50%, #f97316 100%)",
    text: "Enjoy the Last Days of Summer",
    textColor: "rgba(255,255,255,0.9)",
  },
  september: {
    label: "Fall",
    gradient: "linear-gradient(90deg, #d97706 0%, #92400e 50%, #d97706 100%)",
    text: "Happy Fall",
    textColor: "rgba(255,255,255,0.9)",
  },
  october: {
    label: "Halloween",
    gradient: "linear-gradient(90deg, #f97316 0%, #1c1917 50%, #f97316 100%)",
    text: "Happy Halloween",
    textColor: "rgba(255,255,255,0.9)",
  },
  november: {
    label: "Thanksgiving",
    gradient: "linear-gradient(90deg, #92400e 0%, #ca8a04 50%, #92400e 100%)",
    text: "Happy Thanksgiving",
    textColor: "rgba(255,255,255,0.9)",
  },
  december: {
    label: "Holidays",
    gradient: "linear-gradient(90deg, #dc2626 0%, #16a34a 50%, #dc2626 100%)",
    text: "Happy Holidays",
    textColor: "rgba(255,255,255,0.9)",
  },
  social: {
    label: "Social Media",
    gradient: "linear-gradient(90deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)",
    text: "Follow us on social media",
    textColor: "rgba(255,255,255,0.85)",
  },
  consultation: {
    label: "Free Consult",
    gradient: "linear-gradient(90deg, #0a0a0a 0%, #2a2a2a 50%, #0a0a0a 100%)",
    text: "Call us for a free consultation",
    textColor: "rgba(212,175,55,0.9)",
  },
  referral: {
    label: "Referrals",
    gradient: "linear-gradient(90deg, #1a3a2a 0%, #40916c 50%, #1a3a2a 100%)",
    text: "Your Referrals Are Our Greatest Reward",
    textColor: "rgba(255,255,255,0.85)",
  },
};

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function resolveSeasonalKey(footer: string | null | undefined, campaignMonth?: number): string {
  if (!footer || footer === "none") return "none";
  if (footer === "auto") {
    const m = campaignMonth ?? new Date().getMonth(); // 0-indexed
    return MONTH_KEYS[m] || "none";
  }
  return footer;
}

export { SEASONAL_FOOTERS, MONTH_KEYS, resolveSeasonalKey };

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
  // Brokerage-specific props (from admin config)
  brokerageSlogan?: string | null;
  brokerageBackgroundUrl?: string | null;
  brokerageOverlayColor?: string | null;
  brokerageTextColor?: string | null;
  brokerageSocialLinks?: Record<string, string> | null;
  brokerageDisclaimer?: string | null;
  templateDesign?: DesignConfig | null;
  agentCardDesign?: DesignConfig | null;
  seasonalFooter?: string | null;
  campaignMonth?: number;
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
  brokerageSlogan = null,
  brokerageBackgroundUrl = null,
  brokerageOverlayColor = null,
  brokerageTextColor = null,
  brokerageSocialLinks = null,
  brokerageDisclaimer = null,
  templateDesign = null,
  agentCardDesign = null,
  seasonalFooter = "auto",
  campaignMonth,
  className,
}: PostcardBackProps) {
  const v = { ...DEFAULT_VISIBLE, ...visibleFields };
  const overlayColor = brokerageOverlayColor || "rgba(0, 0, 0, 0.35)";
  const textColor = brokerageTextColor || "#FFFFFF";
  const resolvedSeason = resolveSeasonalKey(seasonalFooter, campaignMonth);
  const seasonTheme = SEASONAL_FOOTERS[resolvedSeason];

  // Build social icons from brokerage config
  const socialIcons: { key: string; label: string }[] = [];
  if (brokerageSocialLinks) {
    if (brokerageSocialLinks.facebook) socialIcons.push({ key: "facebook", label: "f" });
    if (brokerageSocialLinks.linkedin) socialIcons.push({ key: "linkedin", label: "in" });
    if (brokerageSocialLinks.instagram) socialIcons.push({ key: "instagram", label: "ig" });
    if (brokerageSocialLinks.youtube) socialIcons.push({ key: "youtube", label: "yt" });
    if (brokerageSocialLinks.twitter) socialIcons.push({ key: "twitter", label: "X" });
  }
  // Fallback to generic icons if no social links configured
  const displayIcons = socialIcons.length > 0
    ? socialIcons
    : [{ key: "f", label: "f" }, { key: "in", label: "in" }, { key: "ig", label: "ig" }, { key: "yt", label: "yt" }];

  // Dynamic font scale: measure card width, panel = half, scale = panelWidth / designBasis
  const cardRef = useRef<HTMLDivElement>(null);
  const [panelScale, setPanelScale] = useState(0.35); // fallback
  const syncScale = useCallback(() => {
    if (cardRef.current) {
      setPanelScale((cardRef.current.offsetWidth / 2) / DESIGN_BASIS);
    }
  }, []);
  useEffect(() => {
    syncScale();
    window.addEventListener("resize", syncScale);
    return () => window.removeEventListener("resize", syncScale);
  }, [syncScale]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white shadow-sm",
        className
      )}
      style={{ aspectRatio: "9.25/6.25" }}
    >
      <div className="flex flex-col h-full">
        {/* ── Top half ── */}
        <div className="flex h-1/2">
          {/* Top-left: Featured Deal (auto-populated from campaign) */}
          <div className="flex w-1/2 items-center justify-center p-3 md:p-4 bg-gray-50">
            <div className="text-center">
              <p className="text-[7px] md:text-[10px] font-medium text-gray-400">
                Featured Offer
              </p>
              <p className="text-[5px] md:text-[7px] text-gray-300 mt-0.5">
                Auto-populated from campaign
              </p>
            </div>
          </div>

          {/* Top-right: Brokerage branding panel (template design) */}
          {templateDesign ? (
            /* Template-driven panel */
            <div
              className="relative w-1/2 overflow-hidden"
              style={{
                backgroundColor: templateDesign.background.colorEnabled !== false
                  ? templateDesign.background.color
                  : "transparent",
              }}
            >
              {templateDesign.background.imageUrl && (
                <img
                  src={templateDesign.background.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                  style={{ objectFit: templateDesign.background.imageFit || "cover", opacity: templateDesign.background.colorEnabled !== false ? 0.3 : 1 }}
                />
              )}
              {templateDesign.background.colorEnabled !== false && (
                <div className="absolute inset-0" style={{ backgroundColor: templateDesign.background.overlayColor }} />
              )}
              {/* Render elements */}
              {templateDesign.elements.map((el) => {
                // If this is the team_logo placeholder, swap in agent's logo
                const imgSrc = el.placeholder === "team_logo" && teamLogoUrl
                  ? teamLogoUrl
                  : el.src;

                return (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      overflow: el.type === "text" ? "hidden" : undefined,
                      opacity: el.opacity ?? 1,
                    }}
                  >
                    {el.type === "text" && (
                      <p
                        className="break-words whitespace-pre-wrap"
                        style={{
                          fontSize: `${(el.fontSize || 16) * panelScale}px`,
                          color: el.fontColor || "#fff",
                          fontWeight: el.fontWeight || "normal",
                          fontStyle: el.fontStyle || "normal",
                          textAlign: el.textAlign || "left",
                          fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                          lineHeight: el.lineHeight || 1.3,
                          letterSpacing: el.letterSpacing ? `${el.letterSpacing * panelScale}px` : undefined,
                          textTransform: el.textTransform || "none",
                        }}
                      >
                        {el.text}
                      </p>
                    )}
                    {el.type === "image" && imgSrc && (
                      <img
                        src={el.tintColor && imgSrc.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(imgSrc, el.tintColor) : imgSrc}
                        alt=""
                        className="w-full h-full"
                        style={{ objectFit: el.objectFit || "contain" }}
                      />
                    )}
                    {el.type === "shape" && (
                      <div className="w-full h-full" style={{ transform: el.shapeRotation ? `rotate(${el.shapeRotation}deg)` : undefined }}>
                        {el.shapeType === "line" && <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: `${(el.shapeBorderWidth || 2) * panelScale}px`, backgroundColor: el.shapeColor || "#000" }} />}
                        {el.shapeType === "rectangle" && <div className="w-full h-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * panelScale}px solid ${el.shapeColor || "#000"}` }} />}
                        {el.shapeType === "circle" && <div className="w-full h-full rounded-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * panelScale}px solid ${el.shapeColor || "#000"}` }} />}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Auto-render brokerage slogan centered in the panel */}
              {brokerageSlogan && (
                <div className="absolute z-10 inset-0 flex items-center justify-center pointer-events-none px-2">
                  <p
                    className="text-center font-serif italic leading-snug"
                    style={{
                      fontSize: "8px",
                      color: brokerageTextColor || "#FFFFFF",
                    }}
                  >
                    {brokerageSlogan.replace(/\n/g, " ")}
                  </p>
                </div>
              )}
              {/* Disclaimer */}
              {templateDesign.disclaimer && (
                <div className="absolute bottom-0 left-0 right-0 px-[15%] py-1 pointer-events-none">
                  <p className="leading-tight text-center" style={{
                    fontSize: `${(templateDesign.disclaimerStyle?.fontSize || 8) * panelScale}px`,
                    color: templateDesign.disclaimerStyle?.color || "rgba(255,255,255,0.55)",
                    fontFamily: FONT_MAP[templateDesign.disclaimerStyle?.fontFamily || "sans-serif"],
                  }}>
                    {templateDesign.disclaimer}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Fallback: hardcoded panel */
            <div
              className="relative flex w-1/2 flex-col p-2 md:p-3 overflow-hidden"
              style={{ backgroundColor: brandColor }}
            >
              {brokerageBackgroundUrl && (
                <img
                  src={brokerageBackgroundUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: overlayColor }}
              />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2">
                  {brokerageLogoUrl ? (
                    <img
                      src={brokerageLogoUrl}
                      alt={companyName || "Brokerage"}
                      className="h-5 md:h-8 w-auto object-contain"
                    />
                  ) : (
                    <p className="text-[7px] md:text-[9px] font-bold" style={{ color: textColor }}>
                      {companyName || "Your Brokerage"}
                    </p>
                  )}
                </div>
                <div className="my-auto text-center">
                  <p
                    className="text-[17px] md:text-[25px] font-serif italic leading-snug"
                    style={{ color: textColor }}
                  >
                    {brokerageSlogan
                      ? brokerageSlogan.replace(/\n/g, " ")
                      : companyName || "Your Brokerage"}
                  </p>
                </div>
                <div className="mt-auto">
                  <div className="flex items-center gap-0.5 md:gap-1">
                    {displayIcons.map((icon) => (
                      <div
                        key={icon.key}
                        className="h-2 w-2 md:h-3 md:w-3 rounded-sm bg-white/20 flex items-center justify-center"
                      >
                        <span className="text-[3px] md:text-[5px] font-bold" style={{ color: textColor }}>
                          {icon.label}
                        </span>
                      </div>
                    ))}
                    {v.brokerage_info && brokeragePhone && (
                      <p className="text-[4px] md:text-[6px] ml-auto font-medium" style={{ color: `${textColor}E6` }}>
                        {brokeragePhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Fine horizontal line ── */}
        <div className="h-[0.5px] bg-gray-300 w-full" />

        {/* ── Bottom half ── */}
        <div className="flex h-1/2">
          {/* Bottom-left: Agent profile */}
          {agentCardDesign ? (
            /* Agent-designed panel */
            <div
              className="relative w-1/2 overflow-hidden border-r border-gray-200"
              style={{
                backgroundColor: agentCardDesign.background.colorEnabled !== false
                  ? agentCardDesign.background.color
                  : "transparent",
              }}
            >
              {agentCardDesign.background.imageUrl && (
                <img
                  src={agentCardDesign.background.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                  style={{ objectFit: agentCardDesign.background.imageFit || "cover", opacity: agentCardDesign.background.colorEnabled !== false ? 0.3 : 1 }}
                />
              )}
              {agentCardDesign.background.colorEnabled !== false && (
                <div className="absolute inset-0" style={{ backgroundColor: agentCardDesign.background.overlayColor }} />
              )}
              {agentCardDesign.elements.map((el) => {
                // Substitute team_logo placeholder with agent's team logo URL
                const imgSrc = el.placeholder === "team_logo" && teamLogoUrl
                  ? teamLogoUrl
                  : el.src;

                return (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                      overflow: el.type === "text" ? "hidden" : undefined,
                    opacity: el.opacity ?? 1,
                  }}
                >
                  {el.type === "text" && (
                    <p
                      className="break-words whitespace-pre-wrap"
                      style={{
                        fontSize: `${(el.fontSize || 16) * panelScale}px`,
                        color: el.fontColor || "#000",
                        fontWeight: el.fontWeight || "normal",
                        fontStyle: el.fontStyle || "normal",
                        textAlign: el.textAlign || "left",
                        fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                        lineHeight: el.lineHeight || 1.3,
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing * panelScale}px` : undefined,
                        textTransform: el.textTransform || "none",
                      }}
                    >
                      {el.text}
                    </p>
                  )}
                  {el.type === "image" && imgSrc && (
                    <img
                      src={el.tintColor && imgSrc.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(imgSrc, el.tintColor) : imgSrc}
                      alt=""
                      className="w-full h-full"
                      style={{ objectFit: el.objectFit || "contain" }}
                    />
                  )}
                  {el.type === "shape" && (
                    <div className="w-full h-full" style={{ transform: el.shapeRotation ? `rotate(${el.shapeRotation}deg)` : undefined }}>
                      {el.shapeType === "line" && <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: `${(el.shapeBorderWidth || 2) * panelScale}px`, backgroundColor: el.shapeColor || "#000" }} />}
                      {el.shapeType === "rectangle" && <div className="w-full h-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * panelScale}px solid ${el.shapeColor || "#000"}` }} />}
                      {el.shapeType === "circle" && <div className="w-full h-full rounded-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * panelScale}px solid ${el.shapeColor || "#000"}` }} />}
                    </div>
                  )}
                </div>
                );
              })}
              {/* Disclaimer */}
              {agentCardDesign.disclaimer && (
                <div className="absolute bottom-0 left-0 right-0 px-[15%] py-1 pointer-events-none">
                  <p className="leading-tight text-center" style={{
                    fontSize: `${(agentCardDesign.disclaimerStyle?.fontSize || 8) * panelScale}px`,
                    color: agentCardDesign.disclaimerStyle?.color || "rgba(255,255,255,0.55)",
                    fontFamily: FONT_MAP[agentCardDesign.disclaimerStyle?.fontFamily || "sans-serif"],
                  }}>
                    {agentCardDesign.disclaimer}
                  </p>
                </div>
              )}
              {/* Seasonal Footer */}
              {seasonTheme && resolvedSeason !== "none" && seasonTheme.gradient && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden flex items-center justify-center"
                  style={{ height: "12%", background: seasonTheme.gradient }}
                >
                  {seasonTheme.text && (
                    <p
                      className="text-center font-semibold leading-none"
                      style={{
                        fontSize: `${24 * panelScale}px`,
                        color: seasonTheme.textColor,
                        fontFamily: "Georgia, serif",
                        letterSpacing: "0.5px",
                        margin: 0,
                      }}
                    >
                      {seasonTheme.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Fallback: hardcoded agent panel */
            <div className="relative flex w-1/2 flex-col p-2 md:p-3 border-r border-gray-200">
              <div className="flex items-start gap-2">
                {/* Headshot */}
                <div
                  className="h-12 w-10 md:h-16 md:w-14 shrink-0 rounded-md border-2 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                  style={{ borderColor: brandColor }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={agentName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Contact info */}
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[8px] md:text-[11px] font-bold text-gray-900 leading-tight">
                    {agentName}
                  </p>
                  {tagline && (
                    <p
                      className="text-[4px] md:text-[6px] italic mt-0.5"
                      style={{ color: brandColor }}
                    >
                      {tagline}
                    </p>
                  )}
                  {companyName && (
                    <p className="text-[5px] md:text-[7px] font-semibold text-gray-700 mt-0.5">
                      {companyName}
                    </p>
                  )}
                  {v.phone && phone && (
                    <p className="text-[4px] md:text-[6px] text-gray-500 mt-0.5">
                      {phone}
                    </p>
                  )}
                  {v.email && email && (
                    <p className="text-[3.5px] md:text-[5.5px] text-gray-500">
                      {email}
                    </p>
                  )}
                  {v.website && website && (
                    <p className="text-[3.5px] md:text-[5.5px] text-gray-500">
                      {website}
                    </p>
                  )}
                  {v.license && licenseNumber && (
                    <p className="text-[3.5px] md:text-[5.5px] text-gray-400">
                      {licenseNumber}
                    </p>
                  )}
                </div>

                {/* Team Logo */}
                {teamLogoUrl && (
                  <img
                    src={teamLogoUrl}
                    alt="Team Logo"
                    className="h-8 md:h-12 w-auto object-contain shrink-0 ml-auto"
                  />
                )}
              </div>

              {/* Personal Message */}
              {customMessage && (
                <p className="text-[3.5px] md:text-[5.5px] text-gray-500 leading-snug mt-auto pt-1">
                  {customMessage}
                </p>
              )}

              {/* Seasonal Footer */}
              {seasonTheme && resolvedSeason !== "none" && seasonTheme.gradient && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden flex items-center justify-center"
                  style={{ height: "12%", background: seasonTheme.gradient }}
                >
                  {seasonTheme.text && (
                    <p
                      className="text-center font-semibold leading-none"
                      style={{
                        fontSize: `${24 * panelScale}px`,
                        color: seasonTheme.textColor,
                        fontFamily: "Georgia, serif",
                        letterSpacing: "0.5px",
                        margin: 0,
                      }}
                    >
                      {seasonTheme.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom-right: Mailing area */}
          <div className="flex w-1/2 flex-col justify-between p-2 md:p-3 bg-white">
            <div className="flex justify-end">
              <div className="h-5 w-7 md:h-7 md:w-9 border border-dashed border-gray-300 rounded-sm flex items-center justify-center">
                <p className="text-[4px] md:text-[6px] text-gray-400 text-center leading-tight">
                  POSTAGE
                </p>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-auto">
              <p className="text-[7px] md:text-[10px] font-semibold text-gray-900">
                {recipientName}
              </p>
              {recipientAddress.split("\n").map((line, i) => (
                <p
                  key={i}
                  className="text-[6px] md:text-[9px] text-gray-600"
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Address lines */}
            <div className="mt-1 space-y-0.5">
              <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
              <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
              <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
            </div>

            {/* Footer disclaimer — only shown if brokerage provides one */}
            {brokerageDisclaimer && (
              <p className="text-[3px] md:text-[4.5px] text-gray-400 leading-tight mt-1">
                {brokerageDisclaimer}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
