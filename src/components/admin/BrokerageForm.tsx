"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

interface BrokerageRecord {
  id: string;
  name: string;
  slogan: string;
  website: string;
  logo_url: string;
  second_logo_url: string | null;
  background_url: string;
  brand_color: string;
  overlay_color: string;
  text_color: string;
  social_links: Record<string, string>;
  disclaimer: string;
}

interface BrokerageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  editingBrokerage?: BrokerageRecord | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ImageUploadField({ label, currentUrl, brokerageId, type, onUploaded }: {
  label: string;
  currentUrl: string;
  brokerageId: string;
  type: "logo" | "background" | "second_logo";
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!brokerageId) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const res = await fetch("/api/admin/brokerages/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, brokerageId, type, ext, contentType: file.type }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { url } = await res.json();
      onUploaded(url);
    } catch {
      // silently fail — toast handled by parent
    } finally {
      setUploading(false);
    }
  }, [brokerageId, type, onUploaded]);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        className="relative flex items-center justify-center h-24 rounded-lg border-2 border-dashed cursor-pointer overflow-hidden hover:border-[#E8733A]/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Upload className="h-5 w-5 text-white" />}
            </div>
          </>
        ) : (
          <div className="text-center p-2">
            {uploading ? (
              <Loader2 className="mx-auto h-5 w-5 text-[#E8733A] animate-spin" />
            ) : (
              <>
                <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">Upload {label.toLowerCase()}</p>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>
    </div>
  );
}

export function BrokerageForm({ open, onOpenChange, onSubmit, editingBrokerage }: BrokerageFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    slogan: "",
    website: "",
    brand_color: "#1B3A5C",
    overlay_color: "rgba(27, 58, 92, 0.65)",
    text_color: "#FFFFFF",
    logo_url: "",
    background_url: "",
    second_logo_url: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    twitter: "",
    disclaimer: "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  });

  useEffect(() => {
    if (editingBrokerage) {
      setForm({
        id: editingBrokerage.id,
        name: editingBrokerage.name,
        slogan: editingBrokerage.slogan,
        website: editingBrokerage.website,
        brand_color: editingBrokerage.brand_color,
        overlay_color: editingBrokerage.overlay_color,
        text_color: editingBrokerage.text_color,
        logo_url: editingBrokerage.logo_url,
        background_url: editingBrokerage.background_url,
        second_logo_url: editingBrokerage.second_logo_url || "",
        facebook: editingBrokerage.social_links?.facebook || "",
        instagram: editingBrokerage.social_links?.instagram || "",
        linkedin: editingBrokerage.social_links?.linkedin || "",
        youtube: editingBrokerage.social_links?.youtube || "",
        twitter: editingBrokerage.social_links?.twitter || "",
        disclaimer: editingBrokerage.disclaimer,
      });
    } else {
      setForm({
        id: "", name: "", slogan: "", website: "",
        brand_color: "#1B3A5C", overlay_color: "rgba(27, 58, 92, 0.65)", text_color: "#FFFFFF",
        logo_url: "", background_url: "", second_logo_url: "",
        facebook: "", instagram: "", linkedin: "", youtube: "", twitter: "",
        disclaimer: "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
      });
    }
  }, [editingBrokerage, open]);

  function update(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" && !editingBrokerage ? { id: slugify(value) } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const social_links: Record<string, string> = {};
      if (form.facebook) social_links.facebook = form.facebook;
      if (form.instagram) social_links.instagram = form.instagram;
      if (form.linkedin) social_links.linkedin = form.linkedin;
      if (form.youtube) social_links.youtube = form.youtube;
      if (form.twitter) social_links.twitter = form.twitter;

      await onSubmit({
        id: form.id,
        name: form.name,
        slogan: form.slogan,
        website: form.website,
        brand_color: form.brand_color,
        overlay_color: form.overlay_color,
        text_color: form.text_color,
        logo_url: form.logo_url,
        background_url: form.background_url,
        second_logo_url: form.second_logo_url || null,
        social_links,
        disclaimer: form.disclaimer,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const isEditing = !!editingBrokerage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Brokerage" : "Add Brokerage"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Keller Williams Realty" required />
              </div>
              <div className="space-y-1.5">
                <Label>ID / Slug {isEditing && "(read-only)"}</Label>
                <Input value={form.id} onChange={(e) => update("id", e.target.value)} placeholder="keller-williams" required disabled={isEditing} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slogan</Label>
              <Textarea value={form.slogan} onChange={(e) => update("slogan", e.target.value)} placeholder={"Not Just Agents.\nAdvisors."} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="www.kw.com" />
            </div>
          </div>

          {/* Branding Colors */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Branding & Colors</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.brand_color} onChange={(e) => update("brand_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.brand_color} onChange={(e) => update("brand_color", e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.text_color} onChange={(e) => update("text_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.text_color} onChange={(e) => update("text_color", e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Overlay Color</Label>
                <Input value={form.overlay_color} onChange={(e) => update("overlay_color", e.target.value)} placeholder="rgba(100, 0, 0, 0.65)" />
              </div>
            </div>
          </div>

          {/* Logo & Background Uploads */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Logo & Background</h3>
            {isEditing ? (
              <div className="grid grid-cols-3 gap-3">
                <ImageUploadField
                  label="Brokerage Logo"
                  currentUrl={form.logo_url}
                  brokerageId={form.id}
                  type="logo"
                  onUploaded={(url) => setForm((p) => ({ ...p, logo_url: url }))}
                />
                <ImageUploadField
                  label="Background"
                  currentUrl={form.background_url}
                  brokerageId={form.id}
                  type="background"
                  onUploaded={(url) => setForm((p) => ({ ...p, background_url: url }))}
                />
                <ImageUploadField
                  label="Second Logo"
                  currentUrl={form.second_logo_url}
                  brokerageId={form.id}
                  type="second_logo"
                  onUploaded={(url) => setForm((p) => ({ ...p, second_logo_url: url }))}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Save the brokerage first, then you can upload images.</p>
            )}
            {/* Brand Preview */}
            {(form.logo_url || form.brand_color) && (
              <div className="relative flex items-center gap-3 rounded-lg p-4 overflow-hidden" style={{ backgroundColor: form.brand_color }}>
                {form.background_url && (
                  <img src={form.background_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0" style={{ backgroundColor: form.overlay_color }} />
                <div className="relative z-10 flex items-center gap-3">
                  {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-8 w-auto object-contain" />}
                  <span className="text-sm font-medium" style={{ color: form.text_color }}>{form.name || "Preview"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/..." /></div>
              <div className="space-y-1.5"><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/..." /></div>
              <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/..." /></div>
              <div className="space-y-1.5"><Label>YouTube</Label><Input value={form.youtube} onChange={(e) => update("youtube", e.target.value)} placeholder="https://youtube.com/..." /></div>
              <div className="space-y-1.5"><Label>Twitter / X</Label><Input value={form.twitter} onChange={(e) => update("twitter", e.target.value)} placeholder="https://x.com/..." /></div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Legal</h3>
            <div className="space-y-1.5">
              <Label>Disclaimer</Label>
              <Textarea value={form.disclaimer} onChange={(e) => update("disclaimer", e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
