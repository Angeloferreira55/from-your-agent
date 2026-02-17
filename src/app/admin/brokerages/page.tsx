"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrokerageForm } from "@/components/admin/BrokerageForm";
import { Plus, Building2, MoreHorizontal, Pencil, Trash2, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { BrokerageConfig } from "@/data/brokerages";

export default function AdminBrokeragesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrokerage, setEditingBrokerage] = useState<BrokerageConfig | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brokerages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/admin/brokerages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brokerages"] });
      toast.success("Brokerage created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/admin/brokerages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brokerages"] });
      toast.success("Brokerage updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/brokerages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brokerages"] });
      toast.success("Brokerage deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const brokerages: BrokerageConfig[] = data?.brokerages || [];

  function handleEdit(brokerage: BrokerageConfig) {
    setEditingBrokerage(brokerage);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingBrokerage(null);
    setFormOpen(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    if (editingBrokerage) {
      await updateMutation.mutateAsync(formData);
    } else {
      await createMutation.mutateAsync(formData);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brokerages</h1>
          <p className="text-muted-foreground">
            {brokerages.length} brokerage{brokerages.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brokerage
        </Button>
      </div>

      {!isLoading && brokerages.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No brokerages yet</CardTitle>
            <CardDescription>Add brokerage configurations for postcard branding.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brokerages.map((brokerage) => (
            <Card key={brokerage.id} className="overflow-hidden">
              {/* Color banner with logo */}
              <div
                className="relative h-24 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: brokerage.brandColor }}
              >
                {brokerage.backgroundUrl && (
                  <img
                    src={brokerage.backgroundUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: brokerage.overlayColor }}
                />
                <div className="relative z-10 flex flex-col items-center gap-1">
                  {brokerage.logoUrl && (
                    <img
                      src={brokerage.logoUrl}
                      alt={brokerage.name}
                      className="h-10 w-auto object-contain"
                    />
                  )}
                  {brokerage.slogan && (
                    <p
                      className="text-[10px] font-serif italic text-center leading-tight max-w-[160px]"
                      style={{ color: brokerage.textColor }}
                    >
                      {brokerage.slogan.replace(/\n/g, " ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{brokerage.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{brokerage.id}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(brokerage)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Delete ${brokerage.name}?`)) {
                            deleteMutation.mutate(brokerage.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Details */}
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: brokerage.brandColor }}
                    title={brokerage.brandColor}
                  />
                  {brokerage.website && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {brokerage.website}
                    </span>
                  )}
                </div>

                {/* Social links count */}
                {brokerage.socialLinks && Object.keys(brokerage.socialLinks).length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(brokerage.socialLinks).length} social link{Object.keys(brokerage.socialLinks).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <BrokerageForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editingBrokerage={editingBrokerage}
      />
    </div>
  );
}
