"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RegionForm } from "@/components/admin/RegionForm";
import { Plus, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Region } from "@/types/database";

export default function AdminRegionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "regions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/regions");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const method = formData.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/regions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "regions"] });
      toast.success(editingRegion ? "Region updated" : "Region created");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/regions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "regions"] });
      toast.success("Region deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const regions: Region[] = data?.regions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
          <p className="text-muted-foreground">
            {regions.length} geographic zone{regions.length !== 1 ? "s" : ""} defined
          </p>
        </div>
        <Button onClick={() => { setEditingRegion(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </div>

      {!isLoading && regions.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No regions defined</CardTitle>
            <CardDescription>Create geographic regions with zip codes for offer geotargeting.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead>States</TableHead>
                <TableHead>ZIP Codes</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{region.description || "—"}</TableCell>
                  <TableCell>{region.radius_miles} mi</TableCell>
                  <TableCell>
                    {region.state_codes?.map((s) => (
                      <Badge key={s} variant="outline" className="mr-1">{s}</Badge>
                    )) || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {region.zip_codes ? `${region.zip_codes.length} codes` : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingRegion(region); setFormOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => {
                          if (confirm("Delete this region?")) deleteMutation.mutate(region.id);
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RegionForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingRegion(null); }}
        region={editingRegion}
        onSubmit={(data) => saveMutation.mutateAsync(data)}
      />
    </div>
  );
}
