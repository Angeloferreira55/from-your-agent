"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, TicketPercent } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  coupon_id: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: number | null;
  created: number;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function fetchPromos() {
    try {
      const res = await fetch("/api/admin/promos");
      const data = await res.json();
      setPromos(data.promos || []);
    } catch {
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPromos();
  }, []);

  async function handleCreate() {
    if (!code || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount_type: discountType,
          discount_value: discountValue,
          max_redemptions: maxRedemptions || null,
          expires_at: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to create promo code");
        return;
      }

      toast.success(`Promo code ${code.toUpperCase()} created!`);
      setCode("");
      setDiscountValue("");
      setMaxRedemptions("");
      setExpiresAt("");
      fetchPromos();
    } catch {
      toast.error("Failed to create promo code");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      toast.success(currentActive ? "Promo code deactivated" : "Promo code activated");
      fetchPromos();
    } catch {
      toast.error("Failed to update promo code");
    }
  }

  function formatDiscount(promo: PromoCode) {
    if (promo.percent_off) return `${promo.percent_off}% off`;
    if (promo.amount_off) return `$${(promo.amount_off / 100).toFixed(2)} off`;
    return "—";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
        <p className="text-muted-foreground">Create and manage discount codes for agents</p>
      </div>

      {/* Create New */}
      <Card>
        <CardHeader>
          <CardTitle>Create Promo Code</CardTitle>
          <CardDescription>Create a new discount code that agents can apply to their account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME20"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage Off</SelectItem>
                  <SelectItem value="amount">Fixed Amount Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{discountType === "percent" ? "Percent Off" : "Amount Off ($)"}</Label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "20" : "5.00"}
                min="0"
                step={discountType === "percent" ? "1" : "0.01"}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Redemptions (optional)</Label>
              <Input
                type="number"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Expires (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Promo Code
          </Button>
        </CardContent>
      </Card>

      {/* Existing Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Promo Codes</CardTitle>
          <CardDescription>All promotion codes in your Stripe account</CardDescription>
        </CardHeader>
        <CardContent>
          {promos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="text-center">Redemptions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                    <TableCell>{formatDiscount(promo)}</TableCell>
                    <TableCell className="text-center">
                      {promo.times_redeemed}
                      {promo.max_redemptions ? ` / ${promo.max_redemptions}` : ""}
                    </TableCell>
                    <TableCell>
                      {promo.expires_at
                        ? new Date(promo.expires_at * 1000).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-center">
                      {promo.active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(promo.id, promo.active)}
                      >
                        {promo.active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-8">
              <TicketPercent className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No promo codes yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
