import type { DesignConfig, DesignElement, FontFamilyOption } from "@/components/admin/TemplateDesigner";

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

function renderElement(el: DesignElement, pxWidth: number, pxHeight: number, designBasis = 675): string {
  const left = `${el.x}%`;
  const top = `${el.y}%`;
  const width = `${el.width}%`;
  const fontScale = pxWidth / designBasis;

  if (el.type === "text") {
    const fontSize = Math.round((el.fontSize || 16) * fontScale);
    const fontFamily = FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif";
    const style = [
      `position:absolute`,
      `left:${left}`,
      `top:${top}`,
      `width:${width}`,
      `font-size:${fontSize}px`,
      `color:${el.fontColor || "#fff"}`,
      `font-weight:${el.fontWeight || "normal"}`,
      `font-style:${el.fontStyle || "normal"}`,
      `text-align:${el.textAlign || "left"}`,
      `font-family:${fontFamily}`,
      `line-height:${el.lineHeight || 1.3}`,
      el.letterSpacing ? `letter-spacing:${Math.round(el.letterSpacing * fontScale)}px` : "",
      `text-transform:${el.textTransform || "none"}`,
      `opacity:${el.opacity ?? 1}`,
      `word-wrap:break-word`,
      `white-space:pre-wrap`,
      `margin:0`,
      `padding:0`,
    ].filter(Boolean).join(";");

    return `<p style="${style}">${escapeHtml(el.text || "")}</p>`;
  }

  if (el.type === "image" && el.src) {
    const height = `${el.height}%`;
    const src = el.tintColor && el.src.startsWith("data:image/svg+xml,")
      ? recolorSvg(el.src, el.tintColor)
      : el.src;

    const style = [
      `position:absolute`,
      `left:${left}`,
      `top:${top}`,
      `width:${width}`,
      `height:${height}`,
      `opacity:${el.opacity ?? 1}`,
    ].join(";");

    const imgStyle = `width:100%;height:100%;object-fit:${el.objectFit || "contain"}`;
    return `<div style="${style}"><img src="${src}" style="${imgStyle}" /></div>`;
  }

  if (el.type === "shape") {
    const height = `${el.height}%`;
    const borderWidth = Math.round((el.shapeBorderWidth || 2) * fontScale);
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
      inner = `<div style="width:100%;position:absolute;top:50%;transform:translateY(-50%);height:${borderWidth}px;background-color:${shapeColor};${rotation}"></div>`;
    } else if (el.shapeType === "rectangle") {
      const fill = el.shapeFilled
        ? `background-color:${shapeColor}`
        : `border:${borderWidth}px solid ${shapeColor}`;
      inner = `<div style="width:100%;height:100%;${fill};${rotation}"></div>`;
    } else if (el.shapeType === "circle") {
      const fill = el.shapeFilled
        ? `background-color:${shapeColor}`
        : `border:${borderWidth}px solid ${shapeColor}`;
      inner = `<div style="width:100%;height:100%;border-radius:50%;${fill};${rotation}"></div>`;
    }

    return `<div style="${style}">${inner}</div>`;
  }

  return "";
}

/**
 * Renders a DesignConfig as a container div (no HTML document wrapper).
 * Used for composing multiple panels into a single print layout.
 * Elements use %-based positioning relative to this container.
 */
function renderDesignPanel(
  design: DesignConfig,
  width: number,
  height: number,
  options?: { teamLogoUrl?: string | null; designBasis?: number }
): string {
  const designBasis = options?.designBasis || 675;
  const bg = design.background;

  let bgLayers = "";
  if (bg.colorEnabled !== false) {
    bgLayers += `background-color:${bg.color};`;
  }

  let bgImageHtml = "";
  if (bg.imageUrl) {
    const opacity = bg.colorEnabled !== false ? 0.3 : 1;
    bgImageHtml = `<img src="${bg.imageUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:${opacity}" />`;
  }

  let overlayHtml = "";
  if (bg.colorEnabled !== false && bg.overlayColor) {
    overlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:${bg.overlayColor}"></div>`;
  }

  const elementsHtml = design.elements
    .map((el) => {
      // Swap team_logo placeholder with actual URL
      const processedEl =
        el.placeholder === "team_logo" && options?.teamLogoUrl
          ? { ...el, src: options.teamLogoUrl }
          : el;
      return renderElement(processedEl, width, height, designBasis);
    })
    .join("\n    ");

  let disclaimerHtml = "";
  if (design.disclaimer) {
    const ds = design.disclaimerStyle;
    const fontSize = ds ? Math.round(ds.fontSize * (width / designBasis)) : Math.round(8 * (width / designBasis));
    const color = ds?.color || "rgba(255,255,255,0.55)";
    const fontFamily = FONT_MAP[ds?.fontFamily || "sans-serif"] || "Arial, sans-serif";
    disclaimerHtml = `
    <div style="position:absolute;bottom:0;left:0;right:0;padding:2% 15%;text-align:center">
      <p style="font-size:${fontSize}px;color:${color};font-family:${fontFamily};line-height:1.3;margin:0">${escapeHtml(design.disclaimer)}</p>
    </div>`;
  }

  return `<div style="position:relative;width:100%;height:100%;overflow:hidden;${bgLayers}">
    ${bgImageHtml}
    ${overlayHtml}
    ${elementsHtml}
    ${disclaimerHtml}
  </div>`;
}

/**
 * Converts a DesignConfig JSON into self-contained print-ready HTML for Lob.
 * Used when rendering a single panel as a full-page document.
 */
export function renderDesignToHtml(
  design: DesignConfig,
  dimensions: { width: number; height: number },
  designBasis = 675
): string {
  const { width, height } = dimensions;
  const panelHtml = renderDesignPanel(design, width, height, { designBasis });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0">
  <div style="width:${width}px;height:${height}px">
    ${panelHtml}
  </div>
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
  designBasis = 675
): string {
  if (!html || !html.trim()) return html;
  if (html.trim().startsWith("{")) {
    try {
      const design: DesignConfig = JSON.parse(html);
      return renderDesignToHtml(design, dimensions, designBasis);
    } catch {
      // Not valid JSON, treat as raw HTML
    }
  }
  return html;
}

/**
 * Injects the agent name + brokerage overlay onto the front HTML.
 * Inserts a bottom bar with brokerage name (left) and "as a gift from [name]" (right).
 */
export function injectFrontOverlay(
  html: string,
  agentName: string,
  companyName?: string | null
): string {
  if (!agentName && !companyName) return html;

  const overlay = `
    <div style="position:absolute;bottom:0;left:0;right:0;display:flex;align-items:flex-end;justify-content:space-between;padding:2.5% 4% 2%;">
      ${companyName ? `<span style="color:#fff;font-family:Arial,sans-serif;font-size:2.2%;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.7)">${escapeHtml(companyName)}</span>` : "<span></span>"}
      ${agentName ? `<span style="color:#fff;font-family:Arial,sans-serif;font-size:1.8%;font-style:italic;text-shadow:0 1px 4px rgba(0,0,0,0.7)">as a gift from ${escapeHtml(agentName)}</span>` : ""}
    </div>`;

  // Insert before the closing </div></body> of the rendered HTML
  if (html.includes("</body>")) {
    return html.replace(
      /(<\/div>\s*<\/body>)/,
      overlay + "\n  $1"
    );
  }
  // Fallback: append before last closing tag
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
const SEASONAL_THEMES: Record<string, { gradient: string; shapes: string }> = {
  january: {
    gradient: "linear-gradient(90deg, #1e3a5f 0%, #c9a84c 50%, #1e3a5f 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><circle cx="20" cy="6" r="1.5" fill="rgba(255,215,0,0.7)"/><circle cx="50" cy="12" r="1" fill="rgba(255,255,255,0.5)"/><circle cx="80" cy="4" r="1.2" fill="rgba(255,215,0,0.6)"/><circle cx="110" cy="14" r="1" fill="rgba(255,255,255,0.4)"/><circle cx="140" cy="8" r="1.5" fill="rgba(255,215,0,0.7)"/><circle cx="170" cy="10" r="1" fill="rgba(255,255,255,0.5)"/><polygon points="30,2 31,5 34,5 31.5,7 32.5,10 30,8 27.5,10 28.5,7 26,5 29,5" fill="rgba(255,215,0,0.5)"/><polygon points="100,3 101,6 104,6 101.5,8 102.5,11 100,9 97.5,11 98.5,8 96,6 99,6" fill="rgba(255,215,0,0.4)"/><polygon points="160,4 161,7 164,7 161.5,9 162.5,12 160,10 157.5,12 158.5,9 156,7 159,7" fill="rgba(255,215,0,0.5)"/></svg>`,
  },
  february: {
    gradient: "linear-gradient(90deg, #f9a8c9 0%, #e8314f 50%, #f9a8c9 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M15,8 C15,5 18,4 20,7 C22,4 25,5 25,8 C25,12 20,15 20,15 C20,15 15,12 15,8Z" fill="rgba(255,255,255,0.5)"/><path d="M55,6 C55,4 57,3 58,5 C59,3 61,4 61,6 C61,9 58,11 58,11 C58,11 55,9 55,6Z" fill="rgba(255,255,255,0.4)"/><path d="M95,8 C95,5 98,4 100,7 C102,4 105,5 105,8 C105,12 100,15 100,15 C100,15 95,12 95,8Z" fill="rgba(255,255,255,0.5)"/><path d="M135,6 C135,4 137,3 138,5 C139,3 141,4 141,6 C141,9 138,11 138,11 C138,11 135,9 135,6Z" fill="rgba(255,255,255,0.4)"/><path d="M175,8 C175,5 178,4 180,7 C182,4 185,5 185,8 C185,12 180,15 180,15 C180,15 175,12 175,8Z" fill="rgba(255,255,255,0.5)"/></svg>`,
  },
  march: {
    gradient: "linear-gradient(90deg, #2d8f4e 0%, #4fc978 50%, #2d8f4e 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><g fill="rgba(255,255,255,0.45)"><circle cx="20" cy="7" r="2.5"/><circle cx="17" cy="9" r="2.5"/><circle cx="23" cy="9" r="2.5"/><rect x="19.5" y="10" width="1" height="5" rx="0.5"/></g><g fill="rgba(255,255,255,0.35)"><circle cx="70" cy="8" r="2"/><circle cx="68" cy="10" r="2"/><circle cx="72" cy="10" r="2"/><rect x="69.5" y="11" width="1" height="4" rx="0.5"/></g><g fill="rgba(255,255,255,0.45)"><circle cx="120" cy="7" r="2.5"/><circle cx="117" cy="9" r="2.5"/><circle cx="123" cy="9" r="2.5"/><rect x="119.5" y="10" width="1" height="5" rx="0.5"/></g><g fill="rgba(255,255,255,0.35)"><circle cx="170" cy="8" r="2"/><circle cx="168" cy="10" r="2"/><circle cx="172" cy="10" r="2"/><rect x="169.5" y="11" width="1" height="4" rx="0.5"/></g></svg>`,
  },
  april: {
    gradient: "linear-gradient(90deg, #a8d8a8 0%, #f5e663 50%, #a8d8a8 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><g fill="rgba(255,255,255,0.6)"><circle cx="25" cy="10" r="2"/><circle cx="25" cy="6" r="1.5"/><circle cx="28" cy="8.5" r="1.5"/><circle cx="22" cy="8.5" r="1.5"/><circle cx="25" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g><g fill="rgba(255,255,255,0.5)"><circle cx="75" cy="10" r="2"/><circle cx="75" cy="6" r="1.5"/><circle cx="78" cy="8.5" r="1.5"/><circle cx="72" cy="8.5" r="1.5"/><circle cx="75" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g><g fill="rgba(255,255,255,0.6)"><circle cx="125" cy="10" r="2"/><circle cx="125" cy="6" r="1.5"/><circle cx="128" cy="8.5" r="1.5"/><circle cx="122" cy="8.5" r="1.5"/><circle cx="125" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g><g fill="rgba(255,255,255,0.5)"><circle cx="175" cy="10" r="2"/><circle cx="175" cy="6" r="1.5"/><circle cx="178" cy="8.5" r="1.5"/><circle cx="172" cy="8.5" r="1.5"/><circle cx="175" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g></svg>`,
  },
  may: {
    gradient: "linear-gradient(90deg, #f4a6d7 0%, #d8b4fe 50%, #f4a6d7 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><g fill="rgba(255,255,255,0.55)"><ellipse cx="20" cy="8" rx="2.5" ry="4" transform="rotate(-20 20 8)"/><ellipse cx="24" cy="8" rx="2.5" ry="4" transform="rotate(20 24 8)"/><circle cx="22" cy="9" r="1.5" fill="rgba(255,200,150,0.6)"/></g><g fill="rgba(255,255,255,0.45)"><ellipse cx="80" cy="9" rx="2" ry="3.5" transform="rotate(-15 80 9)"/><ellipse cx="83" cy="9" rx="2" ry="3.5" transform="rotate(15 83 9)"/><circle cx="81.5" cy="10" r="1.2" fill="rgba(255,200,150,0.6)"/></g><g fill="rgba(255,255,255,0.55)"><ellipse cx="140" cy="8" rx="2.5" ry="4" transform="rotate(-20 140 8)"/><ellipse cx="144" cy="8" rx="2.5" ry="4" transform="rotate(20 144 8)"/><circle cx="142" cy="9" r="1.5" fill="rgba(255,200,150,0.6)"/></g></svg>`,
  },
  june: {
    gradient: "linear-gradient(90deg, #87ceeb 0%, #ffd700 50%, #87ceeb 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><circle cx="40" cy="10" r="3" fill="rgba(255,255,255,0.5)"/><circle cx="120" cy="10" r="3" fill="rgba(255,255,255,0.5)"/></svg>`,
  },
  july: {
    gradient: "linear-gradient(90deg, #bf0a30 0%, #ffffff 25%, #002868 50%, #ffffff 75%, #bf0a30 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><polygon points="20,3 21.5,7 25.5,7 22.2,9.5 23.5,13.5 20,11 16.5,13.5 17.8,9.5 14.5,7 18.5,7" fill="rgba(255,255,255,0.6)"/><polygon points="60,5 61,8 64,8 61.5,9.8 62.5,13 60,11 57.5,13 58.5,9.8 56,8 59,8" fill="rgba(255,215,0,0.5)"/><polygon points="100,3 101.5,7 105.5,7 102.2,9.5 103.5,13.5 100,11 96.5,13.5 97.8,9.5 94.5,7 98.5,7" fill="rgba(255,255,255,0.6)"/><polygon points="140,5 141,8 144,8 141.5,9.8 142.5,13 140,11 137.5,13 138.5,9.8 136,8 139,8" fill="rgba(255,215,0,0.5)"/><polygon points="180,3 181.5,7 185.5,7 182.2,9.5 183.5,13.5 180,11 176.5,13.5 177.8,9.5 174.5,7 178.5,7" fill="rgba(255,255,255,0.6)"/></svg>`,
  },
  august: {
    gradient: "linear-gradient(90deg, #f97316 0%, #0d9488 50%, #f97316 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M0,14 Q10,4 20,12 Q30,4 40,14 Q50,4 60,12 Q70,4 80,14 Q90,4 100,12 Q110,4 120,14 Q130,4 140,12 Q150,4 160,14 Q170,4 180,12 Q190,4 200,14" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/></svg>`,
  },
  september: {
    gradient: "linear-gradient(90deg, #d97706 0%, #92400e 50%, #d97706 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M20,10 Q22,5 25,8 Q27,4 28,8 Q24,12 20,10Z" fill="rgba(255,255,255,0.4)"/><path d="M70,12 Q72,7 75,10 Q77,6 78,10 Q74,14 70,12Z" fill="rgba(255,200,100,0.4)"/><path d="M120,10 Q122,5 125,8 Q127,4 128,8 Q124,12 120,10Z" fill="rgba(255,255,255,0.4)"/><path d="M170,12 Q172,7 175,10 Q177,6 178,10 Q174,14 170,12Z" fill="rgba(255,200,100,0.4)"/></svg>`,
  },
  october: {
    gradient: "linear-gradient(90deg, #f97316 0%, #1c1917 50%, #f97316 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><g fill="rgba(255,165,0,0.6)"><ellipse cx="20" cy="10" rx="5" ry="4.5"/><ellipse cx="20" cy="10" rx="3" ry="4.5" fill="rgba(255,140,0,0.5)"/></g><polygon points="115,3 116,6 119,6.5 116.5,8.5 117.5,11.5 115,9.5 112.5,11.5 113.5,8.5 111,6.5 114,6" fill="rgba(255,215,0,0.4)"/><g fill="rgba(255,165,0,0.55)"><ellipse cx="85" cy="10" rx="4" ry="3.8"/></g></svg>`,
  },
  november: {
    gradient: "linear-gradient(90deg, #92400e 0%, #ca8a04 50%, #92400e 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M55,10 Q57,5 60,8 Q62,4 63,8 Q59,13 55,10Z" fill="rgba(255,180,80,0.4)"/><path d="M75,12 Q77,7 80,10 Q82,6 83,10 Q79,14 75,12Z" fill="rgba(255,215,0,0.4)"/><path d="M135,10 Q137,5 140,8 Q142,4 143,8 Q139,12 135,10Z" fill="rgba(255,215,0,0.4)"/><path d="M185,12 Q187,7 190,10 Q192,6 193,10 Q189,14 185,12Z" fill="rgba(255,180,80,0.35)"/></svg>`,
  },
  december: {
    gradient: "linear-gradient(90deg, #dc2626 0%, #16a34a 50%, #dc2626 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><g fill="rgba(255,255,255,0.5)"><line x1="20" y1="3" x2="20" y2="5" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/><line x1="18" y1="4" x2="22" y2="4" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/></g><g fill="rgba(255,255,255,0.4)"><line x1="70" y1="8" x2="70" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/><line x1="68" y1="10" x2="72" y2="10" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/></g><g><line x1="120" y1="5" x2="120" y2="9" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/><line x1="118" y1="7" x2="122" y2="7" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/></g><g><line x1="170" y1="10" x2="170" y2="14" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/><line x1="168" y1="12" x2="172" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/></g></svg>`,
  },
  social: {
    gradient: "linear-gradient(90deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><text x="100" y="10" font-family="Arial,sans-serif" font-size="4.5" fill="rgba(255,255,255,0.55)" text-anchor="middle" dominant-baseline="central">Follow us on social</text></svg>`,
  },
  consultation: {
    gradient: "linear-gradient(90deg, #0a0a0a 0%, #2a2a2a 50%, #0a0a0a 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><text x="100" y="10" font-family="Georgia,serif" font-size="5.5" font-weight="bold" fill="rgba(212,175,55,0.9)" text-anchor="middle" dominant-baseline="central" letter-spacing="0.8">Call us for a free consultation</text></svg>`,
  },
  referral: {
    gradient: "linear-gradient(90deg, #1a3a2a 0%, #40916c 50%, #1a3a2a 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:100%"><text x="100" y="10" font-family="Georgia,serif" font-size="5" font-weight="bold" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="central" letter-spacing="0.6">Your Referrals Are Our Greatest Reward</text></svg>`,
  },
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

function renderSeasonalFooterStrip(
  seasonalFooter: string | null | undefined,
  campaignMonth: number | undefined,
): string {
  const monthIdx = campaignMonth != null ? campaignMonth - 1 : undefined;
  const key = resolveSeasonalKey(seasonalFooter, monthIdx);
  if (key === "none") return "";
  const theme = SEASONAL_THEMES[key];
  if (!theme || !theme.gradient) return "";
  return `<div style="position:absolute;bottom:0;left:0;right:0;height:12%;background:${theme.gradient};overflow:hidden;z-index:20"><div style="position:absolute;top:0;left:0;right:0;bottom:0">${theme.shapes}</div></div>`;
}

/* ── Offer Panel (top-left quadrant) ── */
function renderOfferPanel(
  offer: { title?: string; discount_text?: string; merchant_name?: string; merchant_address?: string; fine_print?: string | null; redemption_code?: string | null } | null | undefined,
  width: number,
  brandColor: string,
): string {
  const s = width / 675; // scale factor

  if (!offer || !offer.title) {
    return `<div style="position:relative;width:100%;height:100%;background-color:#f9fafb">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
        <p style="font-size:${Math.round(14 * s)}px;color:#9ca3af;font-family:Arial,sans-serif">Exclusive Local Deal</p>
      </div>
    </div>`;
  }

  const codeHtml = offer.redemption_code
    ? `<div style="margin-top:${Math.round(10 * s)}px;padding:${Math.round(4 * s)}px ${Math.round(14 * s)}px;border:${Math.round(2 * s)}px dashed ${brandColor};border-radius:${Math.round(4 * s)}px;display:inline-block"><p style="font-size:${Math.round(11 * s)}px;color:${brandColor};font-family:Arial,sans-serif;font-weight:bold;margin:0">Code: ${escapeHtml(offer.redemption_code)}</p></div>`
    : "";

  const finePrintHtml = offer.fine_print
    ? `<p style="font-size:${Math.round(7 * s)}px;color:#9ca3af;font-family:Arial,sans-serif;margin:${Math.round(6 * s)}px 0 0;font-style:italic">${escapeHtml(offer.fine_print)}</p>`
    : "";

  return `<div style="position:relative;width:100%;height:100%;background-color:#f9fafb;overflow:hidden">
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5%">
      <p style="font-size:${Math.round(11 * s)}px;color:#6b7280;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:${Math.round(2 * s)}px;margin:0 0 ${Math.round(10 * s)}px">Featured Offer</p>
      <div style="background:#fff;border-radius:${Math.round(8 * s)}px;padding:${Math.round(16 * s)}px ${Math.round(20 * s)}px;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center;max-width:90%">
        <p style="font-size:${Math.round(26 * s)}px;color:${brandColor};font-family:Arial,sans-serif;font-weight:bold;margin:0;line-height:1.2">${escapeHtml(offer.discount_text || offer.title)}</p>
        ${offer.discount_text && offer.title !== offer.discount_text ? `<p style="font-size:${Math.round(12 * s)}px;color:#374151;font-family:Arial,sans-serif;margin:${Math.round(4 * s)}px 0 0">${escapeHtml(offer.title)}</p>` : ""}
        <p style="font-size:${Math.round(14 * s)}px;color:#111827;font-family:Arial,sans-serif;font-weight:600;margin:${Math.round(8 * s)}px 0 0">${escapeHtml(offer.merchant_name || "")}</p>
        ${offer.merchant_address ? `<p style="font-size:${Math.round(10 * s)}px;color:#6b7280;font-family:Arial,sans-serif;margin:${Math.round(2 * s)}px 0 0">${escapeHtml(offer.merchant_address)}</p>` : ""}
        ${codeHtml}
        ${finePrintHtml}
      </div>
    </div>
  </div>`;
}

/* ── Agent Fallback Panel (when no agent_card_design exists) ── */
function renderAgentFallbackPanel(
  agent: {
    first_name: string; last_name: string; company_name?: string | null;
    phone?: string | null; email: string; tagline?: string | null;
    custom_message?: string | null; photo_url?: string | null;
    brand_color?: string; license_number?: string | null; team_logo_url?: string | null;
  },
  width: number,
  seasonalHtml: string,
): string {
  const s = width / 675;
  const brandColor = agent.brand_color || "#ea580c";
  const agentName = `${agent.first_name} ${agent.last_name}`.trim();

  const headshotW = Math.round(100 * s);
  const headshotH = Math.round(130 * s);
  const headshotHtml = agent.photo_url
    ? `<img src="${agent.photo_url}" style="width:${headshotW}px;height:${headshotH}px;object-fit:cover;border-radius:${Math.round(6 * s)}px;border:${Math.round(3 * s)}px solid ${brandColor};flex-shrink:0" />`
    : `<div style="width:${headshotW}px;height:${headshotH}px;background:linear-gradient(135deg,#e5e7eb,#d1d5db);border-radius:${Math.round(6 * s)}px;border:${Math.round(3 * s)}px solid ${brandColor};flex-shrink:0"></div>`;

  let info = `<p style="font-size:${Math.round(16 * s)}px;color:#111827;font-weight:bold;font-family:Arial,sans-serif;margin:0;line-height:1.2">${escapeHtml(agentName)}</p>`;
  if (agent.tagline) info += `<p style="font-size:${Math.round(9 * s)}px;color:${brandColor};font-style:italic;font-family:Arial,sans-serif;margin:${Math.round(3 * s)}px 0 0">${escapeHtml(agent.tagline)}</p>`;
  if (agent.company_name) info += `<p style="font-size:${Math.round(10 * s)}px;color:#374151;font-weight:600;font-family:Arial,sans-serif;margin:${Math.round(3 * s)}px 0 0">${escapeHtml(agent.company_name)}</p>`;
  if (agent.phone) info += `<p style="font-size:${Math.round(9 * s)}px;color:#6b7280;font-family:Arial,sans-serif;margin:${Math.round(3 * s)}px 0 0">${escapeHtml(agent.phone)}</p>`;
  if (agent.email) info += `<p style="font-size:${Math.round(8 * s)}px;color:#6b7280;font-family:Arial,sans-serif;margin:${Math.round(2 * s)}px 0 0">${escapeHtml(agent.email)}</p>`;
  if (agent.license_number) info += `<p style="font-size:${Math.round(7 * s)}px;color:#9ca3af;font-family:Arial,sans-serif;margin:${Math.round(2 * s)}px 0 0">${escapeHtml(agent.license_number)}</p>`;

  const teamLogoHtml = agent.team_logo_url
    ? `<img src="${agent.team_logo_url}" style="height:${Math.round(55 * s)}px;width:auto;object-fit:contain;flex-shrink:0;margin-left:auto" />`
    : "";

  const messageHtml = agent.custom_message
    ? `<div style="position:absolute;bottom:${seasonalHtml ? "14%" : "4%"};left:4%;right:4%"><p style="font-size:${Math.round(8 * s)}px;color:#6b7280;font-family:Arial,sans-serif;line-height:1.4;margin:0">${escapeHtml(agent.custom_message)}</p></div>`
    : "";

  return `<div style="position:relative;width:100%;height:100%;background:#fff;overflow:hidden">
    <div style="position:absolute;top:4%;left:4%;right:4%;display:flex;gap:${Math.round(12 * s)}px;align-items:flex-start">
      ${headshotHtml}
      <div style="flex:1;min-width:0">${info}</div>
      ${teamLogoHtml}
    </div>
    ${messageHtml}
    ${seasonalHtml}
  </div>`;
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
 * Composes the full postcard back from 4 quadrants:
 *   Top-left:     Offer panel (auto-generated or from monthly template's back_html)
 *   Top-right:    Brokerage panel (from brokerage template's back_html)
 *   Bottom-left:  Agent panel (from agent_card_design or fallback)
 *   Bottom-right: Mailing area (white — Lob overlays recipient address)
 *
 * Template types:
 *   - "monthly":    back_html = designed offer panel (top-left), brokerageBackHtml = brokerage panel (top-right)
 *   - "brokerage":  back_html = brokerage panel (top-right), offer panel auto-generated from offer data
 */
export function renderFullBackHtml(params: FullBackParams): string {
  const sizeKey = (params.size || "6x9") as keyof typeof LOB_DIMENSIONS;
  const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];
  const { width, height } = dims.back;
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  const brandColor = params.agent.brand_color || "#ea580c";

  // Helper to render a DesignConfig JSON string into a panel div
  const renderPanelFromHtml = (raw: string): string => {
    const trimmed = raw?.trim() || "";
    if (trimmed.startsWith("{")) {
      try {
        const design: DesignConfig = JSON.parse(trimmed);
        return renderDesignPanel(design, halfW, halfH, {
          teamLogoUrl: params.agent.team_logo_url,
        });
      } catch {
        return trimmed || `<div style="width:100%;height:100%;background-color:${brandColor}"></div>`;
      }
    }
    return trimmed || `<div style="width:100%;height:100%;background-color:${brandColor}"></div>`;
  };

  let offerHtml: string;
  let brokerageHtml: string;

  if (params.templateType === "monthly") {
    // Monthly template: back_html is the designed offer panel (top-left)
    // brokerageBackHtml is the brokerage panel (top-right)
    offerHtml = renderPanelFromHtml(params.templateBackHtml);
    brokerageHtml = params.brokerageBackHtml
      ? renderPanelFromHtml(params.brokerageBackHtml)
      : `<div style="width:100%;height:100%;background-color:${brandColor}"></div>`;
  } else {
    // Brokerage template: back_html is the brokerage panel (top-right)
    // Offer panel auto-generated from offer data
    offerHtml = renderOfferPanel(params.offer, halfW, brandColor);
    brokerageHtml = renderPanelFromHtml(params.templateBackHtml);
  }

  // ── 3. Agent panel (bottom-left) ──
  // Extract seasonal footer preference
  const designData = params.agentCardDesign ? { ...params.agentCardDesign } : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonalFooterPref = (designData as any)?._seasonal_footer || params.agent.seasonal_footer;
  if (designData) delete (designData as any)._seasonal_footer;

  const seasonalHtml = renderSeasonalFooterStrip(seasonalFooterPref, params.campaignMonth);

  let agentHtml: string;
  if (designData && (designData as any).elements) {
    const design = designData as unknown as DesignConfig;
    const panelHtml = renderDesignPanel(design, halfW, halfH, {
      teamLogoUrl: params.agent.team_logo_url,
    });
    // Inject seasonal footer inside the panel's root div
    if (seasonalHtml) {
      agentHtml = panelHtml.replace(/<\/div>\s*$/, seasonalHtml + "\n  </div>");
    } else {
      agentHtml = panelHtml;
    }
  } else {
    agentHtml = renderAgentFallbackPanel(params.agent, halfW, seasonalHtml);
  }

  // ── 4. Compose full back ──
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0">
  <div style="position:relative;width:${width}px;height:${height}px;overflow:hidden;background:#fff">
    <!-- Top-left: Offer -->
    <div style="position:absolute;left:0;top:0;width:${halfW}px;height:${halfH}px;overflow:hidden">
      ${offerHtml}
    </div>
    <!-- Top-right: Brokerage -->
    <div style="position:absolute;left:${halfW + 1}px;top:0;width:${width - halfW - 1}px;height:${halfH}px;overflow:hidden">
      ${brokerageHtml}
    </div>
    <!-- Horizontal divider -->
    <div style="position:absolute;left:0;top:${halfH}px;width:${width}px;height:1px;background:#d1d5db"></div>
    <!-- Vertical divider -->
    <div style="position:absolute;left:${halfW}px;top:0;width:1px;height:${height}px;background:#d1d5db"></div>
    <!-- Bottom-left: Agent -->
    <div style="position:absolute;left:0;top:${halfH + 1}px;width:${halfW}px;height:${height - halfH - 1}px;overflow:hidden">
      ${agentHtml}
    </div>
    <!-- Bottom-right: Mailing area (Lob overlays address) -->
    <div style="position:absolute;left:${halfW + 1}px;top:${halfH + 1}px;width:${width - halfW - 1}px;height:${height - halfH - 1}px;background:#fff"></div>
  </div>
</body>
</html>`;
}
