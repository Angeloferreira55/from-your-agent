"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  templates: Array<{ id: string; name: string }>;
  offers: Array<{ id: string; title: string; merchant_name: string }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CampaignForm({ open, onOpenChange, onSubmit, templates, offers }: CampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const currentDate = new Date();
  const [form, setForm] = useState({
    name: "",
    description: "",
    month: (currentDate.getMonth() + 2).toString(), // Next month
    year: currentDate.getFullYear().toString(),
    template_id: "",
    mail_date: "",
    cutoff_date: "",
  });
  const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set());

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleOffer(offerId: string) {
    setSelectedOfferIds((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description || null,
        month: parseInt(form.month),
        year: parseInt(form.year),
        template_id: form.template_id,
        offer_ids: Array.from(selectedOfferIds),
        mail_date: form.mail_date,
        cutoff_date: form.cutoff_date,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Campaign Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="March 2026 Restaurant Deals" required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Month *</Label>
              <Select value={form.month} onValueChange={(v) => update("month", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} min={2025} max={2030} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Postcard Template *</Label>
            <Select value={form.template_id} onValueChange={(v) => update("template_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                {templates.length === 0 ? (
                  <SelectItem value="none" disabled>No templates available</SelectItem>
                ) : (
                  templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mail Date *</Label>
              <Input type="date" value={form.mail_date} onChange={(e) => update("mail_date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Cutoff Date *</Label>
              <Input type="date" value={form.cutoff_date} onChange={(e) => update("cutoff_date", e.target.value)} required />
            </div>
          </div>

          {offers.length > 0 && (
            <div className="space-y-2">
              <Label>Include Offers ({selectedOfferIds.size} selected)</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-2">
                {offers.map((offer) => (
                  <label key={offer.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedOfferIds.has(offer.id)}
                      onCheckedChange={() => toggleOffer(offer.id)}
                    />
                    <span className="font-medium">{offer.title}</span>
                    <span className="text-muted-foreground">— {offer.merchant_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.template_id}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
