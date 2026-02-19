"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Type, ImagePlus, Trash2, Save, ArrowLeft, X, Building2, Image as ImageIcon, Copy } from "lucide-react";
import { toast } from "sonner";

/* ── Types ── */

export type FontFamilyOption =
  | "sans-serif" | "helvetica" | "verdana" | "tahoma" | "trebuchet" | "calibri" | "segoe"
  | "serif" | "georgia" | "times" | "palatino" | "garamond" | "bookman" | "cambria"
  | "courier" | "consolas" | "monaco"
  | "impact" | "century-gothic" | "futura" | "gill-sans" | "optima" | "candara" | "franklin";

const FONT_MAP: Record<FontFamilyOption, string> = {
  // Sans-serif
  "sans-serif": "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  calibri: "Calibri, 'Gill Sans', sans-serif",
  segoe: "'Segoe UI', Tahoma, sans-serif",
  // Serif
  serif: "Georgia, serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  garamond: "Garamond, serif",
  bookman: "'Bookman Old Style', Bookman, serif",
  cambria: "Cambria, Georgia, serif",
  // Monospace
  courier: "'Courier New', Courier, monospace",
  consolas: "Consolas, 'Courier New', monospace",
  monaco: "Monaco, 'Courier New', monospace",
  // Display
  impact: "Impact, 'Arial Black', sans-serif",
  "century-gothic": "'Century Gothic', 'Apple Gothic', sans-serif",
  futura: "Futura, 'Century Gothic', sans-serif",
  "gill-sans": "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  optima: "Optima, 'Segoe UI', sans-serif",
  candara: "Candara, Calibri, sans-serif",
  franklin: "'Franklin Gothic Medium', 'Franklin Gothic', sans-serif",
};

export interface DesignElement {
  id: string;
  type: "text" | "image";
  x: number; // % from left
  y: number; // % from top
  width: number; // % of canvas
  height: number; // % of canvas (images only; text auto-heights)
  // text
  text?: string;
  fontSize?: number; // design-px at 675px canvas width
  fontColor?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  fontFamily?: FontFamilyOption;
  lineHeight?: number; // multiplier, e.g. 1.2
  letterSpacing?: number; // px at design scale
  textTransform?: "none" | "uppercase" | "lowercase";
  opacity?: number; // 0-1
  // image
  src?: string;
  objectFit?: "contain" | "cover";
  tintColor?: string; // recolor SVG icons/logos
  placeholder?: "team_logo"; // agent's uploaded logo replaces this at render time
}

export interface DisclaimerStyle {
  fontSize: number;
  color: string;
  fontFamily: FontFamilyOption;
}

export interface DesignConfig {
  background: {
    color: string;
    imageUrl: string;
    overlayColor: string;
    colorEnabled?: boolean; // false = no color/overlay, full image
  };
  elements: DesignElement[];
  disclaimer: string;
  disclaimerStyle?: DisclaimerStyle;
}

export interface BrokerageOption {
  id: string;
  name: string;
}

interface TemplateDesignerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  brokerages?: BrokerageOption[];
  /** "admin" (default) = full template editor; "agent" = bottom-left panel only */
  mode?: "admin" | "agent";
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    season?: string;
    type?: "brokerage" | "monthly";
    brokerage_id?: string | null;
    design?: DesignConfig;
    frontDesign?: DesignConfig;
  };
}

const DEFAULT_FRONT_DESIGN: DesignConfig = {
  background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)", colorEnabled: false },
  elements: [],
  disclaimer: "",
};

const DEFAULT_BACK_DESIGN: DesignConfig = {
  background: { color: "#1B3A5C", imageUrl: "", overlayColor: "rgba(0,0,0,0.3)", colorEnabled: true },
  elements: [],
  disclaimer: "Each office is independently owned and operated.",
  disclaimerStyle: { fontSize: 8, color: "rgba(255,255,255,0.55)", fontFamily: "sans-serif" },
};

/* ── Helpers ── */

let _nextId = 1;
function genId() {
  return `el_${Date.now()}_${_nextId++}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Re-encode an SVG data URI with a different fill/stroke color */
export function recolorSvgDataUri(dataUri: string, color: string): string {
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

/* ── Component ── */

export function TemplateDesigner({ open, onClose, onSubmit, brokerages, mode = "admin", initialData }: TemplateDesignerProps) {
  const isAgent = mode === "agent";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Metadata
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [season, setSeason] = useState(initialData?.season || "any");
  const [templateType, setTemplateType] = useState<"brokerage" | "monthly">(initialData?.type || "brokerage");
  const [brokerageId, setBrokerageId] = useState<string>(initialData?.brokerage_id || "none");

  // Front/Back tab (monthly templates only)
  const [activeTab, setActiveTab] = useState<"front" | "back">("back");
  const isMonthly = templateType === "monthly";

  // Back design state (existing — the brokerage panel or back of postcard)
  const [bgColor, setBgColor] = useState(initialData?.design?.background.color || "#1B3A5C");
  const [bgImage, setBgImage] = useState(initialData?.design?.background.imageUrl || "");
  const [overlayColor, setOverlayColor] = useState(initialData?.design?.background.overlayColor || "rgba(0,0,0,0.3)");
  const [colorEnabled, setColorEnabled] = useState(initialData?.design?.background.colorEnabled !== false);
  const [elements, setElements] = useState<DesignElement[]>(initialData?.design?.elements || []);
  const [disclaimer, setDisclaimer] = useState(initialData?.design?.disclaimer || "Each office is independently owned and operated.");
  const [disclaimerFontSize, setDisclaimerFontSize] = useState(initialData?.design?.disclaimerStyle?.fontSize || 8);
  const [disclaimerColor, setDisclaimerColor] = useState(initialData?.design?.disclaimerStyle?.color || "rgba(255,255,255,0.55)");
  const [disclaimerFont, setDisclaimerFont] = useState<FontFamilyOption>(initialData?.design?.disclaimerStyle?.fontFamily || "sans-serif");

  // Front design state (monthly templates — the front face of the 6x9 postcard)
  const initFront = initialData?.frontDesign || DEFAULT_FRONT_DESIGN;
  const [frontBgColor, setFrontBgColor] = useState(initFront.background.color);
  const [frontBgImage, setFrontBgImage] = useState(initFront.background.imageUrl);
  const [frontOverlayColor, setFrontOverlayColor] = useState(initFront.background.overlayColor);
  const [frontColorEnabled, setFrontColorEnabled] = useState(initFront.background.colorEnabled !== false);
  const [frontElements, setFrontElements] = useState<DesignElement[]>(initFront.elements || []);

  // Active design: route to front or back state based on activeTab
  const isFront = activeTab === "front" && isMonthly;
  const curBgColor = isFront ? frontBgColor : bgColor;
  const setCurBgColor = isFront ? setFrontBgColor : setBgColor;
  const curBgImage = isFront ? frontBgImage : bgImage;
  const setCurBgImage = isFront ? setFrontBgImage : setBgImage;
  const curOverlayColor = isFront ? frontOverlayColor : overlayColor;
  const setCurOverlayColor = isFront ? setFrontOverlayColor : setOverlayColor;
  const curColorEnabled = isFront ? frontColorEnabled : colorEnabled;
  const setCurColorEnabled = isFront ? setFrontColorEnabled : setColorEnabled;
  const curElements = isFront ? frontElements : elements;
  const setCurElements = isFront ? setFrontElements : setElements;

  // Canvas design basis: front = 900px (full 6x9), back = 675px (4.5" panel)
  const designBasis = isFront ? 900 : 675;

  // Interaction
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null);
  const [scale, setScale] = useState(1);

  const selected = curElements.find((el) => el.id === selectedId) || null;

  // Keep scale in sync with canvas width
  useEffect(() => {
    function sync() {
      if (canvasRef.current) setScale(canvasRef.current.offsetWidth / designBasis);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [open, activeTab, designBasis]);

  // Reset state when initialData changes
  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setSeason(initialData?.season || "any");
    setTemplateType(initialData?.type || "brokerage");
    setBrokerageId(initialData?.brokerage_id || "none");
    setActiveTab(initialData?.type === "monthly" ? "front" : "back");
    // Back design
    setBgColor(initialData?.design?.background.color || "#1B3A5C");
    setBgImage(initialData?.design?.background.imageUrl || "");
    setOverlayColor(initialData?.design?.background.overlayColor || "rgba(0,0,0,0.3)");
    setColorEnabled(initialData?.design?.background.colorEnabled !== false);
    setElements(initialData?.design?.elements || []);
    setDisclaimer(initialData?.design?.disclaimer || "Each office is independently owned and operated.");
    setDisclaimerFontSize(initialData?.design?.disclaimerStyle?.fontSize || 8);
    setDisclaimerColor(initialData?.design?.disclaimerStyle?.color || "rgba(255,255,255,0.55)");
    setDisclaimerFont(initialData?.design?.disclaimerStyle?.fontFamily || "sans-serif");
    // Front design
    const fd = initialData?.frontDesign || DEFAULT_FRONT_DESIGN;
    setFrontBgColor(fd.background.color);
    setFrontBgImage(fd.background.imageUrl);
    setFrontOverlayColor(fd.background.overlayColor);
    setFrontColorEnabled(fd.background.colorEnabled !== false);
    setFrontElements(fd.elements || []);
    setSelectedId(null);
  }, [initialData]);

  /* ── Canvas helpers ── */

  const canvasPos = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  }, []);

  /* ── Drag ── */

  const onElDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = canvasPos(e);
    const el = curElements.find((x) => x.id === id);
    if (!el) return;
    setDragging({ id, offsetX: pos.x - el.x, offsetY: pos.y - el.y });
    setSelectedId(id);
  }, [curElements, canvasPos]);

  const onResizeDown = useCallback((e: React.MouseEvent, id: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = canvasPos(e);
    const el = curElements.find((x) => x.id === id);
    if (!el) return;
    setResizing({ id, startX: pos.x, startY: pos.y, startW: el.width, startH: el.height, corner });
    setSelectedId(id);
  }, [curElements, canvasPos]);

  const onCanvasMove = useCallback((e: React.MouseEvent) => {
    if (resizing) {
      const pos = canvasPos(e);
      const dx = pos.x - resizing.startX;
      const dy = pos.y - resizing.startY;
      setCurElements((prev) =>
        prev.map((el) => {
          if (el.id !== resizing.id) return el;
          const newW = Math.max(2, Math.min(100, resizing.startW + dx));
          if (el.type === "text") return { ...el, width: +newW.toFixed(1) };
          const newH = Math.max(2, Math.min(100, resizing.startH + dy));
          return { ...el, width: +newW.toFixed(1), height: +newH.toFixed(1) };
        })
      );
      return;
    }
    if (!dragging) return;
    const pos = canvasPos(e);
    setCurElements((prev) =>
      prev.map((el) =>
        el.id === dragging.id
          ? {
              ...el,
              x: Math.max(0, Math.min(100 - el.width, pos.x - dragging.offsetX)),
              y: Math.max(0, Math.min(95, pos.y - dragging.offsetY)),
            }
          : el
      )
    );
  }, [dragging, resizing, canvasPos]);

  const onCanvasUp = useCallback(() => { setDragging(null); setResizing(null); }, []);

  /* ── Element CRUD ── */

  function addText() {
    const el: DesignElement = {
      id: genId(), type: "text", x: 10, y: 10, width: 40, height: 10,
      text: "New text", fontSize: 18, fontColor: "#FFFFFF",
      fontWeight: "normal", fontStyle: "normal", textAlign: "left", fontFamily: "sans-serif",
    };
    setCurElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  async function addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const b64 = await fileToBase64(file);
        const ext = file.name.split(".").pop() || "png";
        const res = await fetch(uploadEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: b64, ext, contentType: file.type }),
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        // Auto-fit height from image ratio
        const img = new window.Image();
        img.onload = () => {
          const canvasW = canvasRef.current?.offsetWidth || 675;
          const canvasH = canvasRef.current?.offsetHeight || 450;
          const elPxW = (30 / 100) * canvasW;
          const fittedPxH = elPxW * (img.naturalHeight / img.naturalWidth);
          const fittedPct = +((fittedPxH / canvasH) * 100).toFixed(1);
          const el: DesignElement = {
            id: genId(), type: "image", x: 10, y: 10, width: 30, height: Math.max(2, Math.min(80, fittedPct)), src: url, objectFit: "contain",
          };
          setCurElements((p) => [...p, el]);
          setSelectedId(el.id);
        };
        img.onerror = () => {
          const el: DesignElement = {
            id: genId(), type: "image", x: 10, y: 10, width: 30, height: 20, src: url, objectFit: "contain",
          };
          setCurElements((p) => [...p, el]);
          setSelectedId(el.id);
        };
        img.src = url;
        toast.success("Image added");
      } catch {
        toast.error("Failed to upload image");
      }
    };
    input.click();
  }

  function deleteEl(id: string) {
    setCurElements((p) => p.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateEl(id: string, u: Partial<DesignElement>) {
    setCurElements((p) => p.map((el) => (el.id === id ? { ...el, ...u } : el)));
  }

  function fitImageHeight(id: string) {
    const el = curElements.find((e) => e.id === id);
    if (!el || el.type !== "image" || !el.src || !canvasRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      const canvasW = canvasRef.current!.offsetWidth;
      const canvasH = canvasRef.current!.offsetHeight;
      const elPxW = (el.width / 100) * canvasW;
      const imgRatio = img.naturalHeight / img.naturalWidth;
      const fittedPxH = elPxW * imgRatio;
      const fittedPct = +(((fittedPxH / canvasH) * 100).toFixed(1));
      updateEl(id, { height: Math.max(2, Math.min(100, fittedPct)) });
    };
    img.src = el.src;
  }

  function duplicateEl(id: string) {
    const src = curElements.find((el) => el.id === id);
    if (!src) return;
    const clone: DesignElement = { ...src, id: genId(), x: Math.min(src.x + 3, 90), y: Math.min(src.y + 3, 90) };
    setCurElements((p) => [...p, clone]);
    setSelectedId(clone.id);
  }

  /* ── Upload helper ── */

  const uploadEndpoint = isAgent ? "/api/profile/design-upload" : "/api/admin/templates/upload";

  async function uploadFile(file: File): Promise<string> {
    const b64 = await fileToBase64(file);
    const ext = file.name.split(".").pop() || "png";
    const res = await fetch(uploadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64: b64, ext, contentType: file.type }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }
    const { url } = await res.json();
    return url;
  }

  function pickFile(accept: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = () => resolve(input.files?.[0] || null);
      input.click();
    });
  }

  /* ── Brokerage Logo (adds as draggable image element) ── */

  async function addBrokerageLogo() {
    const file = await pickFile("image/png,image/jpeg,image/webp,image/svg+xml");
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      // Auto-calculate height from image aspect ratio
      const img = new window.Image();
      img.onload = () => {
        const canvasW = canvasRef.current?.offsetWidth || 675;
        const canvasH = canvasRef.current?.offsetHeight || 450;
        const elPxW = (35 / 100) * canvasW;
        const imgRatio = img.naturalHeight / img.naturalWidth;
        const fittedPxH = elPxW * imgRatio;
        const fittedPct = +((fittedPxH / canvasH) * 100).toFixed(1);
        const el: DesignElement = {
          id: genId(), type: "image", x: 5, y: 5, width: 35, height: Math.max(2, Math.min(80, fittedPct)), src: url, objectFit: "contain",
        };
        setCurElements((p) => [...p, el]);
        setSelectedId(el.id);
      };
      img.onerror = () => {
        const el: DesignElement = {
          id: genId(), type: "image", x: 5, y: 5, width: 35, height: 15, src: url, objectFit: "contain",
        };
        setCurElements((p) => [...p, el]);
        setSelectedId(el.id);
      };
      img.src = url;
      toast.success("Team logo added — drag to position");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  /* ── Background Banner (sets as canvas background image) ── */

  async function addBackgroundBanner() {
    const file = await pickFile("image/*");
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadFile(file);
      setCurBgImage(url);
      toast.success("Background banner set");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  /* ── Social media icons (inline SVG data URIs) ── */

  const SOCIAL_ICONS: Record<string, string> = {
    Facebook: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'),
    Instagram: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>'),
    YouTube: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'),
    LinkedIn: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'),
    TikTok: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>'),
    X: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'),
    Zillow: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.5h-11v-1.5l7.5-8H6.5V6.5h11v1.5l-7.5 8H17.5v1.5z"/></svg>'),
    Realtor: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7v2h20V7L12 2zm-8 9v9h4v-6h8v6h4v-9H4z"/></svg>'),
  };

  function addSocialIcon(name: string) {
    const src = SOCIAL_ICONS[name];
    if (!src) return;
    const existingIcons = curElements.filter((e) => e.type === "image" && e.y >= 65 && e.width <= 10).length;
    const el: DesignElement = {
      id: genId(), type: "image", x: 5 + existingIcons * 8, y: 70, width: 6, height: 8, src, objectFit: "contain",
    };
    setCurElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  /* ── Real estate / NAR logos ── */

  const RE_LOGOS: Record<string, string> = {
    "NAR": "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="white"><text x="50" y="55" font-family="Arial,sans-serif" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle">NAR</text><rect x="10" y="15" width="80" height="70" rx="8" fill="none" stroke="white" stroke-width="4"/></svg>'),
    "Realtor®": "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" fill="white"><rect x="2" y="2" width="116" height="56" rx="4" fill="none" stroke="white" stroke-width="3"/><text x="60" y="35" font-family="Arial,sans-serif" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle">REALTOR®</text></svg>'),
    "Equal Housing": "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="white"><path d="M32 4L4 28h8v28h40V28h8L32 4zm-12 44V30h24v18H20z"/><rect x="22" y="42" width="20" height="2"/><rect x="22" y="36" width="20" height="2"/></svg>'),
    "MLS": "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" fill="white"><rect x="2" y="2" width="96" height="56" rx="6" fill="none" stroke="white" stroke-width="3"/><text x="50" y="35" font-family="Arial,sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">MLS</text></svg>'),
    "Fair Housing": "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="white"><path d="M32 2L2 26h10v34h40V26h10L32 2z"/><text x="32" y="42" font-family="Arial,sans-serif" font-size="8" font-weight="bold" text-anchor="middle" dominant-baseline="middle">FAIR</text><text x="32" y="52" font-family="Arial,sans-serif" font-size="6" text-anchor="middle" dominant-baseline="middle">HOUSING</text></svg>'),
  };

  function addRELogo(name: string) {
    const src = RE_LOGOS[name];
    if (!src) return;
    const el: DesignElement = {
      id: genId(), type: "image", x: 60, y: 75, width: 12, height: 15, src, objectFit: "contain",
    };
    setCurElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  /* ── Generic background image upload (sidebar) ── */

  async function uploadBg() {
    const file = await pickFile("image/*");
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setCurBgImage(url);
      toast.success("Background uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload background");
    }
  }

  /* ── Save ── */

  async function handleSave() {
    if (!isAgent && !name.trim()) { toast.error("Enter a template name"); return; }
    setSaving(true);
    try {
      const backDesign: DesignConfig = {
        background: { color: bgColor, imageUrl: bgImage, overlayColor, colorEnabled },
        elements,
        disclaimer,
        disclaimerStyle: { fontSize: disclaimerFontSize, color: disclaimerColor, fontFamily: disclaimerFont },
      };
      const frontDesign: DesignConfig = {
        background: { color: frontBgColor, imageUrl: frontBgImage, overlayColor: frontOverlayColor, colorEnabled: frontColorEnabled },
        elements: frontElements,
        disclaimer: "",
      };
      if (isAgent) {
        await onSubmit({ design: backDesign });
      } else {
        await onSubmit({
          ...(initialData?.id ? { id: initialData.id } : {}),
          name,
          description: description || null,
          size: "6x9",
          season,
          type: templateType,
          brokerage_id: templateType === "brokerage" && brokerageId && brokerageId !== "none" ? brokerageId : null,
          front_html: isMonthly ? JSON.stringify(frontDesign) : "",
          back_html: JSON.stringify(backDesign),
        });
      }
      onClose();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 border-b px-4 py-2.5 shrink-0 bg-white">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-border" />
        {isAgent ? (
          <>
            <span className="text-sm font-medium">Customize Your Panel</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Bottom-left · 4.5&quot; × 3&quot;</span>
          </>
        ) : (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name..."
              className="max-w-[200px] h-8 text-sm"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="max-w-[180px] h-8 text-sm"
            />
            <Select value={templateType} onValueChange={(v) => setTemplateType(v as "brokerage" | "monthly")}>
              <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="brokerage">Brokerage</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {templateType === "brokerage" && brokerages && brokerages.length > 0 && (
              <Select value={brokerageId} onValueChange={setBrokerageId}>
                <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="Link to brokerage..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific brokerage</SelectItem>
                  {brokerages.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isMonthly && (
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1 text-xs font-medium transition-colors ${activeTab === "front" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => { setActiveTab("front"); setSelectedId(null); setEditingId(null); }}
                >
                  Front
                </button>
                <button
                  className={`px-3 py-1 text-xs font-medium transition-colors border-l ${activeTab === "back" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => { setActiveTab("back"); setSelectedId(null); setEditingId(null); }}
                >
                  Back
                </button>
              </div>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {isMonthly
                ? (isFront ? "Front face · 6\" × 9\"" : "Back panel · 4.5\" × 3\"")
                : "Top-right panel · 4.5\" × 3\""}
            </span>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="fall">Fall</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-5 w-px bg-border" />
            <Button variant="outline" size="sm" onClick={addBrokerageLogo} disabled={uploadingLogo}>
              {uploadingLogo ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Building2 className="mr-1.5 h-4 w-4" />}
              Team Logo
            </Button>
            <Button variant="outline" size="sm" onClick={addBackgroundBanner} disabled={uploadingBanner}>
              {uploadingBanner ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1.5 h-4 w-4" />}
              Background Banner
            </Button>
          </>
        )}
        <div className="ml-auto">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area — live preview */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 bg-muted/30 overflow-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {isMonthly ? (isFront ? "Front — Live Preview" : "Back Panel — Live Preview") : "Live Preview"}
          </p>
          <div
            ref={canvasRef}
            className="relative rounded-lg shadow-xl overflow-hidden select-none border"
            style={{ aspectRatio: "3/2", width: isFront ? "clamp(400px, 65vw, 900px)" : "clamp(400px, 60vw, 675px)", backgroundColor: curColorEnabled ? curBgColor : "#f0f0f0" }}
            onMouseMove={onCanvasMove}
            onMouseUp={onCanvasUp}
            onMouseLeave={onCanvasUp}
            onClick={() => { setSelectedId(null); setEditingId(null); }}
          >
            {/* Bg image */}
            {curBgImage && (
              <img src={curBgImage} alt="" className="absolute inset-0 h-full w-full object-cover pointer-events-none" style={{ opacity: curColorEnabled ? 0.3 : 1 }} />
            )}
            {/* Overlay (only when color enabled) */}
            {curColorEnabled && (
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: curOverlayColor }} />
            )}

            {/* Elements */}
            {curElements.map((el) => {
              const isEditing = editingId === el.id;
              const textStyle: React.CSSProperties = el.type === "text" ? {
                fontSize: `${(el.fontSize || 16) * scale}px`,
                color: el.fontColor || "#fff",
                fontWeight: el.fontWeight || "normal",
                fontStyle: el.fontStyle || "normal",
                textAlign: el.textAlign || "left",
                fontFamily: FONT_MAP[el.fontFamily || "sans-serif"],
                lineHeight: el.lineHeight || 1.3,
                letterSpacing: el.letterSpacing ? `${el.letterSpacing * scale}px` : undefined,
                textTransform: el.textTransform || "none",
              } : {};

              return (
                <div
                  key={el.id}
                  className={`absolute transition-shadow ${
                    isEditing ? "ring-2 ring-green-500" :
                    selectedId === el.id
                      ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent cursor-move"
                      : el.placeholder ? "ring-1 ring-dashed ring-emerald-400 hover:ring-emerald-500 cursor-move" : "hover:ring-1 hover:ring-blue-300 cursor-move"
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: el.type === "image" ? `${el.height}%` : "auto",
                    opacity: el.opacity ?? 1,
                  }}
                  onMouseDown={(e) => { if (!isEditing) onElDown(e, el.id); }}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                  onDoubleClick={(e) => {
                    if (el.type === "text") {
                      e.stopPropagation();
                      setEditingId(el.id);
                    }
                  }}
                >
                  {el.type === "text" && !isEditing && (
                    <p
                      className="w-full break-words whitespace-pre-wrap pointer-events-none"
                      style={textStyle}
                    >
                      {el.text}
                    </p>
                  )}
                  {el.type === "text" && isEditing && (
                    <textarea
                      autoFocus
                      className="w-full bg-transparent border-none outline-none resize-none break-words whitespace-pre-wrap"
                      style={{ ...textStyle, minHeight: "1.5em" }}
                      value={el.text || ""}
                      onChange={(e) => updateEl(el.id, { text: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  )}
                  {el.type === "image" && el.src && (
                    <img
                      src={el.tintColor && el.src.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(el.src, el.tintColor) : el.src}
                      alt=""
                      className="w-full h-full pointer-events-none"
                      style={{ objectFit: el.objectFit || "contain" }}
                    />
                  )}
                  {/* Placeholder badge */}
                  {el.placeholder === "team_logo" && (
                    <div className="absolute -top-3 left-0 bg-emerald-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none pointer-events-none whitespace-nowrap">
                      TEAM LOGO
                    </div>
                  )}
                  {/* Resize handle */}
                  {selectedId === el.id && !isEditing && (
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize border border-white shadow"
                      onMouseDown={(e) => onResizeDown(e, el.id, "se")}
                    />
                  )}
                </div>
              );
            })}

            {/* Disclaimer (admin only) */}
            {!isAgent && disclaimer && (
              <div className="absolute bottom-0 left-0 right-0 px-[15%] py-2 pointer-events-none">
                <p className="leading-tight text-center" style={{
                  fontSize: `${disclaimerFontSize * scale}px`,
                  color: disclaimerColor,
                  fontFamily: FONT_MAP[disclaimerFont],
                }}>
                  {disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-72 border-l bg-white overflow-y-auto p-4 space-y-5 shrink-0">
          {/* Add elements */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={addText}>
                <Type className="mr-1.5 h-3.5 w-3.5" /> Text
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={addImage}>
                <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Image
              </Button>
            </div>
          </div>

          {/* Social media icons (admin only) */}
          {!isAgent && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Social Icons</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(SOCIAL_ICONS).map((name) => (
                <button
                  key={name}
                  className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] hover:bg-muted transition-colors"
                  onClick={() => addSocialIcon(name)}
                  title={`Add ${name} icon`}
                >
                  <img src={SOCIAL_ICONS[name]} alt="" className="h-3.5 w-3.5 invert" />
                  {name}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Real estate logos (admin only) */}
          {!isAgent && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Real Estate Logos</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(RE_LOGOS).map((name) => (
                <button
                  key={name}
                  className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] hover:bg-muted transition-colors"
                  onClick={() => addRELogo(name)}
                  title={`Add ${name}`}
                >
                  <img src={RE_LOGOS[name]} alt="" className="h-3.5 w-3.5 invert" />
                  {name}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Background */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Background</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={curColorEnabled} onChange={(e) => setCurColorEnabled(e.target.checked)} className="rounded" />
              <span className="text-xs">Color tint &amp; overlay</span>
            </label>
            {curColorEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={curBgColor} onChange={(e) => setCurBgColor(e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                  <Input value={curBgColor} onChange={(e) => setCurBgColor(e.target.value)} className="flex-1 text-xs h-8" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Image</Label>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={uploadBg}>
                <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                {curBgImage ? "Replace" : "Upload"}
              </Button>
              {curBgImage && (
                <div className="relative">
                  <img src={curBgImage} alt="" className="h-14 w-full object-cover rounded border" />
                  <Button variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5" onClick={() => setCurBgImage("")}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            {curColorEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay</Label>
                <Input value={curOverlayColor} onChange={(e) => setCurOverlayColor(e.target.value)} placeholder="rgba(0,0,0,0.3)" className="text-xs h-8" />
              </div>
            )}
          </div>

          {/* Selected element properties */}
          {selected && (
            <div className="space-y-3 rounded-lg border p-3 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {selected.type === "text" ? "Text" : "Image"}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Duplicate" onClick={() => duplicateEl(selected.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteEl(selected.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Position & size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">X %</Label>
                  <Input type="number" value={Math.round(selected.x)} onChange={(e) => updateEl(selected.id, { x: +e.target.value })} className="text-xs h-7" min={0} max={100} />
                </div>
                <div>
                  <Label className="text-[10px]">Y %</Label>
                  <Input type="number" value={Math.round(selected.y)} onChange={(e) => updateEl(selected.id, { y: +e.target.value })} className="text-xs h-7" min={0} max={100} />
                </div>
                <div>
                  <Label className="text-[10px]">Width %</Label>
                  <Input type="number" step={0.5} value={selected.width} onChange={(e) => updateEl(selected.id, { width: +e.target.value })} className="text-xs h-7" min={2} max={100} />
                </div>
                {selected.type === "image" && (
                  <div>
                    <Label className="text-[10px]">Height %</Label>
                    <Input type="number" step={0.5} value={selected.height} onChange={(e) => updateEl(selected.id, { height: +e.target.value })} className="text-xs h-7" min={2} max={100} />
                  </div>
                )}
              </div>

              {/* Fit to image button */}
              {selected.type === "image" && (
                <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => fitImageHeight(selected.id)}>
                  Fit height to image ratio
                </Button>
              )}

              {/* Opacity (all elements) */}
              <div>
                <Label className="text-[10px]">Opacity</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={selected.opacity ?? 1}
                    onChange={(e) => updateEl(selected.id, { opacity: +e.target.value })}
                    className="flex-1 h-1.5 accent-blue-500"
                  />
                  <span className="text-[10px] w-8 text-right text-muted-foreground">{Math.round((selected.opacity ?? 1) * 100)}%</span>
                </div>
              </div>

              {/* Text props */}
              {selected.type === "text" && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[10px]">Content</Label>
                      <span className="text-[10px] text-muted-foreground">Double-click to edit on canvas</span>
                    </div>
                    <Textarea value={selected.text || ""} onChange={(e) => updateEl(selected.id, { text: e.target.value })} rows={3} className="text-xs" />
                  </div>

                  {/* Font family */}
                  <div>
                    <Label className="text-[10px]">Font</Label>
                    <Select value={selected.fontFamily || "sans-serif"} onValueChange={(v) => updateEl(selected.id, { fontFamily: v as FontFamilyOption })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {/* Sans-serif */}
                        <SelectItem value="sans-serif"><span style={{ fontFamily: "Arial, sans-serif" }}>Arial</span></SelectItem>
                        <SelectItem value="helvetica"><span style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>Helvetica</span></SelectItem>
                        <SelectItem value="verdana"><span style={{ fontFamily: "Verdana, sans-serif" }}>Verdana</span></SelectItem>
                        <SelectItem value="tahoma"><span style={{ fontFamily: "Tahoma, sans-serif" }}>Tahoma</span></SelectItem>
                        <SelectItem value="trebuchet"><span style={{ fontFamily: "'Trebuchet MS', sans-serif" }}>Trebuchet MS</span></SelectItem>
                        <SelectItem value="calibri"><span style={{ fontFamily: "Calibri, sans-serif" }}>Calibri</span></SelectItem>
                        <SelectItem value="segoe"><span style={{ fontFamily: "'Segoe UI', sans-serif" }}>Segoe UI</span></SelectItem>
                        {/* Serif */}
                        <SelectItem value="georgia"><span style={{ fontFamily: "Georgia, serif" }}>Georgia</span></SelectItem>
                        <SelectItem value="times"><span style={{ fontFamily: "'Times New Roman', serif" }}>Times New Roman</span></SelectItem>
                        <SelectItem value="palatino"><span style={{ fontFamily: "'Palatino Linotype', serif" }}>Palatino</span></SelectItem>
                        <SelectItem value="garamond"><span style={{ fontFamily: "Garamond, serif" }}>Garamond</span></SelectItem>
                        <SelectItem value="bookman"><span style={{ fontFamily: "'Bookman Old Style', serif" }}>Bookman</span></SelectItem>
                        <SelectItem value="cambria"><span style={{ fontFamily: "Cambria, serif" }}>Cambria</span></SelectItem>
                        {/* Monospace */}
                        <SelectItem value="courier"><span style={{ fontFamily: "'Courier New', monospace" }}>Courier New</span></SelectItem>
                        <SelectItem value="consolas"><span style={{ fontFamily: "Consolas, monospace" }}>Consolas</span></SelectItem>
                        <SelectItem value="monaco"><span style={{ fontFamily: "Monaco, monospace" }}>Monaco</span></SelectItem>
                        {/* Display */}
                        <SelectItem value="impact"><span style={{ fontFamily: "Impact, sans-serif" }}>Impact</span></SelectItem>
                        <SelectItem value="century-gothic"><span style={{ fontFamily: "'Century Gothic', sans-serif" }}>Century Gothic</span></SelectItem>
                        <SelectItem value="futura"><span style={{ fontFamily: "Futura, sans-serif" }}>Futura</span></SelectItem>
                        <SelectItem value="gill-sans"><span style={{ fontFamily: "'Gill Sans', sans-serif" }}>Gill Sans</span></SelectItem>
                        <SelectItem value="optima"><span style={{ fontFamily: "Optima, sans-serif" }}>Optima</span></SelectItem>
                        <SelectItem value="candara"><span style={{ fontFamily: "Candara, sans-serif" }}>Candara</span></SelectItem>
                        <SelectItem value="franklin"><span style={{ fontFamily: "'Franklin Gothic Medium', sans-serif" }}>Franklin Gothic</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size + Color row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Size</Label>
                      <div className="flex gap-1">
                        <Input type="number" value={selected.fontSize || 16} onChange={(e) => updateEl(selected.id, { fontSize: +e.target.value })} className="text-xs h-7 w-14" min={6} max={120} />
                        <div className="flex gap-0.5">
                          {[12, 18, 24, 36, 48].map((s) => (
                            <button
                              key={s}
                              className={`text-[9px] px-1 h-7 rounded border ${selected.fontSize === s ? "bg-blue-100 border-blue-300" : "hover:bg-muted border-transparent"}`}
                              onClick={() => updateEl(selected.id, { fontSize: s })}
                            >{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px]">Color</Label>
                      <div className="flex gap-1">
                        <input type="color" value={selected.fontColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { fontColor: e.target.value })} className="h-7 w-7 rounded border cursor-pointer" />
                        <Input value={selected.fontColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { fontColor: e.target.value })} className="flex-1 text-xs h-7" />
                      </div>
                    </div>
                  </div>

                  {/* Style toggles: B I U Aa */}
                  <div className="grid grid-cols-4 gap-1">
                    <Button
                      variant={selected.fontWeight === "bold" ? "default" : "outline"}
                      size="sm" className="text-xs h-7 font-bold"
                      onClick={() => updateEl(selected.id, { fontWeight: selected.fontWeight === "bold" ? "normal" : "bold" })}
                    >B</Button>
                    <Button
                      variant={selected.fontStyle === "italic" ? "default" : "outline"}
                      size="sm" className="text-xs h-7 italic"
                      onClick={() => updateEl(selected.id, { fontStyle: selected.fontStyle === "italic" ? "normal" : "italic" })}
                    >I</Button>
                    <Button
                      variant={selected.textTransform === "uppercase" ? "default" : "outline"}
                      size="sm" className="text-xs h-7"
                      title="Uppercase"
                      onClick={() => updateEl(selected.id, { textTransform: selected.textTransform === "uppercase" ? "none" : "uppercase" })}
                    >AA</Button>
                    <Button
                      variant={selected.textTransform === "lowercase" ? "default" : "outline"}
                      size="sm" className="text-xs h-7"
                      title="Lowercase"
                      onClick={() => updateEl(selected.id, { textTransform: selected.textTransform === "lowercase" ? "none" : "lowercase" })}
                    >aa</Button>
                  </div>

                  {/* Alignment */}
                  <div className="grid grid-cols-3 gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <Button
                        key={a}
                        variant={selected.textAlign === a ? "default" : "outline"}
                        size="sm" className="text-xs h-7 capitalize"
                        onClick={() => updateEl(selected.id, { textAlign: a })}
                      >{a}</Button>
                    ))}
                  </div>

                  {/* Line height + Letter spacing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Line Height</Label>
                      <div className="flex items-center gap-1">
                        <input
                          type="range" min={0.8} max={2.5} step={0.1}
                          value={selected.lineHeight || 1.3}
                          onChange={(e) => updateEl(selected.id, { lineHeight: +e.target.value })}
                          className="flex-1 h-1.5 accent-blue-500"
                        />
                        <span className="text-[10px] w-6 text-right text-muted-foreground">{(selected.lineHeight || 1.3).toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px]">Spacing</Label>
                      <div className="flex items-center gap-1">
                        <input
                          type="range" min={-1} max={8} step={0.5}
                          value={selected.letterSpacing || 0}
                          onChange={(e) => updateEl(selected.id, { letterSpacing: +e.target.value })}
                          className="flex-1 h-1.5 accent-blue-500"
                        />
                        <span className="text-[10px] w-6 text-right text-muted-foreground">{(selected.letterSpacing || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Image props */}
              {selected.type === "image" && (
                <>
                  <div className="grid grid-cols-2 gap-1">
                    <Button variant={selected.objectFit === "contain" ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => updateEl(selected.id, { objectFit: "contain" })}>
                      Contain
                    </Button>
                    <Button variant={selected.objectFit === "cover" ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => updateEl(selected.id, { objectFit: "cover" })}>
                      Cover
                    </Button>
                  </div>
                  {/* Tint color for SVG icons/logos */}
                  {selected.src?.startsWith("data:image/svg+xml,") && (
                    <div>
                      <Label className="text-[10px]">Icon Color</Label>
                      <div className="flex gap-1">
                        <input type="color" value={selected.tintColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { tintColor: e.target.value })} className="h-7 w-7 rounded border cursor-pointer" />
                        <Input value={selected.tintColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { tintColor: e.target.value })} className="flex-1 text-xs h-7" />
                        {selected.tintColor && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Reset to white" onClick={() => updateEl(selected.id, { tintColor: undefined })}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Team logo placeholder toggle (admin only) */}
                  {!isAgent && (
                  <label className="flex items-center gap-2 cursor-pointer rounded border p-2 hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.placeholder === "team_logo"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Clear any existing team_logo placeholder first
                          setCurElements((prev) => prev.map((el) =>
                            el.id === selected.id
                              ? { ...el, placeholder: "team_logo" as const }
                              : el.placeholder === "team_logo" ? { ...el, placeholder: undefined } : el
                          ));
                        } else {
                          updateEl(selected.id, { placeholder: undefined });
                        }
                      }}
                      className="rounded"
                    />
                    <div>
                      <span className="text-xs font-medium">Team Logo Spot</span>
                      <p className="text-[10px] text-muted-foreground">Agent&apos;s uploaded logo replaces this</p>
                    </div>
                  </label>
                  )}
                </>
              )}
            </div>
          )}

          {/* Disclaimer (admin only) */}
          {!isAgent && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disclaimer</p>
            <Textarea
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="Each office is independently owned..."
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Size</Label>
                <Input type="number" value={disclaimerFontSize} onChange={(e) => setDisclaimerFontSize(+e.target.value)} className="text-xs h-7" min={4} max={24} />
              </div>
              <div>
                <Label className="text-[10px]">Color</Label>
                <div className="flex gap-1">
                  <input type="color" value={disclaimerColor.startsWith("#") ? disclaimerColor : "#ffffff"} onChange={(e) => setDisclaimerColor(e.target.value)} className="h-7 w-7 rounded border cursor-pointer" />
                  <Input value={disclaimerColor} onChange={(e) => setDisclaimerColor(e.target.value)} className="flex-1 text-xs h-7" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Font</Label>
              <Select value={disclaimerFont} onValueChange={(v) => setDisclaimerFont(v as FontFamilyOption)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="sans-serif">Arial</SelectItem>
                  <SelectItem value="helvetica">Helvetica</SelectItem>
                  <SelectItem value="verdana">Verdana</SelectItem>
                  <SelectItem value="tahoma">Tahoma</SelectItem>
                  <SelectItem value="trebuchet">Trebuchet MS</SelectItem>
                  <SelectItem value="calibri">Calibri</SelectItem>
                  <SelectItem value="segoe">Segoe UI</SelectItem>
                  <SelectItem value="georgia">Georgia</SelectItem>
                  <SelectItem value="times">Times New Roman</SelectItem>
                  <SelectItem value="palatino">Palatino</SelectItem>
                  <SelectItem value="garamond">Garamond</SelectItem>
                  <SelectItem value="bookman">Bookman</SelectItem>
                  <SelectItem value="cambria">Cambria</SelectItem>
                  <SelectItem value="courier">Courier New</SelectItem>
                  <SelectItem value="consolas">Consolas</SelectItem>
                  <SelectItem value="monaco">Monaco</SelectItem>
                  <SelectItem value="impact">Impact</SelectItem>
                  <SelectItem value="century-gothic">Century Gothic</SelectItem>
                  <SelectItem value="futura">Futura</SelectItem>
                  <SelectItem value="gill-sans">Gill Sans</SelectItem>
                  <SelectItem value="optima">Optima</SelectItem>
                  <SelectItem value="candara">Candara</SelectItem>
                  <SelectItem value="franklin">Franklin Gothic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {/* Elements list */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Elements ({curElements.length})
            </p>
            {curElements.length === 0 && (
              <p className="text-xs text-muted-foreground">Click &quot;Text&quot; or &quot;Image&quot; above to add elements to the canvas.</p>
            )}
            {curElements.map((el) => (
              <div
                key={el.id}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                  selectedId === el.id ? "bg-blue-100 border border-blue-300" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedId(el.id)}
              >
                {el.type === "text" ? <Type className="h-3 w-3 shrink-0" /> : <ImagePlus className="h-3 w-3 shrink-0" />}
                <span className="truncate flex-1">
                  {el.type === "text" ? (el.text || "Text").substring(0, 25) : el.placeholder === "team_logo" ? "Team Logo Spot" : "Image"}
                </span>
                {el.placeholder === "team_logo" && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded shrink-0">TL</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteEl(el.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
