"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, CheckCircle, XCircle, Clock, Truck, Loader2, Send } from "lucide-react";
import { useState } from "react";

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

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  queued: "outline",
  mailed: "default",
  in_transit: "default",
  in_local_area: "default",
  delivered: "secondary",
  returned: "destructive",
  failed: "destructive",
};

export default function PostcardsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["my-postcards", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/postcards?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const postcards = data?.postcards || [];
  const total = data?.total || 0;

  // Summary stats
  const delivered = postcards.filter((p: Record<string, unknown>) => p.status === "delivered").length;
  const inTransit = postcards.filter((p: Record<string, unknown>) => ["mailed", "in_transit", "in_local_area"].includes(p.status as string)).length;
  const returned = postcards.filter((p: Record<string, unknown>) => p.status === "returned").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Postcards</h1>
        <p className="text-muted-foreground">
          Track the delivery status of your postcards
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sent</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Transit</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{inTransit}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-green-600">{delivered}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Returned</CardDescription>
            <CardTitle className="text-3xl text-red-600">{returned}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="mailed">Mailed</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : postcards.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No postcards yet</CardTitle>
            <CardDescription>
              Opt into a campaign to start sending postcards to your contacts.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postcards.map((pc: Record<string, unknown>) => {
                const contact = pc.contacts as Record<string, string> | null;
                const campaign = pc.campaigns as Record<string, unknown> | null;
                const status = pc.status as string;
                return (
                  <TableRow key={pc.id as string}>
                    <TableCell className="font-medium">
                      {contact ? `${contact.first_name} ${contact.last_name}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact ? `${contact.city}, ${contact.state}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {campaign ? (campaign.name as string) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[status] || "outline"} className="gap-1">
                        {STATUS_ICONS[status] || <Clock className="h-3 w-3" />}
                        {status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
