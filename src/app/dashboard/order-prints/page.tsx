"use client";

import { useState, useRef, useEffect } from "react";

// Postcard dimensions at 96dpi (9.25in × 6.25in for 6x9 with bleed)
const CARD_W = 888;
const CARD_H = 600;

function PostcardFrame({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setScale(el.clientWidth / CARD_W);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scaledH = Math.round(CARD_H * scale);

  return (
    <div ref={wrapRef} className="rounded-md border overflow-hidden w-full" style={{ height: scaledH }}>
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{
          width: CARD_W,
          height: CARD_H,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          display: "block",
        }}
      />
    </div>
  );
}
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Loader2, CheckCircle, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAgentProfile } from "@/hooks/use-agent-profile";
import { getPricePerCard } from "@/lib/stripe/config";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Campaign {
  id: string;
  name: string;
  month: number;
  year: number;
  template_id: string;
  status: string;
  total_postcards: number;
  my_participation: {
    contact_count: number;
  } | null;
}

export default function OrderPrintsPage() {
  const { data: profile } = useAgentProfile();
  const [campaignId, setCampaignId] = useState("");
  const [quantity, setQuantity] = useState(25);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderResult, setOrderResult] = useState<{ mailed: number; failed: number } | null>(null);

  // Fetch available campaigns for this agent
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns-for-order"],
    queryFn: async () => {
      const res = await fetch("/api/agent/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      return (data.campaigns || []) as Campaign[];
    },
  });

  const selectedCampaign = campaigns?.find((c) => c.id === campaignId);

  // Fetch preview HTML when campaign is selected
  const { data: preview } = useQuery({
    queryKey: ["order-preview", selectedCampaign?.template_id],
    queryFn: async () => {
      const res = await fetch("/api/postcards/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: selectedCampaign!.template_id }),
      });
      if (!res.ok) throw new Error("Failed to generate preview");
      return res.json();
    },
    enabled: !!selectedCampaign?.template_id,
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/postcards/order-prints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: selectedCampaign!.template_id, campaign_id: selectedCampaign!.id, quantity }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setOrderComplete(true);
      setOrderResult({ mailed: data.mailed, failed: data.failed });
      toast.success(`Order placed! ${data.mailed} postcards being printed.`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deliveryAddress = profile
    ? {
        line1: profile.brokerage_address_line1 || profile.address_line1,
        city: profile.brokerage_city || profile.city,
        state: profile.brokerage_state || profile.state,
        zip: profile.brokerage_zip || profile.zip,
      }
    : null;

  const hasAddress = deliveryAddress?.line1 && deliveryAddress?.city && deliveryAddress?.state && deliveryAddress?.zip;

  // Combine mailed cards + print quantity for volume pricing
  const mailedCards = selectedCampaign?.my_participation?.contact_count || 0;
  const combinedTotal = mailedCards + quantity;
  const pricePerCard = getPricePerCard(combinedTotal);
  const totalPrice = (pricePerCard * quantity).toFixed(2);

  if (orderComplete && orderResult) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground">
              {orderResult.mailed} postcards are being printed and will be shipped to your office address.
            </p>
            {orderResult.failed > 0 && (
              <p className="text-sm text-red-500">{orderResult.failed} cards failed to process.</p>
            )}
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive them within 5-7 business days.
            </p>
            <Button onClick={() => { setOrderComplete(false); setOrderResult(null); }} variant="outline" className="mt-4">
              Place Another Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Prints</h1>
        <p className="text-muted-foreground">
          Order printed postcards delivered to your office. Perfect for open houses and events.
        </p>
      </div>

      {!hasAddress && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Office address required</p>
              <p className="text-sm text-orange-700 mt-1">
                Please add your brokerage or personal address in{" "}
                <a href="/dashboard/settings" className="underline font-medium">Settings</a>{" "}
                before placing an order.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left — Order form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
              <CardDescription>Select a campaign and quantity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || `${MONTH_NAMES[c.month]} ${c.year}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground">Minimum 1, maximum 500 per order</p>
              </div>

              {/* Delivery address */}
              {hasAddress && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Ship To
                  </Label>
                  <div className="rounded-md border bg-muted/50 p-3 text-sm">
                    <p>{deliveryAddress.line1}</p>
                    <p>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Update in <a href="/dashboard/settings" className="underline">Settings</a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span>{quantity} postcards @ ${pricePerCard.toFixed(2)} each</span>
                <span className="font-semibold">${totalPrice}</span>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">${totalPrice}</span>
              </div>
              <Button
                className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                size="lg"
                disabled={!campaignId || !hasAddress || orderMutation.isPending}
                onClick={() => orderMutation.mutate()}
              >
                {orderMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Printer className="mr-2 h-4 w-4" /> Place Order — ${totalPrice}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right — Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>How your postcards will look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!campaignId && (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Select a campaign to see a preview
                </div>
              )}
              {campaignId && preview && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Front</p>
                    <PostcardFrame html={preview.front_html} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Back</p>
                    <PostcardFrame html={preview.back_html} />
                  </div>
                </>
              )}
              {campaignId && !preview && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
