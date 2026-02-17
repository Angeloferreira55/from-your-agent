"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { BrokerageConfig } from "@/data/brokerages";

interface BrokerageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  editingBrokerage?: BrokerageConfig | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BrokerageForm({ open, onOpenChange, onSubmit, editingBrokerage }: BrokerageFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    slogan: "",
    website: "",
    brandColor: "#1B3A5C",
    overlayColor: "rgba(27, 58, 92, 0.65)",
    textColor: "#FFFFFF",
    logoUrl: "",
    backgroundUrl: "",
    secondLogoUrl: "",
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
        brandColor: editingBrokerage.brandColor,
        overlayColor: editingBrokerage.overlayColor,
        textColor: editingBrokerage.textColor,
        logoUrl: editingBrokerage.logoUrl,
        backgroundUrl: editingBrokerage.backgroundUrl,
        secondLogoUrl: editingBrokerage.secondLogoUrl || "",
        facebook: editingBrokerage.socialLinks?.facebook || "",
        instagram: editingBrokerage.socialLinks?.instagram || "",
        linkedin: editingBrokerage.socialLinks?.linkedin || "",
        youtube: editingBrokerage.socialLinks?.youtube || "",
        twitter: editingBrokerage.socialLinks?.twitter || "",
        disclaimer: editingBrokerage.disclaimer,
      });
    } else {
      setForm({
        id: "",
        name: "",
        slogan: "",
        website: "",
        brandColor: "#1B3A5C",
        overlayColor: "rgba(27, 58, 92, 0.65)",
        textColor: "#FFFFFF",
        logoUrl: "",
        backgroundUrl: "",
        secondLogoUrl: "",
        facebook: "",
        instagram: "",
        linkedin: "",
        youtube: "",
        twitter: "",
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
      const socialLinks: Record<string, string> = {};
      if (form.facebook) socialLinks.facebook = form.facebook;
      if (form.instagram) socialLinks.instagram = form.instagram;
      if (form.linkedin) socialLinks.linkedin = form.linkedin;
      if (form.youtube) socialLinks.youtube = form.youtube;
      if (form.twitter) socialLinks.twitter = form.twitter;

      await onSubmit({
        id: form.id,
        name: form.name,
        slogan: form.slogan,
        website: form.website,
        brandColor: form.brandColor,
        overlayColor: form.overlayColor,
        textColor: form.textColor,
        logoUrl: form.logoUrl,
        backgroundUrl: form.backgroundUrl,
        secondLogoUrl: form.secondLogoUrl || undefined,
        socialLinks,
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>
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
              <Textarea value={form.slogan} onChange={(e) => update("slogan", e.target.value)} placeholder="Not Just Agents.\nAdvisors." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="www.kw.com" />
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Branding & Colors
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) => update("brandColor", e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input value={form.brandColor} onChange={(e) => update("brandColor", e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={(e) => update("textColor", e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input value={form.textColor} onChange={(e) => update("textColor", e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Overlay Color</Label>
                <Input value={form.overlayColor} onChange={(e) => update("overlayColor", e.target.value)} placeholder="rgba(100, 0, 0, 0.65)" />
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Logo & Background
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="/brokerages/kw-logo-white.png" />
              </div>
              <div className="space-y-1.5">
                <Label>Background URL</Label>
                <Input value={form.backgroundUrl} onChange={(e) => update("backgroundUrl", e.target.value)} placeholder="/brokerages/kw-bg.jpg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Second Logo URL (optional)</Label>
              <Input value={form.secondLogoUrl} onChange={(e) => update("secondLogoUrl", e.target.value)} placeholder="/brokerages/franchise-logo.png" />
            </div>
            {/* Preview */}
            {(form.logoUrl || form.brandColor) && (
              <div
                className="flex items-center gap-3 rounded-lg p-4"
                style={{ backgroundColor: form.brandColor }}
              >
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="Logo preview" className="h-8 w-auto object-contain" />
                )}
                <span className="text-sm font-medium" style={{ color: form.textColor }}>
                  {form.name || "Preview"}
                </span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Social Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Facebook</Label>
                <Input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn</Label>
                <Input value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>YouTube</Label>
                <Input value={form.youtube} onChange={(e) => update("youtube", e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Twitter / X</Label>
                <Input value={form.twitter} onChange={(e) => update("twitter", e.target.value)} placeholder="https://x.com/..." />
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Legal
            </h3>
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
