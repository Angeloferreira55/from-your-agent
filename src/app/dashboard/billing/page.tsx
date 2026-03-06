"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Plus, Settings, Loader2, TicketPercent } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface BillingRecord {
  id: string;
  description: string;
  total_cards: number;
  mailed_cards: number;
  unmailed_cards: number;
  total: number;
  status: string;
  billing_date: string;
  stripe_invoice_id: string | null;
}

interface PricingTier {
  name: string;
  min_cards: number;
  max_cards: number | null;
  price_per_mailed: number;
  price_per_unmailed: number;
}

interface BillingData {
  subscription_status: string;
  payment_method: PaymentMethod | null;
  billing_records: BillingRecord[];
  current_month_estimate: { unbilled_cards: number };
  pricing_tiers: PricingTier[];
  active_discount: string | null;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [activeDiscount, setActiveDiscount] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment method added successfully!");
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Setup canceled. You can add a payment method anytime.");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.active_discount) setActiveDiscount(d.active_discount);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAddPayment() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/setup", { method: "POST" });
      const { url, error } = await res.json();
      if (error) {
        toast.error(error);
        return;
      }
      window.location.href = url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManagePayment() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) {
        toast.error(error);
        return;
      }
      window.location.href = url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/billing/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to apply promo code");
        return;
      }
      toast.success(`Promo code applied! ${result.discount} on future invoices`);
      setActiveDiscount(result.discount);
      setPromoCode("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your payment method and view billing history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              {data?.payment_method
                ? "Your card on file"
                : "Add a card to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.payment_method ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">
                      {data.payment_method.brand} ending in {data.payment_method.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {data.payment_method.exp_month}/{data.payment_method.exp_year}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManagePayment}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="mr-2 h-4 w-4" />
                  )}
                  Manage Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center rounded-lg border border-dashed p-6">
                  <CreditCard className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No payment method on file</p>
                </div>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleAddPayment}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Pay per card — no monthly fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.pricing_tiers || []).map((tier) => (
                <div key={tier.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.min_cards}–{tier.max_cards ?? "∞"} cards/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${tier.price_per_mailed.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">per mailed card</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Code */}
      <Card>
        <CardHeader>
          <CardTitle>Promo Code</CardTitle>
          <CardDescription>Have a discount code? Enter it below</CardDescription>
        </CardHeader>
        <CardContent>
          {activeDiscount ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <TicketPercent className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Active discount: {activeDiscount}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="font-mono"
              />
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
              >
                {promoLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TicketPercent className="mr-2 h-4 w-4" />
                )}
                Apply
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* This Month */}
      <Card>
        <CardHeader>
          <CardTitle>Current Period</CardTitle>
          <CardDescription>Unbilled cards pending next invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold">{data?.current_month_estimate.unbilled_cards ?? 0}</p>
              <p className="text-sm text-muted-foreground">unbilled cards</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.billing_records && data.billing_records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Cards</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.billing_records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">
                      {new Date(record.billing_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">{record.description}</TableCell>
                    <TableCell className="text-center text-sm">
                      {record.mailed_cards} mailed
                      {record.unmailed_cards > 0 && `, ${record.unmailed_cards} unmailed`}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${record.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {statusBadge(record.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-8">
              <CreditCard className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
