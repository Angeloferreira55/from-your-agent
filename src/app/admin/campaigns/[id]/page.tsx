"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Send, Loader2, Mail, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-gray-400" />,
  queued: <Clock className="h-3.5 w-3.5 text-blue-400" />,
  mailed: <Mail className="h-3.5 w-3.5 text-blue-600" />,
  in_transit: <Truck className="h-3.5 w-3.5 text-orange-500" />,
  in_local_area: <Truck className="h-3.5 w-3.5 text-orange-600" />,
  delivered: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
  returned: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-600" />,
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["admin", "campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: postcardsData } = useQuery({
    queryKey: ["admin", "postcards", id],
    queryFn: async () => {
      const res = await fetch(`/api/postcards?campaign_id=${id}&limit=200`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/postcards/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "postcards", id] });
      toast.success(`Mailed ${data.mailed} postcards (${data.failed} failed)`);
    },
    onError: (err) => toast.error(err.message),
  });

  const campaign = campaignData?.campaign || campaignData?.campaigns?.[0];
  const postcards = postcardsData?.postcards || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-muted-foreground py-12 text-center">Campaign not found.</p>;
  }

  const canMail = ["scheduled", "ready_to_mail"].includes(campaign.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">
            {MONTHS[campaign.month]} {campaign.year}
          </p>
        </div>
        <Badge variant={campaign.status === "mailed" || campaign.status === "completed" ? "secondary" : "default"}>
          {campaign.status.replace(/_/g, " ")}
        </Badge>
        {canMail && (
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              if (confirm("This will send postcards to all opted-in agents' contacts via Lob. Continue?")) {
                sendMutation.mutate();
              }
            }}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Postcards
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Postcards</CardDescription>
            <CardTitle className="text-3xl">{campaign.total_postcards || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mailed</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{campaign.mailed_count || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-green-600">{campaign.delivered_count || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Returned</CardDescription>
            <CardTitle className="text-3xl text-red-600">{campaign.returned_count || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Postcards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Postcards</CardTitle>
          <CardDescription>{postcards.length} postcard records</CardDescription>
        </CardHeader>
        <CardContent>
          {postcards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No postcards generated yet. Click &quot;Send Postcards&quot; to start mailing.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lob ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postcards.map((pc: Record<string, unknown>) => {
                    const contact = pc.contacts as Record<string, string> | null;
                    return (
                      <TableRow key={pc.id as string}>
                        <TableCell className="font-medium">
                          {contact ? `${contact.first_name} ${contact.last_name}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact ? `${contact.city}, ${contact.state}` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICONS[pc.status as string] || <Clock className="h-3.5 w-3.5" />}
                            <span className="text-sm capitalize">{(pc.status as string).replace(/_/g, " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {(pc.lob_postcard_id as string) || "—"}
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
