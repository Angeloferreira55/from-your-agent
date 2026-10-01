"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, Handshake, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Partner {
  merchant_id: string;
  business_name: string;
  category: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  contact_name: string | null;
  contact_email: string | null;
  signed_at: string | null;
  signature: string | null;
  status: string;
  offer: { title: string; discount_text: string; fine_print: string | null } | null;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Pending", variant: "default" },
  active: { label: "Approved", variant: "secondary" },
  declined: { label: "Declined", variant: "outline" },
};

export default function AdminPartnersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/partners");
      if (!res.ok) throw new Error("Failed to load partner signups");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ merchant_id, action }: { merchant_id: string; action: "approve" | "decline" }) => {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      toast.success(r.status === "active" ? "Partner approved — offer is now active." : "Partner declined.");
    },
    onError: (err) => toast.error(err.message),
  });

  const partners: Partner[] = data?.partners || [];
  const pending = partners.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Handshake className="h-6 w-6" /> Partner Signups
        </h1>
        <p className="text-muted-foreground">
          Businesses that registered at{" "}
          <a href="/partner" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            /partner <ExternalLink className="inline h-3 w-3" />
          </a>
          . Approve to make their offer available for campaigns.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending review</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{pending.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{partners.filter((p) => p.status === "active").length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total signups</CardDescription>
            <CardTitle className="text-3xl">{partners.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All signups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : partners.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No partner signups yet. Share <span className="font-medium">from-your-agent.com/partner</span> or hand out the{" "}
              <a href="/partner/flyer" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">printable flyer</a>.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p) => {
                    const busy = reviewMutation.isPending && reviewMutation.variables?.merchant_id === p.merchant_id;
                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pending;
                    return (
                      <TableRow key={p.merchant_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <a href={p.logo_url} target="_blank" rel="noreferrer" className="shrink-0">
                                <img src={p.logo_url} alt={`${p.business_name} logo`} className="h-10 w-10 rounded border bg-white object-contain" />
                              </a>
                            ) : null}
                            <div>
                              <div className="font-medium">{p.business_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {[p.city, p.state].filter(Boolean).join(", ")}
                                {p.website ? <> · <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">site</a></> : null}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <div className="text-sm">{p.offer?.discount_text || "—"}</div>
                          {p.offer?.fine_print ? <div className="text-xs text-muted-foreground line-clamp-2">{p.offer.fine_print}</div> : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{p.contact_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.contact_email}</div>
                          <div className="text-xs text-muted-foreground">{p.phone}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.signature ? <div className="font-serif italic text-foreground">{p.signature}</div> : "—"}
                          {p.signed_at ? <div>{new Date(p.signed_at).toLocaleDateString()}</div> : null}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm" variant="outline"
                              className="text-green-700 border-green-200 hover:bg-green-50"
                              disabled={busy || p.status === "active"}
                              onClick={() => reviewMutation.mutate({ merchant_id: p.merchant_id, action: "approve" })}
                            >
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve</>}
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={busy || p.status === "declined"}
                              onClick={() => reviewMutation.mutate({ merchant_id: p.merchant_id, action: "decline" })}
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
