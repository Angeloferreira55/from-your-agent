"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OfferForm } from "@/components/admin/OfferForm";
import { Plus, Tag, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminOffersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: regionsData } = useQuery({
    queryKey: ["admin", "regions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/regions");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "offers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/offers");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Merchant & offer created");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: { type: string; id: string }) => {
      const res = await fetch("/api/admin/offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const merchants = data?.merchants || [];
  const regions = regionsData?.regions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merchant Offers</h1>
          <p className="text-muted-foreground">
            {merchants.length} merchant{merchants.length !== 1 ? "s" : ""} with offers
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Merchant & Offer
        </Button>
      </div>

      {!isLoading && merchants.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Tag className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No offers yet</CardTitle>
            <CardDescription>Add local merchants and create discount offers for postcards.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.map((merchant: Record<string, unknown>) => {
                const offers = (merchant.offers as Array<Record<string, unknown>>) || [];
                if (offers.length === 0) {
                  return (
                    <TableRow key={merchant.id as string}>
                      <TableCell className="font-medium">{merchant.name as string}</TableCell>
                      <TableCell><Badge variant="outline">{(merchant.category as string).replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{merchant.city as string}{merchant.state ? `, ${merchant.state}` : ""}</TableCell>
                      <TableCell className="text-muted-foreground">No offers</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              if (confirm("Delete this merchant?")) deleteMutation.mutate({ type: "merchant", id: merchant.id as string });
                            }}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete Merchant
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }
                return offers.map((offer) => (
                  <TableRow key={offer.id as string}>
                    <TableCell className="font-medium">{merchant.name as string}</TableCell>
                    <TableCell><Badge variant="outline">{(merchant.category as string).replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{merchant.city as string}{merchant.state ? `, ${merchant.state}` : ""}</TableCell>
                    <TableCell className="text-sm">{offer.title as string}</TableCell>
                    <TableCell><Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{offer.discount_text as string}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{offer.valid_until as string}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => {
                            if (confirm("Delete this offer?")) deleteMutation.mutate({ type: "offer", id: offer.id as string });
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete Offer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <OfferForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        regions={regions}
      />
    </div>
  );
}
