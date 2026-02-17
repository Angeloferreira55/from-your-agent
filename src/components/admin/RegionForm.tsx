"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Region } from "@/types/database";

interface RegionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region?: Region | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export function RegionForm({ open, onOpenChange, region, onSubmit }: RegionFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: region?.name || "",
    description: region?.description || "",
    radius_miles: region?.radius_miles?.toString() || "25",
    zip_codes_text: region?.zip_codes?.join(", ") || "",
    state_codes_text: region?.state_codes?.join(", ") || "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const zipCodes = form.zip_codes_text
        .split(/[,\s]+/)
        .map((z) => z.trim())
        .filter(Boolean);
      const stateCodes = form.state_codes_text
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit({
        ...(region ? { id: region.id } : {}),
        name: form.name,
        description: form.description || null,
        radius_miles: parseFloat(form.radius_miles) || 25,
        zip_codes: zipCodes.length > 0 ? zipCodes : null,
        state_codes: stateCodes.length > 0 ? stateCodes : null,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{region ? "Edit Region" : "Add Region"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Region Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Albuquerque Metro" required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Radius (miles)</Label>
            <Input type="number" value={form.radius_miles} onChange={(e) => update("radius_miles", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ZIP Codes</Label>
            <Textarea
              value={form.zip_codes_text}
              onChange={(e) => update("zip_codes_text", e.target.value)}
              placeholder="87101, 87102, 87104, 87106"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of ZIP codes in this region</p>
          </div>
          <div className="space-y-1.5">
            <Label>State Codes</Label>
            <Input
              value={form.state_codes_text}
              onChange={(e) => update("state_codes_text", e.target.value)}
              placeholder="NM, TX"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {region ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
