"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { Plus, Send, MoreHorizontal, Trash2, Eye, Archive, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Campaign } from "@/types/database";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  scheduled: "default",
  generating: "outline",
  ready_to_mail: "default",
  mailing: "default",
  mailed: "default",
  completed: "secondary",
  canceled: "destructive",
};

export default function AdminCampaignsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/templates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: offersData } = useQuery({
    queryKey: ["admin", "offers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/offers");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleSend(id: string) {
    if (!confirm("Send postcards to all agents with a payment method on file via Lob?")) return;
    setSendingId(id);
    try {
      const res = await fetch("/api/postcards/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Mailed ${data.mailed} postcards (${data.failed} failed)`);
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSendingId(null);
    }
  }

  const createMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success("Campaign created");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success("Campaign moved to trash");
    },
    onError: (err) => toast.error(err.message),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "draft" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success("Campaign restored");
    },
    onError: (err) => toast.error(err.message),
  });

  const allCampaigns: (Campaign & { postcard_templates?: { name: string } })[] = data?.campaigns || [];
  const campaigns = showTrash ? allCampaigns : allCampaigns.filter((c) => c.status !== "canceled");
  const canceledCampaigns = allCampaigns.filter((c) => c.status === "canceled");
  const templates = (templatesData?.templates || []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }));

  // Flatten merchants -> offers for the campaign form
  const allOffers = (offersData?.merchants || []).flatMap(
    (m: { name: string; offers: Array<{ id: string; title: string }> }) =>
      (m.offers || []).map((o) => ({ id: o.id, title: o.title, merchant_name: m.name }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showTrash ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTrash(!showTrash)}
          >
            <Archive className="mr-2 h-4 w-4" />
            Trash{canceledCampaigns.length > 0 ? ` (${canceledCampaigns.length})` : ""}
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {!isLoading && campaigns.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No campaigns yet</CardTitle>
            <CardDescription>Create a monthly campaign with selected offers and a postcard template.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Offers</TableHead>
                <TableHead>Mail Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Postcards</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{MONTHS[campaign.month]} {campaign.year}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {campaign.postcard_templates?.name || "—"}
                  </TableCell>
                  <TableCell>{campaign.offer_ids?.length || 0}</TableCell>
                  <TableCell className="text-sm">{campaign.mail_date}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[campaign.status] as "default" | "secondary" | "destructive" | "outline" || "secondary"}>
                      {campaign.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {campaign.total_postcards > 0 ? (
                      <span>{campaign.mailed_count}/{campaign.total_postcards}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/campaigns/${campaign.id}`}>
                            <Eye className="mr-2 h-4 w-4" />View Details
                          </Link>
                        </DropdownMenuItem>
                        {!["canceled", "mailing", "mailed", "completed"].includes(campaign.status) && (
                          <DropdownMenuItem
                            onClick={() => handleSend(campaign.id)}
                            disabled={sendingId === campaign.id}
                          >
                            {sendingId === campaign.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Send Postcards
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "canceled" ? (
                          <DropdownMenuItem onClick={() => restoreMutation.mutate(campaign.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-destructive" onClick={() => {
                            if (confirm("Move this campaign to trash?")) deleteMutation.mutate(campaign.id);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CampaignForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        templates={templates}
        offers={allOffers}
      />
    </div>
  );
}
