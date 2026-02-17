"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface OfferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  regions: Array<{ id: string; name: string }>;
}

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe / Coffee" },
  { value: "pizza", label: "Pizza" },
  { value: "mexican", label: "Mexican" },
  { value: "asian", label: "Asian" },
  { value: "italian", label: "Italian" },
  { value: "american", label: "American" },
  { value: "bbq", label: "BBQ" },
  { value: "seafood", label: "Seafood" },
  { value: "bakery", label: "Bakery" },
  { value: "ice_cream", label: "Ice Cream" },
  { value: "bar", label: "Bar" },
  { value: "brewery", label: "Brewery" },
  { value: "other_food", label: "Other Food" },
  { value: "spa", label: "Spa" },
  { value: "salon", label: "Salon" },
  { value: "fitness", label: "Fitness" },
  { value: "entertainment", label: "Entertainment" },
  { value: "retail", label: "Retail" },
  { value: "service", label: "Service" },
];

export function OfferForm({ open, onOpenChange, onSubmit, regions }: OfferFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    merchant_name: "",
    category: "restaurant",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    website: "",
    region_id: "",
    offer_title: "",
    discount_text: "",
    offer_description: "",
    fine_print: "",
    redemption_instructions: "",
    valid_from: "",
    valid_until: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
      setForm({
        merchant_name: "", category: "restaurant", address_line1: "", city: "",
        state: "", zip: "", phone: "", website: "", region_id: "",
        offer_title: "", discount_text: "", offer_description: "", fine_print: "",
        redemption_instructions: "", valid_from: "", valid_until: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Merchant & Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Merchant Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Merchant Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Business Name *</Label>
                <Input value={form.merchant_name} onChange={(e) => update("merchant_name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => update("state", e.target.value)} maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={(e) => update("zip", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Select value={form.region_id} onValueChange={(v) => update("region_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Region</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Offer Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Offer Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Offer Title *</Label>
                <Input value={form.offer_title} onChange={(e) => update("offer_title", e.target.value)} placeholder="$5 Off Any Large Pizza" required />
              </div>
              <div className="space-y-1.5">
                <Label>Discount Text *</Label>
                <Input value={form.discount_text} onChange={(e) => update("discount_text", e.target.value)} placeholder="Save $5" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.offer_description} onChange={(e) => update("offer_description", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Fine Print</Label>
              <Input value={form.fine_print} onChange={(e) => update("fine_print", e.target.value)} placeholder="Cannot be combined with other offers" />
            </div>
            <div className="space-y-1.5">
              <Label>Redemption Instructions</Label>
              <Input value={form.redemption_instructions} onChange={(e) => update("redemption_instructions", e.target.value)} placeholder="Show this postcard to redeem" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valid From *</Label>
                <Input type="date" value={form.valid_from} onChange={(e) => update("valid_from", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Valid Until *</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => update("valid_until", e.target.value)} required />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
