"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Handshake, ExternalLink, Mail, Phone, Globe, MapPin, Tag } from "lucide-react";
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
            <div className="space-y-4">
              {partners.map((p) => {
                const busy = reviewMutation.isPending && reviewMutation.variables?.merchant_id === p.merchant_id;
                const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pending;
                const websiteHref = p.website ? (p.website.startsWith("http") ? p.website : `https://${p.website}`) : null;
                const location = [p.city, p.state].filter(Boolean).join(", ");
                return (
                  <div key={p.merchant_id} className="rounded-xl border bg-card p-5">
                    {/* Header: logo + name + status + actions */}
                    <div className="flex flex-wrap items-start gap-4">
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a href={p.logo_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <img src={p.logo_url} alt={`${p.business_name} logo`} className="h-14 w-14 rounded-lg border bg-white object-contain p-1" />
                        </a>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                          <Handshake className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold leading-tight">{p.business_name}</h3>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {p.category ? <span className="inline-flex items-center gap-1 capitalize"><Tag className="h-3.5 w-3.5" /> {p.category.replace(/_/g, " ")}</span> : null}
                          {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span> : null}
                          {websiteHref ? <a href={websiteHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline"><Globe className="h-3.5 w-3.5" /> Website</a> : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm" variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          disabled={busy || p.status === "active"}
                          onClick={() => reviewMutation.mutate({ merchant_id: p.merchant_id, action: "approve" })}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-1.5 h-4 w-4" /> Approve</>}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={busy || p.status === "declined"}
                          onClick={() => reviewMutation.mutate({ merchant_id: p.merchant_id, action: "decline" })}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" /> Decline
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 grid gap-5 border-t pt-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offer</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{p.offer?.discount_text || "—"}</p>
                        {p.offer?.fine_print ? <p className="mt-1 text-sm text-muted-foreground">{p.offer.fine_print}</p> : null}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{p.contact_name || "—"}</p>
                        <div className="mt-1 space-y-0.5 text-sm">
                          {p.contact_email ? <a href={`mailto:${p.contact_email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline"><Mail className="h-3.5 w-3.5" /> {p.contact_email}</a> : null}
                          {p.phone ? <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline"><Phone className="h-3.5 w-3.5" /> {p.phone}</a> : null}
                        </div>
                      </div>
                    </div>

                    {/* Agreement */}
                    {(p.signature || p.signed_at) && (
                      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                        Agreed to partner terms
                        {p.signature ? <> — signed <span className="font-serif italic text-foreground">{p.signature}</span></> : null}
                        {p.signed_at ? ` on ${new Date(p.signed_at).toLocaleDateString()}` : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
