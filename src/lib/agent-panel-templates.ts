import type { DesignConfig, DesignElement } from "@/components/admin/TemplateDesigner";

export interface AgentPanelData {
  name: string;
  tagline: string;
  company_name: string;
  phone: string;
  email: string;
  website: string;
  license_number: string;
  photo_url: string;
  custom_message: string;
  brand_color: string;
}

export interface PanelTemplate {
  key: string;
  label: string;
  description: string;
  build: (data: AgentPanelData) => DesignConfig;
}

let _id = 0;
const el = (): string => `el-${_id++}`;
const reset = () => { _id = 0; };

/* ────────────────────────────────────────────
   Template 1 — Classic
   Photo left 28%, text stacked right
   ──────────────────────────────────────────── */
function buildClassic(d: AgentPanelData): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  if (d.photo_url) {
    els.push({ id: el(), type: "image", x: 3, y: 8, width: 28, height: 74, src: d.photo_url, objectFit: "cover" });
  }

  let y = 8;
  if (d.name) {
    els.push({ id: el(), type: "text", x: 34, y, width: 63, height: 10, text: d.name, fontSize: 28, fontWeight: "bold", fontColor: "#111827", fontFamily: "sans-serif", textAlign: "center" });
    y += 9;
  }
  if (d.tagline) {
    els.push({ id: el(), type: "text", x: 34, y, width: 63, height: 6, text: `"${d.tagline}"`, fontSize: 14, fontStyle: "italic", fontColor: d.brand_color, fontFamily: "sans-serif", textAlign: "center" });
    y += 7;
  }
  if (d.company_name) {
    els.push({ id: el(), type: "text", x: 34, y, width: 63, height: 6, text: d.company_name, fontSize: 16, fontWeight: "bold", fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center" });
    y += 7;
  }
  if (d.phone) {
    els.push({ id: el(), type: "text", x: 34, y, width: 63, height: 7, text: d.phone, fontSize: 24, fontWeight: "bold", fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center" });
    y += 9;
  }
  const contact = [d.email, d.website].filter(Boolean).join("\n");
  if (contact) {
    els.push({ id: el(), type: "text", x: 34, y, width: 63, height: 8, text: contact, fontSize: 15, fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center" });
    y += 9;
  }

  // Team logo placeholder
  els.push({ id: el(), type: "image", x: 52, y: 48, width: 28, height: 42, src: "", objectFit: "cover", placeholder: "team_logo" });

  if (d.custom_message) {
    els.push({ id: el(), type: "text", _personalMessage: true, x: 36, y: 50, width: 57, height: 10, text: d.custom_message, fontSize: 18, fontColor: "#000000", fontFamily: "optima", textAlign: "center", lineHeight: 1.2 });
  }

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Template 2 — Centered
   Photo centered top, everything centered below
   ──────────────────────────────────────────── */
function buildCentered(d: AgentPanelData): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  if (d.photo_url) {
    els.push({ id: el(), type: "image", x: 35, y: 3, width: 30, height: 38, src: d.photo_url, objectFit: "cover" });
  }

  let y = 44;
  if (d.name) {
    els.push({ id: el(), type: "text", x: 5, y, width: 90, height: 8, text: d.name, fontSize: 26, fontWeight: "bold", fontColor: "#111827", fontFamily: "sans-serif", textAlign: "center" });
    y += 9;
  }
  if (d.tagline) {
    els.push({ id: el(), type: "text", x: 10, y, width: 80, height: 5, text: `"${d.tagline}"`, fontSize: 13, fontStyle: "italic", fontColor: d.brand_color, fontFamily: "sans-serif", textAlign: "center" });
    y += 6;
  }
  if (d.company_name) {
    els.push({ id: el(), type: "text", x: 15, y, width: 70, height: 5, text: d.company_name, fontSize: 14, fontWeight: "bold", fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center" });
    y += 7;
  }
  if (d.phone) {
    els.push({ id: el(), type: "text", x: 10, y, width: 80, height: 7, text: d.phone, fontSize: 22, fontWeight: "bold", fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center" });
    y += 8;
  }
  const contact = [d.email, d.website].filter(Boolean).join("\n");
  if (contact) {
    els.push({ id: el(), type: "text", x: 10, y, width: 80, height: 7, text: contact, fontSize: 13, fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center" });
  }

  // Team logo centered at bottom
  els.push({ id: el(), type: "image", x: 35, y: 82, width: 30, height: 14, src: "", objectFit: "contain", placeholder: "team_logo" });

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Template 3 — Photo Focus (Side-by-Side)
   Photo fills left 42%, text right
   ──────────────────────────────────────────── */
function buildPhotoFocus(d: AgentPanelData): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  if (d.photo_url) {
    els.push({ id: el(), type: "image", x: 0, y: 0, width: 42, height: 88, src: d.photo_url, objectFit: "cover" });
  }

  // Accent line separator
  els.push({ id: el(), type: "shape", x: 45, y: 24, width: 40, height: 1, shapeType: "line", shapeColor: d.brand_color, shapeBorderWidth: 2 });

  let y = 8;
  if (d.name) {
    els.push({ id: el(), type: "text", x: 45, y, width: 52, height: 9, text: d.name, fontSize: 24, fontWeight: "bold", fontColor: "#111827", fontFamily: "sans-serif", textAlign: "left" });
    y += 9;
  }
  if (d.tagline) {
    els.push({ id: el(), type: "text", x: 45, y, width: 52, height: 5, text: d.tagline, fontSize: 13, fontStyle: "italic", fontColor: d.brand_color, fontFamily: "sans-serif", textAlign: "left" });
    y = 27;
  } else {
    y = 27;
  }
  if (d.company_name) {
    els.push({ id: el(), type: "text", x: 45, y, width: 52, height: 5, text: d.company_name, fontSize: 14, fontWeight: "bold", fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    y += 7;
  }
  if (d.phone) {
    els.push({ id: el(), type: "text", x: 45, y, width: 52, height: 6, text: d.phone, fontSize: 20, fontWeight: "bold", fontColor: "#000000", fontFamily: "sans-serif", textAlign: "left" });
    y += 8;
  }
  if (d.email) {
    els.push({ id: el(), type: "text", x: 45, y, width: 52, height: 5, text: d.email, fontSize: 13, fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    y += 6;
  }
  if (d.website) {
    els.push({ id: el(), type: "text", x: 45, y, width: 52, height: 5, text: d.website, fontSize: 13, fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    y += 7;
  }

  if (d.custom_message) {
    els.push({ id: el(), type: "text", _personalMessage: true, x: 45, y: Math.max(y, 56), width: 50, height: 10, text: d.custom_message, fontSize: 14, fontColor: "#6B7280", fontFamily: "optima", textAlign: "left", lineHeight: 1.2 });
  }

  els.push({ id: el(), type: "image", x: 60, y: 60, width: 30, height: 28, src: "", objectFit: "contain", placeholder: "team_logo" });

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Template 4 — Banner Header
   Brand color banner at top with name, photo+info below
   ──────────────────────────────────────────── */
function buildBanner(d: AgentPanelData): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  // Brand color header bar
  els.push({ id: el(), type: "shape", x: 0, y: 0, width: 100, height: 22, shapeType: "rectangle", shapeColor: d.brand_color, shapeFilled: true });

  if (d.name) {
    els.push({ id: el(), type: "text", x: 5, y: 3, width: 90, height: 9, text: d.name, fontSize: 26, fontWeight: "bold", fontColor: "#ffffff", fontFamily: "sans-serif", textAlign: "center" });
  }
  if (d.tagline) {
    els.push({ id: el(), type: "text", x: 10, y: 13, width: 80, height: 5, text: d.tagline, fontSize: 12, fontStyle: "italic", fontColor: "rgba(255,255,255,0.85)", fontFamily: "sans-serif", textAlign: "center" });
  }

  if (d.photo_url) {
    els.push({ id: el(), type: "image", x: 5, y: 26, width: 25, height: 55, src: d.photo_url, objectFit: "cover" });
  }

  let y = 26;
  if (d.company_name) {
    els.push({ id: el(), type: "text", x: 33, y, width: 64, height: 5, text: d.company_name, fontSize: 15, fontWeight: "bold", fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    y += 7;
  }
  if (d.phone) {
    els.push({ id: el(), type: "text", x: 33, y, width: 64, height: 7, text: d.phone, fontSize: 22, fontWeight: "bold", fontColor: "#000000", fontFamily: "sans-serif", textAlign: "left" });
    y += 9;
  }
  if (d.email) {
    els.push({ id: el(), type: "text", x: 33, y, width: 64, height: 5, text: d.email, fontSize: 13, fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    y += 6;
  }
  if (d.website) {
    els.push({ id: el(), type: "text", x: 33, y, width: 64, height: 5, text: d.website, fontSize: 13, fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    y += 7;
  }

  if (d.custom_message) {
    els.push({ id: el(), type: "text", _personalMessage: true, x: 33, y: Math.max(y, 56), width: 60, height: 10, text: d.custom_message, fontSize: 14, fontColor: "#6B7280", fontFamily: "optima", textAlign: "left", lineHeight: 1.2 });
  }

  els.push({ id: el(), type: "image", x: 60, y: 58, width: 30, height: 28, src: "", objectFit: "contain", placeholder: "team_logo" });

  if (d.license_number) {
    els.push({ id: el(), type: "text", x: 5, y: 85, width: 90, height: 5, text: d.license_number, fontSize: 10, fontColor: "#9CA3AF", fontFamily: "sans-serif", textAlign: "left" });
  }

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ────────────────────────────────────────────
   Template 5 — Contact Card (Minimal)
   Small photo, prominent phone, lots of whitespace
   ──────────────────────────────────────────── */
function buildContactCard(d: AgentPanelData): DesignConfig {
  reset();
  const els: DesignElement[] = [];

  if (d.photo_url) {
    els.push({ id: el(), type: "image", x: 3, y: 10, width: 22, height: 40, src: d.photo_url, objectFit: "cover" });
  }

  // Name next to photo
  if (d.name) {
    els.push({ id: el(), type: "text", x: 28, y: 12, width: 44, height: 8, text: d.name, fontSize: 22, fontWeight: "bold", fontColor: "#111827", fontFamily: "sans-serif", textAlign: "left" });
  }
  // Accent line
  els.push({ id: el(), type: "shape", x: 28, y: 22, width: 40, height: 1, shapeType: "line", shapeColor: d.brand_color, shapeBorderWidth: 2 });

  if (d.company_name) {
    els.push({ id: el(), type: "text", x: 28, y: 26, width: 44, height: 5, text: d.company_name, fontSize: 13, fontColor: "#6B7280", fontFamily: "sans-serif", textAlign: "left" });
  }
  if (d.tagline) {
    els.push({ id: el(), type: "text", x: 28, y: 33, width: 44, height: 5, text: d.tagline, fontSize: 12, fontStyle: "italic", fontColor: d.brand_color, fontFamily: "sans-serif", textAlign: "left" });
  }

  // Team logo top-right
  els.push({ id: el(), type: "image", x: 72, y: 8, width: 24, height: 30, src: "", objectFit: "contain", placeholder: "team_logo" });

  // Prominent phone centered
  if (d.phone) {
    els.push({ id: el(), type: "text", x: 3, y: 55, width: 94, height: 9, text: d.phone, fontSize: 28, fontWeight: "bold", fontColor: "#000000", fontFamily: "sans-serif", textAlign: "center" });
  }

  // Contact centered below
  const contact = [d.email, d.website].filter(Boolean).join("\n");
  if (contact) {
    els.push({ id: el(), type: "text", x: 3, y: 66, width: 94, height: 8, text: contact, fontSize: 14, fontColor: "#374151", fontFamily: "sans-serif", textAlign: "center" });
  }

  if (d.custom_message) {
    els.push({ id: el(), type: "text", _personalMessage: true, x: 5, y: 78, width: 90, height: 10, text: d.custom_message, fontSize: 14, fontColor: "#6B7280", fontFamily: "optima", textAlign: "center", lineHeight: 1.2 });
  }

  return {
    background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
    elements: els,
    disclaimer: "",
  };
}

/* ──────────────────────────────────────────── */

export const PANEL_TEMPLATES: PanelTemplate[] = [
  { key: "classic",      label: "Classic",      description: "Photo left, info right",       build: buildClassic },
  { key: "centered",     label: "Centered",     description: "Photo top, everything centered", build: buildCentered },
  { key: "photo-focus",  label: "Photo Focus",  description: "Large photo, text beside",     build: buildPhotoFocus },
  { key: "banner",       label: "Banner",       description: "Brand color header bar",       build: buildBanner },
  { key: "contact-card", label: "Contact Card", description: "Prominent phone, minimal",     build: buildContactCard },
];

/** Builds AgentPanelData from a profile object */
export function profileToTemplateData(profile: {
  first_name?: string;
  last_name?: string;
  tagline?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string;
  website?: string | null;
  license_number?: string | null;
  photo_url?: string | null;
  custom_message?: string | null;
  brand_color?: string;
}): AgentPanelData {
  return {
    name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
    tagline: profile.tagline || "",
    company_name: profile.company_name || "",
    phone: profile.phone || "",
    email: profile.email || "",
    website: profile.website || "",
    license_number: profile.license_number || "",
    photo_url: profile.photo_url || "",
    custom_message: profile.custom_message || "",
    brand_color: profile.brand_color || "#E8733A",
  };
}
