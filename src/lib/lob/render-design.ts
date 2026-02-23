import type { DesignConfig, DesignElement } from "@/components/admin/TemplateDesigner";

/**
 * Lob's HTML renderer is WebKit-based and expects body dimensions in inches
 * (e.g. 9.25in × 6.25in for a 6x9 postcard with 0.125" bleed).
 * All pixel values from our 300-DPI design must be converted to inches.
 */

/** Convert 300-DPI pixels to CSS inches for Lob's WebKit renderer */
const toIn = (px300: number): string => (px300 / 300).toFixed(4) + "in";

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

/** CSS reset injected into all Lob HTML to normalise WebKit rendering */
const LOB_CSS_RESET = `<style>
*{margin:0;padding:0;box-sizing:border-box}
img{display:block}
body{-webkit-text-size-adjust:100%}
</style>`;

/** Data passed to front-side placeholder elements at render time */
export interface AgentPlaceholderData {
  agent_name?: string;
  brokerage_name?: string;
  brokerage_logo_url?: string;
  agent_phone?: string;
}

const FRONT_PLACEHOLDER_TYPES = ["agent_name", "brokerage_name", "brokerage_logo", "agent_phone"] as const;

/**
 * Checks if a front_html JSON string contains any front-side placeholder elements.
 * Returns false for non-JSON (raw HTML) templates.
 */
export function designHasFrontPlaceholders(frontHtml: string): boolean {
  if (!frontHtml || !frontHtml.trim().startsWith("{")) return false;
  try {
    const design = JSON.parse(frontHtml) as { elements?: Array<{ placeholder?: string }> };
    return (design.elements || []).some(
      (el) => el.placeholder && (FRONT_PLACEHOLDER_TYPES as readonly string[]).includes(el.placeholder)
    );
  } catch {
    return false;
  }
}

/**
 * Substitutes placeholder element content with real agent data.
 * - team_logo: replaces image src with teamLogoUrl
 * - agent_name: replaces text with agent's full name
 * - brokerage_name: replaces text with brokerage/company name
 * - brokerage_logo: replaces image src with brokerage logo URL
 * - agent_phone: replaces text with agent phone number
 */
function resolvePlaceholder(
  el: DesignElement,
  agentData?: AgentPlaceholderData | null,
  teamLogoUrl?: string | null,
): DesignElement {
  if (!el.placeholder) return el;

  switch (el.placeholder) {
    case "team_logo":
      return teamLogoUrl ? { ...el, src: teamLogoUrl } : el;
    case "agent_name":
      return agentData?.agent_name ? { ...el, text: agentData.agent_name } : el;
    case "brokerage_name":
      return agentData?.brokerage_name ? { ...el, text: agentData.brokerage_name } : el;
    case "brokerage_logo":
      return agentData?.brokerage_logo_url ? { ...el, src: agentData.brokerage_logo_url } : el;
    case "agent_phone":
      return agentData?.agent_phone ? { ...el, text: agentData.agent_phone } : el;
    default:
      return el;
  }
}

function recolorSvg(dataUri: string, color: string): string {
  if (!dataUri.startsWith("data:image/svg+xml,")) return dataUri;
  try {
    const svgStr = decodeURIComponent(dataUri.replace("data:image/svg+xml,", ""));
    const recolored = svgStr
      .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
      .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`);
    return "data:image/svg+xml," + encodeURIComponent(recolored);
  } catch {
    return dataUri;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders a single DesignConfig element.
 * pxWidth/pxHeight are in 300-DPI pixels (used only for font-size scaling).
 * Positions use %-based layout relative to the containing panel.
 */
function renderElement(el: DesignElement, pxWidth: number, pxHeight: number, designBasis = 675): string {
  const left = `${el.x}%`;
  const top = `${el.y}%`;
  const width = `${el.width}%`;
  const fontScale = pxWidth / designBasis;

  if (el.type === "text") {
    const fontSizePx = (el.fontSize || 16) * fontScale;
    const fontFamily = FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif";
    const textHeight = el.height || 0;
    const containerStyle = [
      `position:absolute`,
      `left:${left}`,
      `top:${top}`,
      `width:${width}`,
      textHeight ? `height:${textHeight}%` : "",
      textHeight ? `overflow:hidden` : "",
      `opacity:${el.opacity ?? 1}`,
    ].filter(Boolean).join(";");
    const pStyle = [
      `font-size:${toIn(fontSizePx)}`,
      `color:${el.fontColor || "#fff"}`,
      `font-weight:${el.fontWeight || "normal"}`,
      `font-style:${el.fontStyle || "normal"}`,
      `text-align:${el.textAlign || "left"}`,
      `font-family:${fontFamily}`,
      `line-height:${el.lineHeight || 1.3}`,
      el.letterSpacing ? `letter-spacing:${toIn(el.letterSpacing * fontScale)}` : "",
      `text-transform:${el.textTransform || "none"}`,
      `overflow-wrap:break-word`,
      `white-space:pre-wrap`,
      `margin:0`,
      `padding:0`,
    ].filter(Boolean).join(";");

    return `<div style="${containerStyle}"><p style="${pStyle}">${escapeHtml(el.text || "")}</p></div>`;
  }

  if (el.type === "image" && el.src) {
    const height = `${el.height}%`;

    const style = [
      `position:absolute`,
      `left:${left}`,
      `top:${top}`,
      `width:${width}`,
      `height:${height}`,
      `opacity:${el.opacity ?? 1}`,
    ].join(";");

    if (el.tintColor) {
      const fit = el.objectFit || "contain";
      const tintStyle = `${style};background-color:${el.tintColor};-webkit-mask-image:url(${el.src});mask-image:url(${el.src});-webkit-mask-size:${fit};mask-size:${fit};-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center`;
      return `<div style="${tintStyle}"></div>`;
    }

    const imgStyle = `width:100%;height:100%;object-fit:${el.objectFit || "contain"}`;
    return `<div style="${style}"><img src="${el.src}" style="${imgStyle}" /></div>`;
  }

  if (el.type === "shape") {
    const height = `${el.height}%`;
    const borderWidthPx = (el.shapeBorderWidth || 2) * fontScale;
    const shapeColor = el.shapeColor || "#000";
    const rotation = el.shapeRotation ? `transform:rotate(${el.shapeRotation}deg);` : "";
    const style = [
      `position:absolute`,
      `left:${left}`,
      `top:${top}`,
      `width:${width}`,
      `height:${height}`,
      `opacity:${el.opacity ?? 1}`,
    ].join(";");

    let inner = "";
    if (el.shapeType === "line") {
      inner = `<div style="width:100%;position:absolute;top:50%;transform:translateY(-50%);height:${toIn(borderWidthPx)};background-color:${shapeColor};${rotation}"></div>`;
    } else if (el.shapeType === "rectangle") {
      const fill = el.shapeFilled
        ? `background-color:${shapeColor}`
        : `border:${toIn(borderWidthPx)} solid ${shapeColor}`;
      inner = `<div style="width:100%;height:100%;${fill};${rotation}"></div>`;
    } else if (el.shapeType === "circle") {
      const fill = el.shapeFilled
        ? `background-color:${shapeColor}`
        : `border:${toIn(borderWidthPx)} solid ${shapeColor}`;
      inner = `<div style="width:100%;height:100%;border-radius:50%;${fill};${rotation}"></div>`;
    }

    return `<div style="${style}">${inner}</div>`;
  }

  return "";
}

/**
 * Renders a DesignConfig's inner content (background + elements + disclaimer).
 * Returns HTML fragments to be placed inside a positioned container (body or div).
 * All dimensions use %-based positioning; font sizes use inches.
 */
function renderDesignContent(
  design: DesignConfig,
  pxWidth: number,
  pxHeight: number,
  options?: { teamLogoUrl?: string | null; designBasis?: number; agentData?: AgentPlaceholderData | null }
): string {
  const designBasis = options?.designBasis || 675;
  const bg = design.background;

  let bgColorHtml = "";
  if (bg.colorEnabled !== false && bg.color) {
    bgColorHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:${bg.color}"></div>`;
  }

  let bgImageHtml = "";
  if (bg.imageUrl) {
    const opacity = bg.colorEnabled !== false ? 0.3 : 1;
    const fit = bg.imageFit || "cover";
    bgImageHtml = `<img src="${bg.imageUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:${fit};opacity:${opacity}" />`;
  }

  let overlayHtml = "";
  if (bg.colorEnabled !== false && bg.overlayColor) {
    overlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:${bg.overlayColor}"></div>`;
  }

  const elementsHtml = design.elements
    .map((el) => {
      const processedEl = resolvePlaceholder(el, options?.agentData, options?.teamLogoUrl);
      return renderElement(processedEl, pxWidth, pxHeight, designBasis);
    })
    .join("\n  ");

  return [bgColorHtml, bgImageHtml, overlayHtml, elementsHtml].filter(Boolean).join("\n  ");
}

/**
 * Converts a DesignConfig JSON into self-contained print-ready HTML for Lob.
 * Uses body with inch dimensions matching Lob's expected format.
 */
export function renderDesignToHtml(
  design: DesignConfig,
  dimensions: { width: number; height: number },
  designBasis = 675,
  agentData?: AgentPlaceholderData | null
): string {
  const { width, height } = dimensions;
  const contentHtml = renderDesignContent(design, width, height, { designBasis, agentData });

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" />${LOB_CSS_RESET}</head>
<body style="width:${toIn(width)};height:${toIn(height)};margin:0;padding:0;position:relative;overflow:hidden">
  ${contentHtml}
</body>
</html>`;
}

/**
 * Checks if an HTML string is actually a JSON DesignConfig, and if so renders it.
 * Otherwise returns the HTML as-is (backwards compatible).
 */
export function resolveHtml(
  html: string,
  dimensions: { width: number; height: number },
  designBasis = 675,
  agentData?: AgentPlaceholderData | null
): string {
  if (!html || !html.trim()) return html;
  if (html.trim().startsWith("{")) {
    try {
      const design: DesignConfig = JSON.parse(html);
      return renderDesignToHtml(design, dimensions, designBasis, agentData);
    } catch {
      // Not valid JSON, treat as raw HTML
    }
  }
  return html;
}

/**
 * Injects the agent name + brokerage overlay onto the front HTML.
 * Bottom left: brokerage logo (image) or company name (text fallback).
 * Bottom right: "as a gift from [agent name]".
 */
export function injectFrontOverlay(
  html: string,
  agentName: string,
  companyName?: string | null,
  cardWidth = 2775,
  logoUrl?: string | null
): string {
  if (!agentName && !companyName && !logoUrl) return html;

  const agentFontPx = cardWidth * 0.034;
  const bottomPx = cardWidth * 0.018;
  const sidePx = cardWidth * 0.04;
  const agentRightPx = cardWidth * 0.12; // shifted left to sit closer to the design's "as a gift from" text
  const logoHeightPx = cardWidth * 0.09; // ~0.83in logo height

  // Bottom left: logo image if available, otherwise company name text
  let leftElement = "";
  if (logoUrl) {
    leftElement = `<img src="${logoUrl}" style="position:absolute;bottom:${toIn(bottomPx)};left:${toIn(sidePx)};height:${toIn(logoHeightPx)};width:auto;object-fit:contain;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))" />`;
  } else if (companyName) {
    const companyFontPx = cardWidth * 0.022;
    leftElement = `<p style="position:absolute;bottom:${toIn(bottomPx)};left:${toIn(sidePx)};color:#fff;font-family:Arial,sans-serif;font-size:${toIn(companyFontPx)};font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.7);margin:0">${escapeHtml(companyName)}</p>`;
  }

  // Bottom right: agent name only (the "as a gift from" text is part of the design image)
  const agentSpan = agentName
    ? `<p style="position:absolute;bottom:${toIn(bottomPx)};right:${toIn(agentRightPx)};font-family:Arial,sans-serif;font-size:${toIn(agentFontPx)};color:#000;font-style:normal;text-shadow:0 1px 4px rgba(0,0,0,0.7);margin:0">${escapeHtml(agentName)}</p>`
    : "";
  const overlay = `\n  ${leftElement}\n  ${agentSpan}`;

  // Insert before closing </body>
  if (html.includes("</body>")) {
    return html.replace(/(<\/body>)/, overlay + "\n$1");
  }
  return html + overlay;
}

// Standard Lob postcard dimensions at 300 DPI with 0.125" bleed
export const LOB_DIMENSIONS = {
  "6x9": {
    front: { width: 2775, height: 1875 },
    back: { width: 2775, height: 1875 },
  },
  "4x6": {
    front: { width: 1875, height: 1275 },
    back: { width: 1875, height: 1275 },
  },
  "6x11": {
    front: { width: 3375, height: 1875 },
    back: { width: 3375, height: 1875 },
  },
} as const;

/* ═══════════════════════════════════════════════════════════════════
   Full Back Composition — combines all 4 quadrants for Lob print
   ═══════════════════════════════════════════════════════════════════ */

/* ── Seasonal Footer Themes (mirrored from PostcardBack for server-side use) ── */
const SEASONAL_THEMES: Record<string, { gradient: string; text: string; textColor: string }> = {
  january: { gradient: "linear-gradient(90deg, #1e3a5f 0%, #c9a84c 50%, #1e3a5f 100%)", text: "Wishing You a Wonderful New Year", textColor: "rgba(255,255,255,0.9)" },
  february: { gradient: "linear-gradient(90deg, #f9a8c9 0%, #e8314f 50%, #f9a8c9 100%)", text: "Happy Valentine's Day", textColor: "rgba(255,255,255,0.9)" },
  march: { gradient: "linear-gradient(90deg, #2d8f4e 0%, #4fc978 50%, #2d8f4e 100%)", text: "Happy St. Patrick's Day", textColor: "rgba(255,255,255,0.9)" },
  april: { gradient: "linear-gradient(90deg, #a8d8a8 0%, #f5e663 50%, #a8d8a8 100%)", text: "Happy Spring", textColor: "rgba(55,65,81,0.9)" },
  may: { gradient: "linear-gradient(90deg, #f4a6d7 0%, #d8b4fe 50%, #f4a6d7 100%)", text: "Happy Mother's Day", textColor: "rgba(255,255,255,0.9)" },
  june: { gradient: "linear-gradient(90deg, #87ceeb 0%, #ffd700 50%, #87ceeb 100%)", text: "Have a Great Summer", textColor: "rgba(55,65,81,0.9)" },
  july: { gradient: "linear-gradient(90deg, #bf0a30 0%, #002868 50%, #bf0a30 100%)", text: "Happy 4th of July", textColor: "rgba(255,255,255,0.9)" },
  august: { gradient: "linear-gradient(90deg, #f97316 0%, #0d9488 50%, #f97316 100%)", text: "Enjoy the Last Days of Summer", textColor: "rgba(255,255,255,0.9)" },
  september: { gradient: "linear-gradient(90deg, #d97706 0%, #92400e 50%, #d97706 100%)", text: "Happy Fall", textColor: "rgba(255,255,255,0.9)" },
  october: { gradient: "linear-gradient(90deg, #f97316 0%, #1c1917 50%, #f97316 100%)", text: "Happy Halloween", textColor: "rgba(255,255,255,0.9)" },
  november: { gradient: "linear-gradient(90deg, #92400e 0%, #ca8a04 50%, #92400e 100%)", text: "Happy Thanksgiving", textColor: "rgba(255,255,255,0.9)" },
  december: { gradient: "linear-gradient(90deg, #dc2626 0%, #16a34a 50%, #dc2626 100%)", text: "Happy Holidays", textColor: "rgba(255,255,255,0.9)" },
  social: { gradient: "linear-gradient(90deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)", text: "Follow us on social media", textColor: "rgba(255,255,255,0.85)" },
  consultation: { gradient: "linear-gradient(90deg, #0a0a0a 0%, #2a2a2a 50%, #0a0a0a 100%)", text: "Call us for a free consultation", textColor: "rgba(212,175,55,0.9)" },
  referral: { gradient: "linear-gradient(90deg, #1a3a2a 0%, #40916c 50%, #1a3a2a 100%)", text: "Your Referrals Are Our Greatest Reward", textColor: "rgba(255,255,255,0.85)" },
};

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function resolveSeasonalKey(footer: string | null | undefined, campaignMonth?: number): string {
  if (!footer || footer === "none") return "none";
  if (footer === "auto") {
    const m = campaignMonth ?? new Date().getMonth();
    return MONTH_KEYS[m] || "none";
  }
  return footer;
}

/* ── Full Back Composition ── */
export interface FullBackParams {
  templateBackHtml: string;
  templateType: "monthly" | "brokerage";
  brokerageBackHtml?: string | null;
  agentCardDesign?: Record<string, unknown> | null;
  agent: {
    first_name: string;
    last_name: string;
    company_name?: string | null;
    phone?: string | null;
    email: string;
    tagline?: string | null;
    custom_message?: string | null;
    photo_url?: string | null;
    logo_url?: string | null;
    brand_color?: string;
    license_number?: string | null;
    team_logo_url?: string | null;
    seasonal_footer?: string | null;
  };
  offer?: {
    title?: string;
    discount_text?: string;
    merchant_name?: string;
    merchant_address?: string;
    fine_print?: string | null;
    redemption_code?: string | null;
  } | null;
  campaignMonth?: number;
  size: string;
}

/**
 * Composes the full postcard back from 4 quadrants (matches PostcardBack React layout):
 *   Top-left:     Monthly deal template (template.back_html — merchant branding)
 *   Top-right:    Brokerage display (brokerageBackHtml — brokerage logo, banner, slogan)
 *   Bottom-left:  Agent panel (from agent_card_design or fallback)
 *   Bottom-right: Mailing area (white — Lob overlays recipient address)
 *
 * All positions/sizes use inches for Lob's WebKit renderer.
 */
/**
 * Renders a DesignConfig into a positioned container div with overflow:hidden.
 * Uses percentage-based positioning inside the container — matches PostcardBack
 * React preview exactly. Font sizes remain in inches (scaled by panelW/designBasis).
 */
function renderFlatPanel(
  design: DesignConfig,
  originX: number,
  originY: number,
  panelW: number,
  panelH: number,
  extraContent?: string,
  defaultTextColor = "#fff",
  teamLogoUrl?: string | null,
): string {
  const designBasis = 675;
  const bg = design.background;
  const parts: string[] = [];

  // Background fills (100% of container)
  if (bg.colorEnabled !== false && bg.color) {
    parts.push(`<div style="position:absolute;left:0;top:0;width:100%;height:100%;background-color:${bg.color}"></div>`);
  }
  if (bg.imageUrl) {
    const opacity = bg.colorEnabled !== false ? 0.3 : 1;
    const fit = bg.imageFit || "cover";
    parts.push(`<img src="${bg.imageUrl}" style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:${fit};opacity:${opacity}" />`);
  }
  if (bg.colorEnabled !== false && bg.overlayColor && bg.overlayColor !== "rgba(0,0,0,0)") {
    parts.push(`<div style="position:absolute;left:0;top:0;width:100%;height:100%;background-color:${bg.overlayColor}"></div>`);
  }

  // Elements — percentage-based positioning within the container (matches PostcardBack)
  const fontScale = panelW / designBasis;
  for (const el of design.elements) {
    const processedEl = resolvePlaceholder(el, null, teamLogoUrl);

    if (processedEl.type === "text") {
      const fontSizePx = (processedEl.fontSize || 16) * fontScale;
      const fontFamily = FONT_MAP[processedEl.fontFamily || "sans-serif"] || "Arial, sans-serif";
      const textHeight = processedEl.height || 0;
      // Wrap text in a positioned container with overflow:hidden so text
      // cannot expand beyond its intended area (prevents overlap in Lob's
      // WebKit when fonts wrap differently than in Chrome).
      const containerStyle = [
        `position:absolute`,
        `left:${processedEl.x}%`,
        `top:${processedEl.y}%`,
        `width:${processedEl.width}%`,
        textHeight ? `height:${textHeight}%` : "",
        textHeight ? `overflow:hidden` : "",
        `opacity:${processedEl.opacity ?? 1}`,
      ].filter(Boolean).join(";");
      const pStyle = [
        `font-size:${toIn(fontSizePx)}`,
        `color:${processedEl.fontColor || defaultTextColor}`,
        `font-weight:${processedEl.fontWeight || "normal"}`,
        `font-style:${processedEl.fontStyle || "normal"}`,
        `text-align:${processedEl.textAlign || "left"}`,
        `font-family:${fontFamily}`,
        `line-height:${processedEl.lineHeight || 1.3}`,
        processedEl.letterSpacing ? `letter-spacing:${toIn(processedEl.letterSpacing * fontScale)}` : "",
        `text-transform:${processedEl.textTransform || "none"}`,
        `overflow-wrap:break-word`,
        `white-space:pre-wrap`,
        `margin:0;padding:0`,
      ].filter(Boolean).join(";");
      parts.push(`<div style="${containerStyle}"><p style="${pStyle}">${escapeHtml(processedEl.text || "")}</p></div>`);
    } else if (processedEl.type === "image" && processedEl.src) {
      const wrapStyle = `position:absolute;left:${processedEl.x}%;top:${processedEl.y}%;width:${processedEl.width}%;height:${processedEl.height || 10}%;opacity:${processedEl.opacity ?? 1}`;
      if (processedEl.tintColor) {
        const fit = processedEl.objectFit || "contain";
        const tintStyle = `${wrapStyle};background-color:${processedEl.tintColor};-webkit-mask-image:url(${processedEl.src});mask-image:url(${processedEl.src});-webkit-mask-size:${fit};mask-size:${fit};-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center`;
        parts.push(`<div style="${tintStyle}"></div>`);
      } else {
        parts.push(`<div style="${wrapStyle}"><img src="${processedEl.src}" style="width:100%;height:100%;object-fit:${processedEl.objectFit || "contain"}" /></div>`);
      }
    } else if (processedEl.type === "shape") {
      const borderWidthPx = (processedEl.shapeBorderWidth || 2) * fontScale;
      const shapeColor = processedEl.shapeColor || "#000";
      const rotation = processedEl.shapeRotation ? `transform:rotate(${processedEl.shapeRotation}deg);` : "";
      let inner = "";
      if (processedEl.shapeType === "line") {
        inner = `<div style="width:100%;position:absolute;top:50%;transform:translateY(-50%);height:${toIn(borderWidthPx)};background-color:${shapeColor};${rotation}"></div>`;
      } else if (processedEl.shapeType === "rectangle") {
        const fill = processedEl.shapeFilled ? `background-color:${shapeColor}` : `border:${toIn(borderWidthPx)} solid ${shapeColor}`;
        inner = `<div style="width:100%;height:100%;${fill};${rotation}"></div>`;
      } else if (processedEl.shapeType === "circle") {
        const fill = processedEl.shapeFilled ? `background-color:${shapeColor}` : `border:${toIn(borderWidthPx)} solid ${shapeColor}`;
        inner = `<div style="width:100%;height:100%;border-radius:50%;${fill};${rotation}"></div>`;
      }
      parts.push(`<div style="position:absolute;left:${processedEl.x}%;top:${processedEl.y}%;width:${processedEl.width}%;height:${processedEl.height || 10}%;opacity:${processedEl.opacity ?? 1}">${inner}</div>`);
    }
  }

  if (extraContent) parts.push(extraContent);

  // Wrap in a positioned container with overflow:hidden (matches PostcardBack div)
  return `<div style="position:absolute;left:${toIn(originX)};top:${toIn(originY)};width:${toIn(panelW)};height:${toIn(panelH)};overflow:hidden">\n  ${parts.join("\n  ")}\n</div>`;
}

export function renderFullBackHtml(params: FullBackParams): string {
  const sizeKey = (params.size || "6x9") as keyof typeof LOB_DIMENSIONS;
  const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];
  const { width, height } = dims.back;
  // Use exact halves for equal quadrants (toIn handles decimal precision)
  const halfW = width / 2;
  const halfH = height / 2;
  const brandColor = params.agent.brand_color || "#ea580c";

  // Font scale for offer/agent fallback panels (half-width, designBasis=675)
  const s = halfW / 675;

  // ── Helper: parse JSON DesignConfig ──
  const parseDesign = (raw: string): DesignConfig | null => {
    const trimmed = raw?.trim() || "";
    if (trimmed.startsWith("{")) {
      try { return JSON.parse(trimmed) as DesignConfig; } catch { return null; }
    }
    return null;
  };

  // ── 1. Top-left: Monthly deal template (designed in TemplateDesigner) ──
  const templateDesign = parseDesign(params.templateBackHtml);
  // Strip disclaimer from the deal panel — it doesn't belong on the offer quadrant
  if (templateDesign) templateDesign.disclaimer = "";
  const dealElements = templateDesign
    ? renderFlatPanel(templateDesign, 0, 0, halfW, halfH)
    : `<div style="position:absolute;left:0;top:0;width:${toIn(halfW)};height:${toIn(halfH)};background-color:#f9fafb"></div><p style="position:absolute;left:0;top:${toIn(halfH * 0.45)};width:${toIn(halfW)};text-align:center;font-size:${toIn(14 * s)};color:#9ca3af;font-family:Arial,sans-serif;margin:0">Exclusive Local Deal</p>`;

  // ── 2. Top-right: Brokerage display (designed per brokerage) ──
  const brokerageDesign = params.brokerageBackHtml ? parseDesign(params.brokerageBackHtml) : null;
  if (brokerageDesign) brokerageDesign.disclaimer = "";
  let brokerageElements = "";
  if (brokerageDesign) {
    brokerageElements = renderFlatPanel(brokerageDesign, halfW, 0, halfW, halfH);
  } else {
    // Fallback brokerage panel when no brokerage template exists
    brokerageElements += `<div style="position:absolute;left:${toIn(halfW)};top:0;width:${toIn(halfW)};height:${toIn(halfH)};background-color:${brandColor}"></div>`;
    if (params.agent.company_name) {
      brokerageElements += `<p style="position:absolute;left:${toIn(halfW + halfW * 0.1)};top:${toIn(halfH * 0.35)};width:${toIn(halfW * 0.8)};text-align:center;font-size:${toIn(18 * s)};color:#fff;font-family:Georgia,serif;font-style:italic;line-height:1.3;margin:0">${escapeHtml(params.agent.company_name)}</p>`;
    }
    if (params.agent.logo_url) {
      brokerageElements += `<img src="${params.agent.logo_url}" style="position:absolute;left:${toIn(halfW + halfW * 0.05)};top:${toIn(halfH * 0.05)};height:${toIn(halfH * 0.2)};width:auto;object-fit:contain" />`;
    }
  }

  // ── 3. Bottom-left: Agent card ──
  const designData = params.agentCardDesign ? { ...params.agentCardDesign } : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonalFooterPref = (designData as any)?._seasonal_footer || params.agent.seasonal_footer;
  if (designData) delete (designData as any)._seasonal_footer;
  if (designData) delete (designData as any).disclaimer;

  // Build seasonal footer HTML (rendered inside the agent panel container)
  const monthIdx = params.campaignMonth != null ? params.campaignMonth - 1 : undefined;
  const seasonalKey = resolveSeasonalKey(seasonalFooterPref, monthIdx);
  let seasonalFooterHtml = "";
  if (seasonalKey !== "none") {
    const theme = SEASONAL_THEMES[seasonalKey];
    if (theme?.gradient) {
      const fontScale = halfW / 675;
      const footerFontPx = 24 * fontScale;
      seasonalFooterHtml = `<div style="position:absolute;bottom:0;left:0;width:100%;height:12%;background:${theme.gradient};overflow:hidden;z-index:20;display:flex;align-items:center;justify-content:center"><p style="margin:0;text-align:center;font-family:Georgia,serif;font-size:${toIn(footerFontPx)};font-weight:600;color:${theme.textColor};letter-spacing:0.02in">${escapeHtml(theme.text)}</p></div>`;
    }
  }

  let agentElements = "";
  if (designData && (designData as any).elements) {
    const agentDesign = designData as unknown as DesignConfig;
    agentElements = renderFlatPanel(agentDesign, 0, halfH, halfW, halfH, seasonalFooterHtml, "#000", params.agent.team_logo_url);
  } else {
    // Fallback agent panel — wrapped in container with overflow:hidden
    const agent = params.agent;
    const agentName = `${agent.first_name} ${agent.last_name}`.trim();
    const aS = halfW / 675;
    let inner = "";
    inner += `<div style="position:absolute;left:0;top:0;width:100%;height:100%;background:#fff"></div>`;
    if (agent.photo_url) {
      inner += `<img src="${agent.photo_url}" style="position:absolute;left:${toIn(halfW * 0.04)};top:${toIn(halfH * 0.04)};width:${toIn(100 * aS)};height:${toIn(130 * aS)};object-fit:cover;border-radius:${toIn(6 * aS)};border:${toIn(3 * aS)} solid ${brandColor}" />`;
    }
    const textLeftPx = halfW * 0.04 + 110 * aS;
    inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.04)};width:${toIn(halfW * 0.55)};font-size:${toIn(16 * aS)};color:#111827;font-weight:bold;font-family:Arial,sans-serif;margin:0;line-height:1.2">${escapeHtml(agentName)}</p>`;
    if (agent.tagline) inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.12)};width:${toIn(halfW * 0.55)};font-size:${toIn(9 * aS)};color:${brandColor};font-style:italic;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.tagline)}</p>`;
    if (agent.company_name) inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.18)};width:${toIn(halfW * 0.55)};font-size:${toIn(10 * aS)};color:#374151;font-weight:600;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.company_name)}</p>`;
    if (agent.phone) inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.24)};width:${toIn(halfW * 0.55)};font-size:${toIn(9 * aS)};color:#6b7280;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.phone)}</p>`;
    inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.30)};width:${toIn(halfW * 0.55)};font-size:${toIn(8 * aS)};color:#6b7280;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.email)}</p>`;
    if (agent.team_logo_url) {
      inner += `<img src="${agent.team_logo_url}" style="position:absolute;right:${toIn(halfW * 0.04)};top:${toIn(halfH * 0.04)};height:${toIn(55 * aS)};object-fit:contain" />`;
    }
    if (seasonalFooterHtml) inner += seasonalFooterHtml;
    agentElements = `<div style="position:absolute;left:0;top:${toIn(halfH)};width:${toIn(halfW)};height:${toIn(halfH)};overflow:hidden">${inner}</div>`;
  }

  // ── 4. Compose full back ──
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" />${LOB_CSS_RESET}</head>
<body style="width:${toIn(width)};height:${toIn(height)};margin:0;padding:0;position:relative;overflow:hidden;background:#fff">
  ${dealElements}
  ${brokerageElements}
  ${agentElements}
</body>
</html>`;
}

/**
 * Renders ONLY the agent panel (bottom-left quadrant) as standalone HTML.
 * Used for the personalization page preview so the agent sees just their card.
 */
export function renderAgentPanelHtml(params: {
  agentCardDesign?: Record<string, unknown> | null;
  agent: FullBackParams["agent"];
  campaignMonth?: number;
  size: string;
}): string {
  const sizeKey = (params.size || "6x9") as keyof typeof LOB_DIMENSIONS;
  const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];
  const halfW = dims.back.width / 2;
  const halfH = dims.back.height / 2;
  const brandColor = params.agent.brand_color || "#ea580c";

  const designData = params.agentCardDesign ? { ...params.agentCardDesign } : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonalFooterPref = (designData as any)?._seasonal_footer || params.agent.seasonal_footer;
  if (designData) delete (designData as any)._seasonal_footer;
  if (designData) delete (designData as any).disclaimer;

  const monthIdx = params.campaignMonth != null ? params.campaignMonth - 1 : undefined;
  const seasonalKey = resolveSeasonalKey(seasonalFooterPref, monthIdx);
  let seasonalFooterHtml = "";
  if (seasonalKey !== "none") {
    const theme = SEASONAL_THEMES[seasonalKey];
    if (theme?.gradient) {
      const fontScale = halfW / 675;
      const footerFontPx = 24 * fontScale;
      seasonalFooterHtml = `<div style="position:absolute;bottom:0;left:0;width:100%;height:12%;background:${theme.gradient};overflow:hidden;z-index:20;display:flex;align-items:center;justify-content:center"><p style="margin:0;text-align:center;font-family:Georgia,serif;font-size:${toIn(footerFontPx)};font-weight:600;color:${theme.textColor};letter-spacing:0.02in">${escapeHtml(theme.text)}</p></div>`;
    }
  }

  let panelContent = "";
  if (designData && (designData as any).elements) {
    const agentDesign = designData as unknown as DesignConfig;
    // Render at origin (0,0) since this is standalone
    panelContent = renderFlatPanel(agentDesign, 0, 0, halfW, halfH, seasonalFooterHtml, "#000", params.agent.team_logo_url);
  } else {
    const agent = params.agent;
    const agentName = `${agent.first_name} ${agent.last_name}`.trim();
    const aS = halfW / 675;
    let inner = "";
    inner += `<div style="position:absolute;left:0;top:0;width:100%;height:100%;background:#fff"></div>`;
    if (agent.photo_url) {
      inner += `<img src="${agent.photo_url}" style="position:absolute;left:${toIn(halfW * 0.04)};top:${toIn(halfH * 0.04)};width:${toIn(100 * aS)};height:${toIn(130 * aS)};object-fit:cover;border-radius:${toIn(6 * aS)};border:${toIn(3 * aS)} solid ${brandColor}" />`;
    }
    const textLeftPx = halfW * 0.04 + 110 * aS;
    inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.04)};width:${toIn(halfW * 0.55)};font-size:${toIn(16 * aS)};color:#111827;font-weight:bold;font-family:Arial,sans-serif;margin:0;line-height:1.2">${escapeHtml(agentName)}</p>`;
    if (agent.tagline) inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.12)};width:${toIn(halfW * 0.55)};font-size:${toIn(9 * aS)};color:${brandColor};font-style:italic;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.tagline)}</p>`;
    if (agent.company_name) inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.18)};width:${toIn(halfW * 0.55)};font-size:${toIn(10 * aS)};color:#374151;font-weight:600;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.company_name)}</p>`;
    if (agent.phone) inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.24)};width:${toIn(halfW * 0.55)};font-size:${toIn(9 * aS)};color:#6b7280;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.phone)}</p>`;
    inner += `<p style="position:absolute;left:${toIn(textLeftPx)};top:${toIn(halfH * 0.30)};width:${toIn(halfW * 0.55)};font-size:${toIn(8 * aS)};color:#6b7280;font-family:Arial,sans-serif;margin:0">${escapeHtml(agent.email)}</p>`;
    if (agent.team_logo_url) {
      inner += `<img src="${agent.team_logo_url}" style="position:absolute;right:${toIn(halfW * 0.04)};top:${toIn(halfH * 0.04)};height:${toIn(55 * aS)};object-fit:contain" />`;
    }
    if (seasonalFooterHtml) inner += seasonalFooterHtml;
    panelContent = `<div style="position:absolute;left:0;top:0;width:${toIn(halfW)};height:${toIn(halfH)};overflow:hidden">${inner}</div>`;
  }

  // Convert panel dimensions to CSS inch values for the scale script
  const panelWidthIn = (halfW / 300).toFixed(4);
  const panelHeightIn = (halfH / 300).toFixed(4);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  img{display:block}
  html, body { overflow:hidden; -webkit-text-size-adjust:100%; }
  body {
    width:${panelWidthIn}in;
    height:${panelHeightIn}in;
    position:relative;
    background:#fff;
    transform-origin: top left;
  }
</style>
<script>
  function fit() {
    var bw = ${panelWidthIn} * 96;
    var bh = ${panelHeightIn} * 96;
    var s = Math.min(window.innerWidth / bw, window.innerHeight / bh);
    document.body.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
</script>
</head>
<body>
  ${panelContent}
</body>
</html>`;
}
