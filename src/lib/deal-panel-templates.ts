import type { DesignConfig, DesignElement } from "@/components/admin/TemplateDesigner";

/**
 * Pre-made starter layouts for the top-left "Offer Panel" quadrant.
 * Each layout has placeholder elements that the admin replaces with real content.
 * Positions are optimized for renderFlatPanel output (what Lob prints).
 */

export interface DealPanelLayout {
  key: string;
  label: string;
  description: string;
  build: () => DesignConfig;
}

let _id = 0;
const id = (): string => `deal-${_id++}`;
const reset = () => { _id = 0; };

/* ────────────────────────────────────────────
   Layout 1 — Image Left
   Product image left 50%, merchant info right 48%
   More breathing room for text than the default
   ──────────────────────────────────────────── */
function buildImageLeft(): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  // Deal image — left half
  els.push({
    id: id(), type: "image",
    x: 0, y: 0, width: 50, height: 100,
    src: "", objectFit: "cover",
  });

  // Merchant logo overlaid on image
  els.push({
    id: id(), type: "image",
    x: 3, y: 3, width: 25, height: 22,
    src: "", objectFit: "contain",
  });

  // Merchant name
  els.push({
    id: id(), type: "text",
    x: 52, y: 5, width: 46, height: 8,
    text: "MERCHANT NAME", fontSize: 20, fontWeight: "bold",
    fontColor: "#111827", fontFamily: "sans-serif", textAlign: "center",
  });

  // Tagline
  els.push({
    id: id(), type: "text",
    x: 52, y: 14, width: 46, height: 6,
    text: "Your tagline here", fontSize: 13, fontStyle: "italic",
    fontColor: "#6B7280", fontFamily: "sans-serif", textAlign: "center",
  });

  // Deal / discount text
  els.push({
    id: id(), type: "text",
    x: 52, y: 24, width: 46, height: 15,
    text: "$XX OFF\nYOUR PURCHASE", fontSize: 24, fontWeight: "bold",
    fontColor: "#dc2626", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  // Phone
  els.push({
    id: id(), type: "text",
    x: 52, y: 42, width: 46, height: 7,
    text: "(555) 123-4567", fontSize: 20, fontWeight: "bold",
    fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center",
  });

  // Email / website
  els.push({
    id: id(), type: "text",
    x: 52, y: 52, width: 46, height: 8,
    text: "info@business.com\nwww.business.com", fontSize: 13,
    fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center",
  });

  // Fine print
  els.push({
    id: id(), type: "text",
    x: 52, y: 70, width: 46, height: 28,
    text: "Present this postcard to redeem. Terms and conditions apply. Valid through MM/DD/YY.", fontSize: 10,
    fontColor: "#9CA3AF", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Layout 2 — Full Background
   Image as full background with dark gradient overlay
   Text overlaid in white
   ──────────────────────────────────────────── */
function buildFullBackground(): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  // Merchant logo top-left
  els.push({
    id: id(), type: "image",
    x: 3, y: 3, width: 25, height: 20,
    src: "", objectFit: "contain",
  });

  // Merchant name
  els.push({
    id: id(), type: "text",
    x: 30, y: 5, width: 67, height: 8,
    text: "MERCHANT NAME", fontSize: 22, fontWeight: "bold",
    fontColor: "#ffffff", fontFamily: "sans-serif", textAlign: "center",
  });

  // Tagline
  els.push({
    id: id(), type: "text",
    x: 30, y: 14, width: 67, height: 5,
    text: "Your tagline here", fontSize: 12, fontStyle: "italic",
    fontColor: "rgba(255,255,255,0.8)", fontFamily: "sans-serif", textAlign: "center",
  });

  // Deal / discount text — centered, large
  els.push({
    id: id(), type: "text",
    x: 10, y: 35, width: 80, height: 20,
    text: "$XX OFF YOUR PURCHASE", fontSize: 30, fontWeight: "bold",
    fontColor: "#ffffff", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  // Phone
  els.push({
    id: id(), type: "text",
    x: 10, y: 58, width: 80, height: 7,
    text: "(555) 123-4567", fontSize: 22, fontWeight: "bold",
    fontColor: "#ffffff", fontFamily: "sans-serif", textAlign: "center",
  });

  // Email / website
  els.push({
    id: id(), type: "text",
    x: 15, y: 68, width: 70, height: 7,
    text: "info@business.com  |  www.business.com", fontSize: 13,
    fontColor: "rgba(255,255,255,0.85)", fontFamily: "sans-serif", textAlign: "center",
  });

  // Fine print
  els.push({
    id: id(), type: "text",
    x: 10, y: 80, width: 80, height: 18,
    text: "Present this postcard to redeem. Terms and conditions apply.", fontSize: 10,
    fontColor: "rgba(255,255,255,0.6)", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  return {
    background: { color: "#1a1a2e", imageUrl: "", overlayColor: "rgba(0,0,0,0.4)", colorEnabled: true },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Layout 3 — Image Top
   Product image top 45%, info bottom 55%
   ──────────────────────────────────────────── */
function buildImageTop(): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  // Deal image — top
  els.push({
    id: id(), type: "image",
    x: 0, y: 0, width: 100, height: 45,
    src: "", objectFit: "cover",
  });

  // Merchant logo overlaid on image
  els.push({
    id: id(), type: "image",
    x: 3, y: 2, width: 20, height: 18,
    src: "", objectFit: "contain",
  });

  // Merchant name
  els.push({
    id: id(), type: "text",
    x: 5, y: 48, width: 90, height: 7,
    text: "MERCHANT NAME", fontSize: 20, fontWeight: "bold",
    fontColor: "#111827", fontFamily: "sans-serif", textAlign: "center",
  });

  // Deal text
  els.push({
    id: id(), type: "text",
    x: 10, y: 56, width: 80, height: 10,
    text: "$XX OFF YOUR PURCHASE", fontSize: 22, fontWeight: "bold",
    fontColor: "#dc2626", fontFamily: "sans-serif", textAlign: "center",
  });

  // Phone
  els.push({
    id: id(), type: "text",
    x: 10, y: 67, width: 80, height: 6,
    text: "(555) 123-4567", fontSize: 18, fontWeight: "bold",
    fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center",
  });

  // Email / website
  els.push({
    id: id(), type: "text",
    x: 10, y: 74, width: 80, height: 6,
    text: "info@business.com  |  www.business.com", fontSize: 12,
    fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center",
  });

  // Fine print
  els.push({
    id: id(), type: "text",
    x: 5, y: 82, width: 90, height: 16,
    text: "Present this postcard to redeem. Terms and conditions apply.", fontSize: 10,
    fontColor: "#9CA3AF", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Layout 4 — Banner Header
   Brand color header bar, image below, info right
   ──────────────────────────────────────────── */
function buildBannerDeal(): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  // Brand color header
  els.push({
    id: id(), type: "shape",
    x: 0, y: 0, width: 100, height: 18,
    shapeType: "rectangle", shapeColor: "#1e3a5f", shapeFilled: true,
  });

  // Merchant name on header
  els.push({
    id: id(), type: "text",
    x: 5, y: 2, width: 90, height: 8,
    text: "MERCHANT NAME", fontSize: 22, fontWeight: "bold",
    fontColor: "#ffffff", fontFamily: "sans-serif", textAlign: "center",
  });

  // Tagline on header
  els.push({
    id: id(), type: "text",
    x: 10, y: 10, width: 80, height: 5,
    text: "Your tagline here", fontSize: 11, fontStyle: "italic",
    fontColor: "rgba(255,255,255,0.8)", fontFamily: "sans-serif", textAlign: "center",
  });

  // Deal image — below header, left side
  els.push({
    id: id(), type: "image",
    x: 2, y: 21, width: 45, height: 60,
    src: "", objectFit: "cover",
  });

  // Merchant logo
  els.push({
    id: id(), type: "image",
    x: 50, y: 21, width: 22, height: 18,
    src: "", objectFit: "contain",
  });

  // Deal text
  els.push({
    id: id(), type: "text",
    x: 50, y: 40, width: 48, height: 12,
    text: "$XX OFF\nYOUR PURCHASE", fontSize: 22, fontWeight: "bold",
    fontColor: "#dc2626", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  // Phone
  els.push({
    id: id(), type: "text",
    x: 50, y: 54, width: 48, height: 6,
    text: "(555) 123-4567", fontSize: 18, fontWeight: "bold",
    fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center",
  });

  // Email / website
  els.push({
    id: id(), type: "text",
    x: 50, y: 62, width: 48, height: 7,
    text: "info@business.com\nwww.business.com", fontSize: 12,
    fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center",
  });

  // Fine print — full width at bottom
  els.push({
    id: id(), type: "text",
    x: 3, y: 83, width: 94, height: 15,
    text: "Present this postcard to redeem. Terms and conditions apply. Valid through MM/DD/YY.", fontSize: 9,
    fontColor: "#9CA3AF", fontFamily: "sans-serif", textAlign: "center",
    lineHeight: 1.2,
  });

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ──────────────────────────────────────────── */

export const DEAL_PANEL_LAYOUTS: DealPanelLayout[] = [
  { key: "image-left",       label: "Image Left",       description: "Product image left, info right",      build: buildImageLeft },
  { key: "full-background",  label: "Full Background",  description: "Image background with text overlay",  build: buildFullBackground },
  { key: "image-top",        label: "Image Top",        description: "Product image top, info below",       build: buildImageTop },
  { key: "banner-deal",      label: "Banner Header",    description: "Brand color header, split below",     build: buildBannerDeal },
];
