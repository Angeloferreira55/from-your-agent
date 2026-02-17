"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const MERGE_VARS = [
  "{{agent_name}}", "{{agent_company}}", "{{agent_phone}}", "{{agent_email}}",
  "{{agent_tagline}}", "{{agent_message}}", "{{agent_photo_url}}", "{{agent_logo_url}}",
  "{{offer_title}}", "{{discount_text}}", "{{merchant_name}}", "{{merchant_address}}",
  "{{recipient_name}}", "{{recipient_address}}",
];

const DEFAULT_FRONT_HTML = `<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .container { width: 1875px; height: 1275px; position: relative; background: #fff; }
    .offer-section { padding: 60px; text-align: center; }
    .merchant-name { font-size: 48px; font-weight: bold; color: #1a1a1a; }
    .discount { font-size: 72px; font-weight: bold; color: #F97316; margin: 30px 0; }
    .offer-title { font-size: 36px; color: #444; }
    .fine-print { font-size: 18px; color: #888; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="offer-section">
      <p class="merchant-name">{{merchant_name}}</p>
      <p class="discount">{{discount_text}}</p>
      <p class="offer-title">{{offer_title}}</p>
      <p class="fine-print">Show this postcard to redeem. From Your Agent.</p>
    </div>
  </div>
</body>
</html>`;

const DEFAULT_BACK_HTML = `<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .container { width: 1875px; height: 1275px; position: relative; background: #fff; }
    .agent-section { position: absolute; left: 60px; top: 60px; width: 800px; }
    .agent-name { font-size: 36px; font-weight: bold; color: #1a1a1a; }
    .agent-company { font-size: 24px; color: #666; }
    .agent-tagline { font-size: 20px; color: #888; font-style: italic; margin-top: 10px; }
    .agent-message { font-size: 20px; color: #444; margin-top: 20px; line-height: 1.4; }
    .agent-contact { font-size: 18px; color: #666; margin-top: 15px; }
    .address-section { position: absolute; right: 60px; top: 400px; width: 700px; }
    .recipient { font-size: 24px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="agent-section">
      <p class="agent-name">{{agent_name}}</p>
      <p class="agent-company">{{agent_company}}</p>
      <p class="agent-tagline">{{agent_tagline}}</p>
      <p class="agent-message">{{agent_message}}</p>
      <p class="agent-contact">{{agent_phone}} | {{agent_email}}</p>
    </div>
    <div class="address-section">
      <p class="recipient">{{recipient_name}}<br>{{recipient_address}}</p>
    </div>
  </div>
</body>
</html>`;

export function TemplateForm({ open, onOpenChange, onSubmit }: TemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    size: "6x9",
    season: "any",
    front_html: DEFAULT_FRONT_HTML,
    back_html: DEFAULT_BACK_HTML,
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description || null,
        size: form.size,
        season: form.season,
        front_html: form.front_html,
        back_html: form.back_html,
        merge_variables: MERGE_VARS.map((v) => ({
          key: v.replace(/[{}]/g, ""),
          label: v.replace(/[{}]/g, "").replace(/_/g, " "),
          required: false,
        })),
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Postcard Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Template Name *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="March 2026 Restaurant Deals" required />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size} onValueChange={(v) => update("size", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4x6">4x6</SelectItem>
                  <SelectItem value="6x9">6x9</SelectItem>
                  <SelectItem value="6x11">6x11</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Season</Label>
              <Select value={form.season} onValueChange={(v) => update("season", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="fall">Fall</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Available Merge Variables</Label>
            <div className="flex flex-wrap gap-1">
              {MERGE_VARS.map((v) => (
                <Badge key={v} variant="outline" className="text-xs font-mono cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click to copy. Use these in your HTML templates.</p>
          </div>

          <Tabs defaultValue="front" className="w-full">
            <TabsList>
              <TabsTrigger value="front">Front HTML</TabsTrigger>
              <TabsTrigger value="back">Back HTML</TabsTrigger>
            </TabsList>
            <TabsContent value="front">
              <Textarea
                value={form.front_html}
                onChange={(e) => update("front_html", e.target.value)}
                rows={16}
                className="font-mono text-xs"
              />
            </TabsContent>
            <TabsContent value="back">
              <Textarea
                value={form.back_html}
                onChange={(e) => update("back_html", e.target.value)}
                rows={16}
                className="font-mono text-xs"
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
