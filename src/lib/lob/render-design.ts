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

function renderElement(el: DesignElement, pxWidth: number, pxHeight: number): string {
  const left = `${el.x}%`;
  const top = `${el.y}%`;
  const width = `${el.width}%`;
  const fontScale = pxWidth / 675; // design basis ratio

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

  return "";
}

/**
 * Converts a DesignConfig JSON into self-contained print-ready HTML for Lob.
 * @param design - The design configuration from the template designer
 * @param dimensions - Output pixel dimensions (e.g. 2775x1875 for 6x9 at 300 DPI)
 */
export function renderDesignToHtml(
  design: DesignConfig,
  dimensions: { width: number; height: number }
): string {
  const { width, height } = dimensions;
  const bg = design.background;

  // Background layers
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

  // Elements
  const elementsHtml = design.elements
    .map((el) => renderElement(el, width, height))
    .join("\n    ");

  // Disclaimer
  let disclaimerHtml = "";
  if (design.disclaimer) {
    const ds = design.disclaimerStyle;
    const fontSize = ds ? Math.round(ds.fontSize * (width / 675)) : Math.round(8 * (width / 675));
    const color = ds?.color || "rgba(255,255,255,0.55)";
    const fontFamily = FONT_MAP[ds?.fontFamily || "sans-serif"] || "Arial, sans-serif";
    disclaimerHtml = `
    <div style="position:absolute;bottom:0;left:0;right:0;padding:2% 15%;text-align:center">
      <p style="font-size:${fontSize}px;color:${color};font-family:${fontFamily};line-height:1.3;margin:0">${escapeHtml(design.disclaimer)}</p>
    </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0">
  <div style="position:relative;width:${width}px;height:${height}px;overflow:hidden;${bgLayers}">
    ${bgImageHtml}
    ${overlayHtml}
    ${elementsHtml}
    ${disclaimerHtml}
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
  dimensions: { width: number; height: number }
): string {
  if (!html || !html.trim()) return html;
  if (html.trim().startsWith("{")) {
    try {
      const design: DesignConfig = JSON.parse(html);
      return renderDesignToHtml(design, dimensions);
    } catch {
      // Not valid JSON, treat as raw HTML
    }
  }
  return html;
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
