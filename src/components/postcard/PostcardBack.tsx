"use client";

import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { PostcardVisibleFields } from "@/types/database";
import type { DesignConfig } from "@/components/admin/TemplateDesigner";
import { recolorSvgDataUri } from "@/components/admin/TemplateDesigner";

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
  className,
}: PostcardBackProps) {
  const v = { ...DEFAULT_VISIBLE, ...visibleFields };
  const overlayColor = brokerageOverlayColor || "rgba(0, 0, 0, 0.35)";
  const textColor = brokerageTextColor || "#FFFFFF";

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

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white shadow-sm",
        className
      )}
      style={{ aspectRatio: "9/6" }}
    >
      <div className="flex flex-col h-full">
        {/* ── Top half ── */}
        <div className="flex h-1/2">
          {/* Top-left: Featured Deal */}
          <div className="flex w-1/2 items-start gap-1.5 p-3 md:p-4">
            <img
              src="/sample-deal-closet-back.png"
              alt="Custom Closet Guys"
              className="h-10 md:h-14 w-auto object-contain rounded mix-blend-multiply shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[5px] md:text-[7px] text-gray-500 leading-tight">
                Present this postcard and enjoy a FREE Consultation + $250 off
                your custom closet, as a gift from your friends at{" "}
                {companyName || "your brokerage"}!
              </p>
              <p className="text-[5px] md:text-[6.5px] font-semibold text-gray-600 mt-0.5">
                (505) 546-1788 &bull; customclosetguys.com
              </p>
            </div>
          </div>

          {/* Top-right: Brokerage branding panel */}
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
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: templateDesign.background.colorEnabled !== false ? 0.3 : 1 }}
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
                      height: el.type === "image" ? `${el.height}%` : "auto",
                      opacity: el.opacity ?? 1,
                    }}
                  >
                    {el.type === "text" && (
                      <p
                        className="break-words whitespace-pre-wrap"
                        style={{
                          fontSize: `${(el.fontSize || 16) * 0.35}px`,
                          color: el.fontColor || "#fff",
                          fontWeight: el.fontWeight || "normal",
                          fontStyle: el.fontStyle || "normal",
                          textAlign: el.textAlign || "left",
                          fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                          lineHeight: el.lineHeight || 1.3,
                          letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.35}px` : undefined,
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
                  </div>
                );
              })}
              {/* Disclaimer */}
              {templateDesign.disclaimer && (
                <div className="absolute bottom-0 left-0 right-0 px-[15%] py-1 pointer-events-none">
                  <p className="leading-tight text-center" style={{
                    fontSize: `${(templateDesign.disclaimerStyle?.fontSize || 8) * 0.35}px`,
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
                  {teamLogoUrl && (
                    <img
                      src={teamLogoUrl}
                      alt="Team Logo"
                      className="h-5 md:h-8 w-auto object-contain"
                    />
                  )}
                </div>
                <div className="my-auto text-center">
                  <p
                    className="text-[8px] md:text-[12px] font-serif italic leading-snug"
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
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: agentCardDesign.background.colorEnabled !== false ? 0.3 : 1 }}
                />
              )}
              {agentCardDesign.background.colorEnabled !== false && (
                <div className="absolute inset-0" style={{ backgroundColor: agentCardDesign.background.overlayColor }} />
              )}
              {agentCardDesign.elements.map((el) => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: el.type === "image" ? `${el.height}%` : "auto",
                    opacity: el.opacity ?? 1,
                  }}
                >
                  {el.type === "text" && (
                    <p
                      className="break-words whitespace-pre-wrap"
                      style={{
                        fontSize: `${(el.fontSize || 16) * 0.35}px`,
                        color: el.fontColor || "#000",
                        fontWeight: el.fontWeight || "normal",
                        fontStyle: el.fontStyle || "normal",
                        textAlign: el.textAlign || "left",
                        fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                        lineHeight: el.lineHeight || 1.3,
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.35}px` : undefined,
                        textTransform: el.textTransform || "none",
                      }}
                    >
                      {el.text}
                    </p>
                  )}
                  {el.type === "image" && el.src && (
                    <img
                      src={el.tintColor && el.src.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(el.src, el.tintColor) : el.src}
                      alt=""
                      className="w-full h-full"
                      style={{ objectFit: el.objectFit || "contain" }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Fallback: hardcoded agent panel */
            <div className="flex w-1/2 items-start gap-2 p-3 md:p-4 border-r border-gray-200">
              {/* Headshot */}
              <div
                className="h-14 w-12 md:h-20 md:w-16 shrink-0 rounded-md border-2 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                style={{ borderColor: brandColor }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={agentName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-400" />
                )}
              </div>

              {/* Contact info */}
              <div className="min-w-0 flex flex-col justify-center mt-0.5 md:mt-1">
                <p className="text-[9px] md:text-[12px] font-bold text-gray-900 leading-tight">
                  {agentName}
                </p>
                {tagline && (
                  <p
                    className="text-[5px] md:text-[7px] italic mt-0.5"
                    style={{ color: brandColor }}
                  >
                    {tagline}
                  </p>
                )}
                {companyName && (
                  <p className="text-[6px] md:text-[8px] font-semibold text-gray-700 mt-0.5">
                    {companyName}
                  </p>
                )}
                {v.phone && phone && (
                  <p className="text-[5px] md:text-[7px] text-gray-500 mt-0.5">
                    {phone}
                  </p>
                )}
                {v.email && email && (
                  <p className="text-[4px] md:text-[6px] text-gray-500">
                    {email}
                  </p>
                )}
                {v.website && website && (
                  <p className="text-[4px] md:text-[6px] text-gray-500">
                    {website}
                  </p>
                )}
                {v.license && licenseNumber && (
                  <p className="text-[4px] md:text-[6px] text-gray-400">
                    {licenseNumber}
                  </p>
                )}
              </div>
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

            {/* Footer disclaimer */}
            <p className="text-[3px] md:text-[4.5px] text-gray-400 leading-tight mt-1">
              {brokerageDisclaimer
                ? brokerageDisclaimer
                : `For questions about this postcard or offer please call ${phone || "(555) 123-4567"} \u2022 www.FromYourAgent.com \u2022 Each office is independently owned and operated.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
