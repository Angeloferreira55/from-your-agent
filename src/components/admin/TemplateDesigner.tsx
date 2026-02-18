"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Type, ImagePlus, Trash2, Save, ArrowLeft, X, Building2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

/* ── Types ── */

export interface DesignElement {
  id: string;
  type: "text" | "image";
  x: number; // % from left
  y: number; // % from top
  width: number; // % of canvas
  height: number; // % of canvas (images only; text auto-heights)
  // text
  text?: string;
  fontSize?: number; // design-px at 900px canvas width
  fontColor?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  fontFamily?: "sans-serif" | "serif";
  // image
  src?: string;
  objectFit?: "contain" | "cover";
}

export interface DesignConfig {
  background: {
    color: string;
    imageUrl: string;
    overlayColor: string;
  };
  elements: DesignElement[];
  disclaimer: string;
}

interface TemplateDesignerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    size?: string;
    season?: string;
    design?: DesignConfig;
  };
}

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

/* ── Component ── */

export function TemplateDesigner({ open, onClose, onSubmit, initialData }: TemplateDesignerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Metadata
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [size, setSize] = useState(initialData?.size || "6x9");
  const [season, setSeason] = useState(initialData?.season || "any");

  // Design state
  const [bgColor, setBgColor] = useState(initialData?.design?.background.color || "#1B3A5C");
  const [bgImage, setBgImage] = useState(initialData?.design?.background.imageUrl || "");
  const [overlayColor, setOverlayColor] = useState(initialData?.design?.background.overlayColor || "rgba(0,0,0,0.3)");
  const [elements, setElements] = useState<DesignElement[]>(initialData?.design?.elements || []);
  const [disclaimer, setDisclaimer] = useState(initialData?.design?.disclaimer || "Each office is independently owned and operated.");

  // Interaction
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [scale, setScale] = useState(1);

  const selected = elements.find((el) => el.id === selectedId) || null;

  // Keep scale in sync with canvas width (design basis = 900px)
  useEffect(() => {
    function sync() {
      if (canvasRef.current) setScale(canvasRef.current.offsetWidth / 900);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [open]);

  // Reset state when initialData changes
  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setSize(initialData?.size || "6x9");
    setSeason(initialData?.season || "any");
    setBgColor(initialData?.design?.background.color || "#1B3A5C");
    setBgImage(initialData?.design?.background.imageUrl || "");
    setOverlayColor(initialData?.design?.background.overlayColor || "rgba(0,0,0,0.3)");
    setElements(initialData?.design?.elements || []);
    setDisclaimer(initialData?.design?.disclaimer || "Each office is independently owned and operated.");
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
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    setDragging({ id, offsetX: pos.x - el.x, offsetY: pos.y - el.y });
    setSelectedId(id);
  }, [elements, canvasPos]);

  const onCanvasMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = canvasPos(e);
    setElements((prev) =>
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
  }, [dragging, canvasPos]);

  const onCanvasUp = useCallback(() => setDragging(null), []);

  /* ── Element CRUD ── */

  function addText() {
    const el: DesignElement = {
      id: genId(), type: "text", x: 10, y: 10, width: 40, height: 10,
      text: "New text", fontSize: 18, fontColor: "#FFFFFF",
      fontWeight: "normal", fontStyle: "normal", textAlign: "left", fontFamily: "sans-serif",
    };
    setElements((p) => [...p, el]);
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
        const res = await fetch("/api/admin/templates/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: b64, ext, contentType: file.type }),
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        const el: DesignElement = {
          id: genId(), type: "image", x: 10, y: 10, width: 30, height: 25, src: url, objectFit: "contain",
        };
        setElements((p) => [...p, el]);
        setSelectedId(el.id);
        toast.success("Image added");
      } catch {
        toast.error("Failed to upload image");
      }
    };
    input.click();
  }

  function deleteEl(id: string) {
    setElements((p) => p.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateEl(id: string, u: Partial<DesignElement>) {
    setElements((p) => p.map((el) => (el.id === id ? { ...el, ...u } : el)));
  }

  /* ── Upload helper ── */

  async function uploadFile(file: File): Promise<string> {
    const b64 = await fileToBase64(file);
    const ext = file.name.split(".").pop() || "png";
    const res = await fetch("/api/admin/templates/upload", {
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
      const el: DesignElement = {
        id: genId(), type: "image", x: 5, y: 5, width: 35, height: 20, src: url, objectFit: "contain",
      };
      setElements((p) => [...p, el]);
      setSelectedId(el.id);
      toast.success("Brokerage logo added — drag to position");
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
      setBgImage(url);
      toast.success("Background banner set");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  /* ── Generic background image upload (sidebar) ── */

  async function uploadBg() {
    const file = await pickFile("image/*");
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setBgImage(url);
      toast.success("Background uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload background");
    }
  }

  /* ── Save ── */

  async function handleSave() {
    if (!name.trim()) { toast.error("Enter a template name"); return; }
    setSaving(true);
    try {
      const design: DesignConfig = {
        background: { color: bgColor, imageUrl: bgImage, overlayColor },
        elements,
        disclaimer,
      };
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        name,
        description: description || null,
        size,
        season,
        front_html: "",
        back_html: JSON.stringify(design),
      });
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
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="4x6">4x6</SelectItem>
            <SelectItem value="6x9">6x9</SelectItem>
            <SelectItem value="6x11">6x11</SelectItem>
          </SelectContent>
        </Select>
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
          Brokerage Logo
        </Button>
        <Button variant="outline" size="sm" onClick={addBackgroundBanner} disabled={uploadingBanner}>
          {uploadingBanner ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1.5 h-4 w-4" />}
          Background Banner
        </Button>
        <div className="ml-auto">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/30 overflow-auto">
          <div
            ref={canvasRef}
            className="relative rounded-lg shadow-xl overflow-hidden select-none"
            style={{ aspectRatio: "9/6", width: "min(75vw, 900px)", backgroundColor: bgColor }}
            onMouseMove={onCanvasMove}
            onMouseUp={onCanvasUp}
            onMouseLeave={onCanvasUp}
            onClick={() => setSelectedId(null)}
          >
            {/* Bg image */}
            {bgImage && (
              <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover pointer-events-none" style={{ opacity: 0.3 }} />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: overlayColor }} />

            {/* Elements */}
            {elements.map((el) => (
              <div
                key={el.id}
                className={`absolute cursor-move transition-shadow ${
                  selectedId === el.id
                    ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent"
                    : "hover:ring-1 hover:ring-blue-300"
                }`}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: el.type === "image" ? `${el.height}%` : "auto",
                }}
                onMouseDown={(e) => onElDown(e, el.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
              >
                {el.type === "text" && (
                  <p
                    className="w-full break-words whitespace-pre-wrap leading-snug pointer-events-none"
                    style={{
                      fontSize: `${(el.fontSize || 16) * scale}px`,
                      color: el.fontColor || "#fff",
                      fontWeight: el.fontWeight || "normal",
                      fontStyle: el.fontStyle || "normal",
                      textAlign: el.textAlign || "left",
                      fontFamily: el.fontFamily === "serif" ? "Georgia, serif" : "Arial, sans-serif",
                    }}
                  >
                    {el.text}
                  </p>
                )}
                {el.type === "image" && el.src && (
                  <img
                    src={el.src}
                    alt=""
                    className="w-full h-full pointer-events-none"
                    style={{ objectFit: el.objectFit || "contain" }}
                  />
                )}
              </div>
            ))}

            {/* Disclaimer */}
            {disclaimer && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 pointer-events-none">
                <p className="leading-tight text-center" style={{ fontSize: `${8 * scale}px`, color: "rgba(255,255,255,0.55)" }}>
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

          {/* Background */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Background</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 text-xs h-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Image</Label>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={uploadBg}>
                <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                {bgImage ? "Replace" : "Upload"}
              </Button>
              {bgImage && (
                <div className="relative">
                  <img src={bgImage} alt="" className="h-14 w-full object-cover rounded border" />
                  <Button variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5" onClick={() => setBgImage("")}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Overlay</Label>
              <Input value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} placeholder="rgba(0,0,0,0.3)" className="text-xs h-8" />
            </div>
          </div>

          {/* Selected element properties */}
          {selected && (
            <div className="space-y-3 rounded-lg border p-3 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {selected.type === "text" ? "Text" : "Image"}
                </p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteEl(selected.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
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
                  <Input type="number" value={selected.width} onChange={(e) => updateEl(selected.id, { width: +e.target.value })} className="text-xs h-7" min={5} max={100} />
                </div>
                {selected.type === "image" && (
                  <div>
                    <Label className="text-[10px]">Height %</Label>
                    <Input type="number" value={selected.height} onChange={(e) => updateEl(selected.id, { height: +e.target.value })} className="text-xs h-7" min={5} max={100} />
                  </div>
                )}
              </div>

              {/* Text props */}
              {selected.type === "text" && (
                <>
                  <div>
                    <Label className="text-[10px]">Content</Label>
                    <Textarea value={selected.text || ""} onChange={(e) => updateEl(selected.id, { text: e.target.value })} rows={2} className="text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Size</Label>
                      <Input type="number" value={selected.fontSize || 16} onChange={(e) => updateEl(selected.id, { fontSize: +e.target.value })} className="text-xs h-7" min={8} max={72} />
                    </div>
                    <div>
                      <Label className="text-[10px]">Color</Label>
                      <div className="flex gap-1">
                        <input type="color" value={selected.fontColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { fontColor: e.target.value })} className="h-7 w-7 rounded border cursor-pointer" />
                        <Input value={selected.fontColor || "#FFFFFF"} onChange={(e) => updateEl(selected.id, { fontColor: e.target.value })} className="flex-1 text-xs h-7" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      variant={selected.fontWeight === "bold" ? "default" : "outline"}
                      size="sm" className="text-xs h-7"
                      onClick={() => updateEl(selected.id, { fontWeight: selected.fontWeight === "bold" ? "normal" : "bold" })}
                    >B</Button>
                    <Button
                      variant={selected.fontStyle === "italic" ? "default" : "outline"}
                      size="sm" className="text-xs h-7 italic"
                      onClick={() => updateEl(selected.id, { fontStyle: selected.fontStyle === "italic" ? "normal" : "italic" })}
                    >I</Button>
                    <Button
                      variant={selected.fontFamily === "serif" ? "default" : "outline"}
                      size="sm" className="text-xs h-7"
                      onClick={() => updateEl(selected.id, { fontFamily: selected.fontFamily === "serif" ? "sans-serif" : "serif" })}
                    >Serif</Button>
                  </div>
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
                </>
              )}

              {/* Image props */}
              {selected.type === "image" && (
                <div className="grid grid-cols-2 gap-1">
                  <Button variant={selected.objectFit === "contain" ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => updateEl(selected.id, { objectFit: "contain" })}>
                    Contain
                  </Button>
                  <Button variant={selected.objectFit === "cover" ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => updateEl(selected.id, { objectFit: "cover" })}>
                    Cover
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disclaimer</p>
            <Textarea
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="Each office is independently owned..."
            />
          </div>

          {/* Elements list */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Elements ({elements.length})
            </p>
            {elements.length === 0 && (
              <p className="text-xs text-muted-foreground">Click &quot;Text&quot; or &quot;Image&quot; above to add elements to the canvas.</p>
            )}
            {elements.map((el) => (
              <div
                key={el.id}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                  selectedId === el.id ? "bg-blue-100 border border-blue-300" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedId(el.id)}
              >
                {el.type === "text" ? <Type className="h-3 w-3 shrink-0" /> : <ImagePlus className="h-3 w-3 shrink-0" />}
                <span className="truncate flex-1">
                  {el.type === "text" ? (el.text || "Text").substring(0, 25) : "Image"}
                </span>
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
