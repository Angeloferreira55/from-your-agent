"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Type, ImagePlus, Trash2, Save, ArrowLeft, X, Building2, Image as ImageIcon, Copy, Users, QrCode, Minus, Square, Circle, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  type: "text" | "image" | "shape";
  x: number; // % from left
  y: number; // % from top
  width: number; // % of canvas
  height: number; // % of canvas (images & shapes; text auto-heights)
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
  placeholder?: "team_logo" | "agent_name" | "brokerage_name" | "brokerage_logo" | "agent_phone"; // replaced with real data at render time
  // shape
  shapeType?: "line" | "rectangle" | "circle";
  shapeColor?: string;
  shapeBorderWidth?: number;
  shapeFilled?: boolean;
  shapeRotation?: number; // degrees for line rotation
  // markers
  _personalMessage?: boolean; // identifies the personal message element
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
    imageFit?: "cover" | "contain" | "fill"; // how the background image fits the canvas
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
  /** Which tab to open on — "front" or "back" (offer panel). Only applies to monthly templates. */
  initialTab?: "front" | "back";
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    season?: string;
    type?: "brokerage" | "monthly";
    brokerage_id?: string | null;
    design?: DesignConfig;
    frontDesign?: DesignConfig;
    customMessage?: string;
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

/** Resize image client-side and return a Blob + data URL for fallback. SVGs pass through as-is. */
function processImage(file: File, maxDim = 1500): Promise<{ blob: Blob; dataUrl: string; ext: string }> {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ blob: file, dataUrl: reader.result as string, ext: "svg" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
    // Keep PNG format for images with transparency (logos, icons)
    const isPng = file.type === "image/png";
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      if (!isPng) {
        // Fill with white for JPEG (no transparency support)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const mimeType = isPng ? "image/png" : "image/jpeg";
      const quality = isPng ? undefined : 0.8;
      const ext = isPng ? "png" : "jpg";
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Failed to process image")); return; }
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve({ blob, dataUrl, ext });
        },
        mimeType,
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
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

/* ── Seasonal Footer data (imported from PostcardBack) ── */

import { SEASONAL_FOOTERS, MONTH_KEYS, resolveSeasonalKey } from "@/components/postcard/PostcardBack";

/* ── Component ── */

export function TemplateDesigner({ open, onClose, onSubmit, brokerages, mode = "admin", initialTab, initialData }: TemplateDesignerProps) {
  const isAgent = mode === "agent";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [seasonalFooter, setSeasonalFooter] = useState("auto");
  const [customMessage, setCustomMessage] = useState(initialData?.customMessage || "");

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
  const [imageFit, setImageFit] = useState<"cover" | "contain" | "fill">(initialData?.design?.background.imageFit || "cover");
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
  const [frontImageFit, setFrontImageFit] = useState<"cover" | "contain" | "fill">(initFront.background.imageFit || "cover");
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
  const curImageFit = isFront ? frontImageFit : imageFit;
  const setCurImageFit = isFront ? setFrontImageFit : setImageFit;
  const curElements = isFront ? frontElements : elements;
  const setCurElements = isFront ? setFrontElements : setElements;

  // Canvas design basis: front = 900px (full 6x9), back = 675px (4.5" panel)
  const designBasis = isFront ? 900 : 675;

  // Interaction
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null);
  const [scale, setScale] = useState(1);

  const selected = curElements.find((el) => el.id === selectedId) || null;

  // Helper: select an element, with optional multi-select via Shift
  const selectEl = useCallback((id: string, shiftKey = false) => {
    if (shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          if (selectedId === id) setSelectedId(next.size > 0 ? [...next][0] : null);
        } else {
          next.add(id);
          // Also add current selectedId to the set if not already there
          if (selectedId && !next.has(selectedId)) next.add(selectedId);
          setSelectedId(id);
        }
        return next;
      });
    } else {
      setSelectedId(id);
      setSelectedIds(new Set([id]));
    }
  }, [selectedId]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedIds(new Set());
    setEditingId(null);
  }, []);

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
    setActiveTab(initialTab ?? (initialData?.type === "monthly" ? "front" : "back"));
    // Back design
    setBgColor(initialData?.design?.background.color || "#1B3A5C");
    setBgImage(initialData?.design?.background.imageUrl || "");
    setOverlayColor(initialData?.design?.background.overlayColor || "rgba(0,0,0,0.3)");
    setColorEnabled(initialData?.design?.background.colorEnabled !== false);
    setImageFit(initialData?.design?.background.imageFit || "cover");
    const initElements = initialData?.design?.elements || [];
    setElements(initElements);
    // Sync customMessage from the personal message element if it exists
    const pmEl = initElements.find((el: DesignElement) => el._personalMessage);
    if (pmEl?.text) {
      setCustomMessage(pmEl.text);
    } else {
      setCustomMessage(initialData?.customMessage || "");
    }
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
    setFrontImageFit(fd.background.imageFit || "cover");
    setFrontElements(fd.elements || []);
    setSelectedId(null);
    setSelectedIds(new Set());
  }, [initialData, initialTab]);

  // Fetch seasonal footer + team logo from profile when agent designer opens
  useEffect(() => {
    if (!open || !isAgent) return;
    fetch("/api/profile").then(r => r.json()).then(d => {
      // Check DB column first, then fall back to embedded value in agent_card_design
      if (d.profile?.seasonal_footer) {
        setSeasonalFooter(d.profile.seasonal_footer);
      } else if (d.profile?.agent_card_design?._seasonal_footer) {
        setSeasonalFooter(d.profile.agent_card_design._seasonal_footer);
      }
      // Substitute team_logo placeholders with the agent's actual team logo URL
      const teamLogoUrl = d.profile?.team_logo_url;
      if (teamLogoUrl) {
        setElements(prev => prev.map(el =>
          el.placeholder === "team_logo" && !el.src
            ? { ...el, src: teamLogoUrl }
            : el
        ));
      }
    }).catch(() => {});
  }, [open, isAgent]);

  // Undo history
  const undoStackRef = useRef<DesignElement[][]>([]);
  const pushUndo = useCallback(() => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(curElements)));
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
  }, [curElements]);
  const popUndo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (prev) setCurElements(prev);
  }, [setCurElements]);

  // Keyboard: Delete/Backspace to delete, Ctrl+Z to undo
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Ctrl/Cmd + Z = undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (isInput) return;
        e.preventDefault();
        popUndo();
        return;
      }

      // Delete/Backspace = delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isInput) return;
        if (selectedId || selectedIds.size > 0) {
          e.preventDefault();
          pushUndo();
          deleteSelected();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedId, selectedIds, pushUndo, popUndo]);

  /* ── Alignment helpers ── */

  function alignSelected(alignment: "left" | "center-x" | "right" | "top" | "center-y" | "bottom") {
    if (!selectedId) return;
    const el = curElements.find(e => e.id === selectedId);
    if (!el) return;
    switch (alignment) {
      case "left": updateEl(selectedId, { x: 0 }); break;
      case "center-x": updateEl(selectedId, { x: +(50 - el.width / 2).toFixed(1) }); break;
      case "right": updateEl(selectedId, { x: +(100 - el.width).toFixed(1) }); break;
      case "top": updateEl(selectedId, { y: 0 }); break;
      case "center-y": updateEl(selectedId, { y: +(50 - (el.height || 5) / 2).toFixed(1) }); break;
      case "bottom": updateEl(selectedId, { y: +(100 - (el.height || 5)).toFixed(1) }); break;
    }
  }

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
    pushUndo();
    setDragging({ id, offsetX: pos.x - el.x, offsetY: pos.y - el.y });
    selectEl(id, e.shiftKey);
  }, [curElements, canvasPos, selectEl, pushUndo]);

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
          const newH = Math.max(2, Math.min(100, resizing.startH + dy));
          return { ...el, width: +newW.toFixed(1), height: +newH.toFixed(1) };
        })
      );
      return;
    }
    if (!dragging) return;
    const pos = canvasPos(e);
    setCurElements((prev) => {
      const dragEl = prev.find(el => el.id === dragging.id);
      if (!dragEl) return prev;
      const newX = Math.max(0, Math.min(100 - dragEl.width, pos.x - dragging.offsetX));
      const newY = Math.max(0, Math.min(95, pos.y - dragging.offsetY));
      const dx = newX - dragEl.x;
      const dy = newY - dragEl.y;
      // Move all selected elements together
      const idsToMove = selectedIds.has(dragging.id) && selectedIds.size > 1
        ? selectedIds
        : new Set([dragging.id]);
      return prev.map((el) =>
        idsToMove.has(el.id)
          ? {
              ...el,
              x: +(Math.max(0, Math.min(100 - el.width, el.x + dx))).toFixed(1),
              y: +(Math.max(0, Math.min(95, el.y + dy))).toFixed(1),
            }
          : el
      );
    });
  }, [dragging, resizing, canvasPos, selectedIds]);

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
    const file = await pickFile("image/*");
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
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
        setUploadingImage(false);
      };
      img.onerror = () => {
        const el: DesignElement = {
          id: genId(), type: "image", x: 10, y: 10, width: 30, height: 20, src: url, objectFit: "contain",
        };
        setCurElements((p) => [...p, el]);
        setSelectedId(el.id);
        setUploadingImage(false);
      };
      img.src = url;
      toast.success("Image uploaded");
    } catch (err) {
      setUploadingImage(false);
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    }
  }

  function addShape(shapeType: "line" | "rectangle" | "circle") {
    const el: DesignElement = {
      id: genId(), type: "shape",
      x: 10, y: 40,
      width: shapeType === "line" ? 30 : 15,
      height: shapeType === "line" ? 1 : 15,
      shapeType,
      shapeColor: "#000000",
      shapeBorderWidth: 2,
      shapeFilled: shapeType !== "circle",
      shapeRotation: 0,
    };
    setCurElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  function deleteEl(id: string) {
    setCurElements((p) => {
      const el = p.find((x) => x.id === id);
      if (el?._personalMessage) setCustomMessage("");
      return p.filter((x) => x.id !== id);
    });
    if (selectedId === id) setSelectedId(null);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  function deleteSelected() {
    if (selectedIds.size > 1) {
      setCurElements((p) => {
        const deleting = p.filter((x) => selectedIds.has(x.id));
        if (deleting.some((x) => x._personalMessage)) setCustomMessage("");
        return p.filter((x) => !selectedIds.has(x.id));
      });
      setSelectedId(null);
      setSelectedIds(new Set());
    } else if (selectedId) {
      deleteEl(selectedId);
    }
  }

  function updateEl(id: string, u: Partial<DesignElement>) {
    setCurElements((p) => p.map((el) => {
      if (el.id !== id) return el;
      const updated = { ...el, ...u };
      // Keep customMessage in sync when inline-editing the personal message element
      if (el._personalMessage && u.text !== undefined) {
        setCustomMessage(u.text);
      }
      return updated;
    }));
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

  /* ── Upload helper — uploads to Supabase storage via FormData, falls back to data URL ── */

  async function uploadFile(file: File): Promise<string> {
    const { blob, ext } = await processImage(file);

    const formData = new FormData();
    formData.append("file", blob, `upload.${ext}`);

    const endpoint = isAgent ? "/api/profile/design-upload" : "/api/admin/templates/upload";
    const res = await fetch(endpoint, { method: "POST", body: formData });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Upload failed");
      throw new Error(`Image upload failed: ${errText}`);
    }

    const json = await res.json();
    if (!json.url) throw new Error("Image upload returned no URL");
    return json.url;
  }

  function pickFile(accept: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.style.display = "none";
      document.body.appendChild(input);
      input.onchange = () => {
        resolve(input.files?.[0] || null);
        document.body.removeChild(input);
      };
      input.addEventListener("cancel", () => {
        resolve(null);
        document.body.removeChild(input);
      });
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

  /* ── Agent: Insert team logo from profile ── */

  async function insertTeamLogo() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const { profile } = await res.json();
      if (!profile?.team_logo_url) {
        toast.error("Upload a team logo on the Personalization page first");
        return;
      }
      const el: DesignElement = {
        id: genId(), type: "image", x: 68, y: 5, width: 28, height: 35,
        src: profile.team_logo_url, objectFit: "contain",
      };
      setCurElements((p) => [...p, el]);
      setSelectedId(el.id);
      toast.success("Team logo added — drag to position");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team logo");
    }
  }

  /* ── Agent: Upload QR code ── */

  async function addQRCode() {
    const file = await pickFile("image/png,image/jpeg,image/webp,image/svg+xml");
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
      const el: DesignElement = {
        id: genId(), type: "image", x: 75, y: 65, width: 20, height: 28,
        src: url, objectFit: "contain",
      };
      setCurElements((p) => [...p, el]);
      setSelectedId(el.id);
      toast.success("QR code added — drag to position");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload QR code");
    } finally {
      setUploadingImage(false);
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
        background: { color: bgColor, imageUrl: bgImage, overlayColor, colorEnabled, imageFit },
        elements,
        disclaimer,
        disclaimerStyle: { fontSize: disclaimerFontSize, color: disclaimerColor, fontFamily: disclaimerFont },
      };
      const frontDesign: DesignConfig = {
        background: { color: frontBgColor, imageUrl: frontBgImage, overlayColor: frontOverlayColor, colorEnabled: frontColorEnabled, imageFit: frontImageFit },
        elements: frontElements,
        disclaimer: "",
      };
      if (isAgent) {
        await onSubmit({ design: backDesign, seasonal_footer: seasonalFooter, custom_message: customMessage });
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b bg-white">
        {/* Row 1: Back, name, metadata, save */}
        <div className="flex items-center gap-3 px-4 py-2">
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
                className="max-w-[220px] h-8 text-sm"
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
            </>
          )}
          <div className="ml-auto">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
        {/* Row 2: Tools */}
        {isAgent && (
          <div className="flex items-center gap-3 px-4 pb-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={insertTeamLogo}>
              <Users className="mr-1 h-3.5 w-3.5" />
              Team Logo
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addQRCode} disabled={uploadingImage}>
              {uploadingImage ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <QrCode className="mr-1 h-3.5 w-3.5" />}
              QR Code
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addBackgroundBanner} disabled={uploadingBanner}>
              {uploadingBanner ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="mr-1 h-3.5 w-3.5" />}
              Background
            </Button>
            {selectedId && (
              <>
                <div className="h-4 w-px bg-border" />
                {selectedIds.size > 1 && (
                  <span className="text-[10px] text-blue-600 font-medium">{selectedIds.size} selected</span>
                )}
                <span className="text-[10px] text-muted-foreground font-medium">Align:</span>
                <div className="flex gap-0.5">
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Align Left" onClick={() => alignSelected("left")}>
                    <AlignStartVertical className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Center Horizontal" onClick={() => alignSelected("center-x")}>
                    <AlignCenterVertical className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Align Right" onClick={() => alignSelected("right")}>
                    <AlignEndVertical className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Align Top" onClick={() => alignSelected("top")}>
                    <AlignStartHorizontal className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Center Vertical" onClick={() => alignSelected("center-y")}>
                    <AlignCenterHorizontal className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Align Bottom" onClick={() => alignSelected("bottom")}>
                    <AlignEndHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        {!isAgent && (
          <div className="flex items-center gap-3 px-4 pb-2">
            {isMonthly && (
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1 text-xs font-medium transition-colors ${activeTab === "front" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => { setActiveTab("front"); clearSelection(); }}
                >
                  Front
                </button>
                <button
                  className={`px-3 py-1 text-xs font-medium transition-colors border-l ${activeTab === "back" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => { setActiveTab("back"); clearSelection(); }}
                >
                  Offer Panel
                </button>
              </div>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {isMonthly
                ? (isFront ? "Front · 6\" × 9\"" : "Back top-left · 4.5\" × 3\"")
                : "Panel · 4.5\" × 3\""}
            </span>
            <div className="h-4 w-px bg-border" />
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addBrokerageLogo} disabled={uploadingLogo}>
              {uploadingLogo ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Building2 className="mr-1 h-3.5 w-3.5" />}
              Team Logo
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addBackgroundBanner} disabled={uploadingBanner}>
              {uploadingBanner ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="mr-1 h-3.5 w-3.5" />}
              Background
            </Button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area — live preview */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 bg-muted/30 overflow-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {isMonthly ? (isFront ? "Front — Live Preview" : "Offer Panel (Back Top-Left) — Live Preview") : "Live Preview"}
          </p>
          <div
            ref={canvasRef}
            className="relative rounded-lg shadow-xl overflow-hidden select-none border"
            style={{ aspectRatio: "9.25/6.25", width: isFront ? "clamp(400px, 65vw, 900px)" : "clamp(400px, 60vw, 675px)", backgroundColor: curColorEnabled ? curBgColor : "#f0f0f0" }}
            onMouseMove={onCanvasMove}
            onMouseUp={onCanvasUp}
            onMouseLeave={onCanvasUp}
            onClick={() => clearSelection()}
          >
            {/* Bg image */}
            {curBgImage && (
              <img src={curBgImage} alt="" className="absolute inset-0 h-full w-full pointer-events-none" style={{ objectFit: curImageFit, opacity: curColorEnabled ? 0.3 : 1 }} />
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
                      : selectedIds.has(el.id)
                      ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent cursor-move"
                      : el.placeholder ? "ring-1 ring-dashed ring-emerald-400 hover:ring-emerald-500 cursor-move" : "hover:ring-1 hover:ring-blue-300 cursor-move"
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    overflow: el.type === "text" && !isEditing ? "hidden" : undefined,
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
                    el.tintColor ? (
                      <div
                        className="w-full h-full pointer-events-none"
                        style={{
                          backgroundColor: el.tintColor,
                          WebkitMaskImage: `url(${el.src})`,
                          maskImage: `url(${el.src})`,
                          WebkitMaskSize: el.objectFit || "contain",
                          maskSize: el.objectFit || "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                        }}
                      />
                    ) : (
                      <img
                        src={el.src}
                        alt=""
                        className="w-full h-full pointer-events-none"
                        style={{ objectFit: el.objectFit || "contain" }}
                      />
                    )
                  )}
                  {el.type === "shape" && (
                    <div className="w-full h-full pointer-events-none" style={{ transform: el.shapeRotation ? `rotate(${el.shapeRotation}deg)` : undefined }}>
                      {el.shapeType === "line" && (
                        <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: `${el.shapeBorderWidth || 2}px`, backgroundColor: el.shapeColor || "#000" }} />
                      )}
                      {el.shapeType === "rectangle" && (
                        <div className="w-full h-full" style={{
                          backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent",
                          border: el.shapeFilled ? "none" : `${el.shapeBorderWidth || 2}px solid ${el.shapeColor || "#000"}`,
                        }} />
                      )}
                      {el.shapeType === "circle" && (
                        <div className="w-full h-full rounded-full" style={{
                          backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent",
                          border: el.shapeFilled ? "none" : `${el.shapeBorderWidth || 2}px solid ${el.shapeColor || "#000"}`,
                        }} />
                      )}
                    </div>
                  )}
                  {/* Placeholder badge */}
                  {el.placeholder && (
                    <div className={cn(
                      "absolute -top-3 left-0 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none pointer-events-none whitespace-nowrap",
                      el.placeholder === "team_logo" ? "bg-emerald-500" : "bg-violet-500"
                    )}>
                      {el.placeholder === "team_logo" ? "TEAM LOGO" : el.placeholder === "agent_name" ? "AGENT NAME" : el.placeholder === "brokerage_name" ? "BROKERAGE" : el.placeholder === "brokerage_logo" ? "BROKERAGE LOGO" : "PHONE"}
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

            {/* Seasonal footer preview (agent mode) */}
            {isAgent && (() => {
              const resolvedKey = resolveSeasonalKey(seasonalFooter);
              const theme = SEASONAL_FOOTERS[resolvedKey];
              if (!theme || resolvedKey === "none" || !theme.gradient) return null;
              return (
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden pointer-events-none flex items-center justify-center"
                  style={{ height: "12%", background: theme.gradient }}
                >
                  {theme.text && (
                    <p
                      className="text-center font-semibold leading-none"
                      style={{
                        fontSize: `${24 * scale}px`,
                        color: theme.textColor,
                        fontFamily: "Georgia, serif",
                        letterSpacing: "0.5px",
                        margin: 0,
                      }}
                    >
                      {theme.text}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Disclaimer removed — no longer shown on postcards */}
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
              <Button variant="outline" size="sm" className="flex-1" onClick={addImage} disabled={uploadingImage}>
                {uploadingImage ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />} Image
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => addShape("line")}>
                <Minus className="mr-1.5 h-3.5 w-3.5" /> Line
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => addShape("rectangle")}>
                <Square className="mr-1.5 h-3.5 w-3.5" /> Rect
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => addShape("circle")}>
                <Circle className="mr-1.5 h-3.5 w-3.5" /> Circle
              </Button>
            </div>
            {/* Placeholder elements — visible on front tab (admin only) */}
            {activeTab === "front" && !isAgent && (
              <>
                <div className="border-t my-3" />
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">Agent Placeholders</p>
                <p className="text-[10px] text-muted-foreground mb-2">Auto-filled with each agent&apos;s real info at print time</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline" size="sm" className="text-xs h-7 border-violet-200 hover:border-violet-400 hover:bg-violet-50"
                    disabled={curElements.some((el) => el.placeholder === "agent_name")}
                    onClick={() => {
                      const el: DesignElement = {
                        id: genId(), type: "text", x: 5, y: 75, width: 50, height: 12,
                        text: "Agent Name", fontSize: 28, fontColor: "#FFFFFF",
                        fontWeight: "bold", fontStyle: "normal", textAlign: "left", fontFamily: "sans-serif",
                        placeholder: "agent_name",
                      };
                      setCurElements((p) => [...p, el]);
                      setSelectedId(el.id);
                    }}
                  >
                    <Users className="mr-1 h-3 w-3" /> Name
                  </Button>
                  <Button
                    variant="outline" size="sm" className="text-xs h-7 border-violet-200 hover:border-violet-400 hover:bg-violet-50"
                    disabled={curElements.some((el) => el.placeholder === "brokerage_logo")}
                    onClick={() => {
                      const el: DesignElement = {
                        id: genId(), type: "image", x: 5, y: 85, width: 20, height: 12,
                        src: "", objectFit: "contain",
                        placeholder: "brokerage_logo",
                      };
                      setCurElements((p) => [...p, el]);
                      setSelectedId(el.id);
                    }}
                  >
                    <Building2 className="mr-1 h-3 w-3" /> Brokerage
                  </Button>
                  <Button
                    variant="outline" size="sm" className="text-xs h-7 border-violet-200 hover:border-violet-400 hover:bg-violet-50"
                    disabled={curElements.some((el) => el.placeholder === "agent_phone")}
                    onClick={() => {
                      const el: DesignElement = {
                        id: genId(), type: "text", x: 55, y: 87, width: 40, height: 8,
                        text: "(555) 123-4567", fontSize: 16, fontColor: "#FFFFFF",
                        fontWeight: "normal", fontStyle: "normal", textAlign: "right", fontFamily: "sans-serif",
                        placeholder: "agent_phone",
                      };
                      setCurElements((p) => [...p, el]);
                      setSelectedId(el.id);
                    }}
                  >
                    <Type className="mr-1 h-3 w-3" /> Phone
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Align selected element */}
          {selected && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Align</p>
              <div className="grid grid-cols-6 gap-1">
                <Button variant="outline" size="icon" className="h-7 w-full" title="Align Left" onClick={() => alignSelected("left")}>
                  <AlignStartVertical className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-full" title="Center Horizontal" onClick={() => alignSelected("center-x")}>
                  <AlignCenterVertical className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-full" title="Align Right" onClick={() => alignSelected("right")}>
                  <AlignEndVertical className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-full" title="Align Top" onClick={() => alignSelected("top")}>
                  <AlignStartHorizontal className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-full" title="Center Vertical" onClick={() => alignSelected("center-y")}>
                  <AlignCenterHorizontal className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-full" title="Align Bottom" onClick={() => alignSelected("bottom")}>
                  <AlignEndHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Social media icons */}
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
                <>
                  <div className="relative">
                    <img src={curBgImage} alt="" className="h-14 w-full rounded border" style={{ objectFit: curImageFit }} />
                    <Button variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5" onClick={() => setCurBgImage("")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {(["cover", "contain", "fill"] as const).map((fit) => (
                      <button
                        key={fit}
                        onClick={() => setCurImageFit(fit)}
                        className={cn(
                          "flex-1 text-[10px] py-1 rounded border transition-colors capitalize",
                          curImageFit === fit
                            ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {curColorEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay</Label>
                <Input value={curOverlayColor} onChange={(e) => setCurOverlayColor(e.target.value)} placeholder="rgba(0,0,0,0.3)" className="text-xs h-8" />
              </div>
            )}
          </div>

          {/* Personal Message (agent mode) */}
          {isAgent && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Message</p>
              <textarea
                value={customMessage}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomMessage(val);
                  // Sync with a draggable text element on the canvas
                  setCurElements((prev) => {
                    const idx = prev.findIndex((el) => el._personalMessage);
                    if (val.trim()) {
                      if (idx >= 0) {
                        // Update existing element text
                        return prev.map((el) => el._personalMessage ? { ...el, text: val } : el);
                      }
                      // Create new personal message element
                      return [...prev, {
                        id: genId(), type: "text" as const, _personalMessage: true,
                        x: 3, y: 82, width: 94, height: 10,
                        text: val, fontSize: 10, fontColor: "#6B7280",
                        fontFamily: "sans-serif" as FontFamilyOption, textAlign: "left" as const,
                      }];
                    }
                    // Remove if empty
                    if (idx >= 0) return prev.filter((el) => !el._personalMessage);
                    return prev;
                  });
                }}
                placeholder="Hi! I hope you enjoy these exclusive local deals..."
                rows={3}
                maxLength={200}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground">{customMessage.length}/200</p>
            </div>
          )}

          {/* Seasonal Footer (agent mode) */}
          {isAgent && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seasonal Footer</p>
              <p className="text-[10px] text-muted-foreground -mt-2">Decorative strip at the bottom of your panel</p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSeasonalFooter("auto")}
                  className={cn(
                    "relative rounded border-2 p-1 text-center transition-colors",
                    seasonalFooter === "auto" ? "border-blue-500 bg-blue-50" : "border-muted hover:border-muted-foreground/40"
                  )}
                >
                  <div className="h-3 rounded-sm overflow-hidden" style={{
                    background: SEASONAL_FOOTERS[MONTH_KEYS[new Date().getMonth()]]?.gradient || "#ccc",
                  }} />
                  <p className="text-[8px] mt-0.5 font-medium">Auto</p>
                  {seasonalFooter === "auto" && <Check className="absolute top-0 right-0 h-2.5 w-2.5 text-blue-500" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSeasonalFooter("none")}
                  className={cn(
                    "relative rounded border-2 p-1 text-center transition-colors",
                    seasonalFooter === "none" ? "border-blue-500 bg-blue-50" : "border-muted hover:border-muted-foreground/40"
                  )}
                >
                  <div className="h-3 rounded-sm bg-gray-100 flex items-center justify-center">
                    <span className="text-[6px] text-gray-400">None</span>
                  </div>
                  <p className="text-[8px] mt-0.5 font-medium">None</p>
                  {seasonalFooter === "none" && <Check className="absolute top-0 right-0 h-2.5 w-2.5 text-blue-500" />}
                </button>
                {[...MONTH_KEYS, "social", "consultation", "referral"].map((key) => {
                  const theme = SEASONAL_FOOTERS[key];
                  if (!theme) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSeasonalFooter(key)}
                      className={cn(
                        "relative rounded border-2 p-1 text-center transition-colors",
                        seasonalFooter === key ? "border-blue-500 bg-blue-50" : "border-muted hover:border-muted-foreground/40"
                      )}
                    >
                      <div className="h-3 rounded-sm overflow-hidden" style={{ background: theme.gradient }} />
                      <p className="text-[8px] mt-0.5 font-medium">{theme.label}</p>
                      {seasonalFooter === key && <Check className="absolute top-0 right-0 h-2.5 w-2.5 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { pushUndo(); deleteSelected(); }}>
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
                {(selected.type === "image" || selected.type === "shape") && (
                  <div>
                    <Label className="text-[10px]">Height %</Label>
                    <Input type="number" step={0.5} value={selected.height} onChange={(e) => updateEl(selected.id, { height: +e.target.value })} className="text-xs h-7" min={1} max={100} />
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
                    {/* Merge variable quick-insert */}
                    <div className="mt-1.5">
                      <p className="text-[10px] text-muted-foreground mb-1">Insert variable:</p>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: "Offer Title", var: "{{offer_title}}" },
                          { label: "Discount", var: "{{discount_text}}" },
                          { label: "Business", var: "{{merchant_name}}" },
                          { label: "Business Addr", var: "{{merchant_address}}" },
                          { label: "Fine Print", var: "{{fine_print}}" },
                          { label: "Code", var: "{{redemption_code}}" },
                          { label: "Agent Name", var: "{{agent_name}}" },
                          { label: "Agent Phone", var: "{{agent_phone}}" },
                          { label: "Agent Email", var: "{{agent_email}}" },
                          { label: "Company", var: "{{agent_company}}" },
                          { label: "Tagline", var: "{{agent_tagline}}" },
                          { label: "Recipient", var: "{{recipient_name}}" },
                        ].map((v) => (
                          <button
                            key={v.var}
                            className="px-1.5 py-0.5 text-[9px] rounded border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            onClick={() => updateEl(selected.id, { text: (selected.text || "") + v.var })}
                            title={v.var}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
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
                  {/* Tint color — recolors logos/icons to a single color */}
                  <div>
                    <Label className="text-[10px]">Logo Color</Label>
                    <div className="flex gap-1">
                      <input type="color" value={selected.tintColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { tintColor: e.target.value })} className="h-7 w-7 rounded border cursor-pointer" />
                      <Input value={selected.tintColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { tintColor: e.target.value })} className="flex-1 text-xs h-7" />
                      {selected.tintColor && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Remove tint" onClick={() => updateEl(selected.id, { tintColor: undefined })}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Shape props */}
              {selected.type === "shape" && (
                <>
                  <div>
                    <Label className="text-[10px]">Color</Label>
                    <div className="flex gap-1">
                      <input type="color" value={selected.shapeColor || "#000000"} onChange={(e) => updateEl(selected.id, { shapeColor: e.target.value })} className="h-7 w-7 rounded border cursor-pointer" />
                      <Input value={selected.shapeColor || "#000000"} onChange={(e) => updateEl(selected.id, { shapeColor: e.target.value })} className="flex-1 text-xs h-7" />
                    </div>
                  </div>
                  {selected.shapeType !== "line" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.shapeFilled ?? true}
                        onChange={(e) => updateEl(selected.id, { shapeFilled: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-xs">Filled</span>
                    </label>
                  )}
                  {(selected.shapeType === "line" || !selected.shapeFilled) && (
                    <div>
                      <Label className="text-[10px]">Border Width</Label>
                      <Input type="number" value={selected.shapeBorderWidth || 2} onChange={(e) => updateEl(selected.id, { shapeBorderWidth: +e.target.value })} className="text-xs h-7" min={1} max={20} />
                    </div>
                  )}
                  {selected.shapeType === "line" && (
                    <div>
                      <Label className="text-[10px]">Rotation</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={0} max={360} step={1}
                          value={selected.shapeRotation || 0}
                          onChange={(e) => updateEl(selected.id, { shapeRotation: +e.target.value })}
                          className="flex-1 h-1.5 accent-blue-500"
                        />
                        <span className="text-[10px] w-8 text-right text-muted-foreground">{selected.shapeRotation || 0}°</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Placeholder assignment (admin only, text & image elements) */}
              {!isAgent && (selected.type === "text" || selected.type === "image") && (
                <div className="space-y-1">
                  <Label className="text-xs">Placeholder</Label>
                  <Select
                    value={selected.placeholder || "none"}
                    onValueChange={(val) => {
                      const newPlaceholder = val === "none" ? undefined : val as DesignElement["placeholder"];
                      setCurElements((prev) => prev.map((el) =>
                        el.id === selected.id
                          ? { ...el, placeholder: newPlaceholder }
                          : (newPlaceholder && el.placeholder === newPlaceholder) ? { ...el, placeholder: undefined } : el
                      ));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {selected.type === "image" ? (
                        <>
                          <SelectItem value="team_logo">Team Logo</SelectItem>
                          <SelectItem value="brokerage_logo">Brokerage Logo</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="agent_name">Agent Name</SelectItem>
                          <SelectItem value="brokerage_name">Brokerage Name</SelectItem>
                          <SelectItem value="agent_phone">Agent Phone</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {selected.placeholder && (
                    <p className="text-[10px] text-muted-foreground">Replaced with real data at print time</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer — only on brokerage back panel */}
          {!isFront && !isAgent && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disclaimer</p>
              <textarea
                className="w-full rounded border bg-background px-2 py-1.5 text-xs"
                rows={2}
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                placeholder="e.g. Each office is independently owned and operated."
              />
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Size</label>
                <input type="number" min={5} max={14} value={disclaimerFontSize} onChange={(e) => setDisclaimerFontSize(Number(e.target.value))} className="w-14 rounded border bg-background px-1.5 py-0.5 text-xs" />
                <label className="text-[10px] text-muted-foreground">Color</label>
                <input type="color" value={disclaimerColor.startsWith("rgba") ? "#ffffff" : disclaimerColor} onChange={(e) => setDisclaimerColor(e.target.value)} className="h-5 w-5 cursor-pointer rounded border-0 p-0" />
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
                  selectedId === el.id ? "bg-blue-100 border border-blue-300" : selectedIds.has(el.id) ? "bg-blue-50 border border-blue-200" : "hover:bg-muted"
                }`}
                onClick={(e) => selectEl(el.id, e.shiftKey)}
              >
                {el.type === "text" ? <Type className="h-3 w-3 shrink-0" /> : el.type === "shape" ? (el.shapeType === "circle" ? <Circle className="h-3 w-3 shrink-0" /> : el.shapeType === "line" ? <Minus className="h-3 w-3 shrink-0" /> : <Square className="h-3 w-3 shrink-0" />) : <ImagePlus className="h-3 w-3 shrink-0" />}
                <span className="truncate flex-1">
                  {el.placeholder === "agent_name" ? "Agent Name" : el.placeholder === "brokerage_name" ? "Brokerage Name" : el.placeholder === "brokerage_logo" ? "Brokerage Logo" : el.placeholder === "agent_phone" ? "Agent Phone" : el.placeholder === "team_logo" ? "Team Logo Spot" : el.type === "text" ? (el.text || "Text").substring(0, 25) : el.type === "shape" ? (el.shapeType === "line" ? "Line" : el.shapeType === "circle" ? "Circle" : "Rectangle") : "Image"}
                </span>
                {el.placeholder && (
                  <span className={cn("text-[9px] px-1 rounded shrink-0", el.placeholder === "team_logo" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700")}>
                    {el.placeholder === "team_logo" ? "TL" : el.placeholder === "agent_name" ? "AN" : el.placeholder === "brokerage_name" ? "BN" : el.placeholder === "brokerage_logo" ? "BL" : "PH"}
                  </span>
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
