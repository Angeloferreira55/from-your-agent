"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TemplateDesigner, recolorSvgDataUri, type DesignConfig, type FontFamilyOption } from "@/components/admin/TemplateDesigner";

const FONT_MAP: Record<string, string> = {
  "sans-serif": "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  calibri: "Calibri, 'Gill Sans', sans-serif",
  segoe: "'Segoe UI', Tahoma, sans-serif",
  serif: "Georgia, serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  garamond: "Garamond, serif",
  bookman: "'Bookman Old Style', Bookman, serif",
  cambria: "Cambria, Georgia, serif",
  courier: "'Courier New', Courier, monospace",
  consolas: "Consolas, 'Courier New', monospace",
  monaco: "Monaco, 'Courier New', monospace",
  impact: "Impact, 'Arial Black', sans-serif",
  "century-gothic": "'Century Gothic', 'Apple Gothic', sans-serif",
  futura: "Futura, 'Century Gothic', sans-serif",
  "gill-sans": "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  optima: "Optima, 'Segoe UI', sans-serif",
  candara: "Candara, Calibri, sans-serif",
  franklin: "'Franklin Gothic Medium', 'Franklin Gothic', sans-serif",
};
import { Plus, FileImage, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { PostcardTemplate } from "@/types/database";

function parseDesign(backHtml: string): DesignConfig | null {
  try {
    if (backHtml.startsWith("{")) return JSON.parse(backHtml);
  } catch { /* not JSON */ }
  return null;
}

export default function AdminTemplatesPage() {
  const [designerOpen, setDesignerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PostcardTemplate | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/templates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      toast.success("Template created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      toast.success("Template updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      toast.success("Template deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const templates: PostcardTemplate[] = data?.templates || [];

  function handleCreate() {
    setEditingTemplate(null);
    setDesignerOpen(true);
  }

  function handleEdit(template: PostcardTemplate) {
    setEditingTemplate(template);
    setDesignerOpen(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    if (editingTemplate) {
      await updateMutation.mutateAsync({ ...formData, id: editingTemplate.id });
    } else {
      await createMutation.mutateAsync(formData);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brokerage Panel Templates</h1>
            <p className="text-muted-foreground">
              Top-right corner of the postcard back &middot; {templates.length} template{templates.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>

        {!isLoading && templates.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileImage className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No templates yet</CardTitle>
              <CardDescription>Design the brokerage branding panel (top-right of postcard back).</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const design = parseDesign(template.back_html);
              return (
                <Card key={template.id} className="overflow-hidden">
                  {/* Visual preview */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "3/2",
                      backgroundColor: design?.background.colorEnabled !== false ? (design?.background.color || "#1B3A5C") : "transparent",
                    }}
                  >
                    {design?.background.imageUrl && (
                      <img src={design.background.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: design.background.colorEnabled !== false ? 0.3 : 1 }} />
                    )}
                    {design && design.background.colorEnabled !== false && (
                      <div className="absolute inset-0" style={{ backgroundColor: design.background.overlayColor }} />
                    )}
                    {design?.elements.map((el) => (
                      <div
                        key={el.id}
                        className="absolute"
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: `${el.width}%`,
                          height: el.type === "image" ? `${el.height}%` : "auto",
                        }}
                      >
                        {el.type === "text" && (
                          <p
                            className="break-words whitespace-pre-wrap"
                            style={{
                              fontSize: `${(el.fontSize || 16) * 0.35}px`,
                              color: el.fontColor || "#fff",
                              fontWeight: el.fontWeight || "normal",
                              fontStyle: el.fontStyle || "normal",
                              textAlign: el.textAlign || "left",
                              fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                              lineHeight: el.lineHeight || 1.3,
                              letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.35}px` : undefined,
                              textTransform: el.textTransform || "none",
                              opacity: el.opacity ?? 1,
                            }}
                          >
                            {el.text}
                          </p>
                        )}
                        {el.type === "image" && el.src && (
                          <img src={el.tintColor && el.src.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(el.src, el.tintColor) : el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit || "contain" }} />
                        )}
                      </div>
                    ))}
                    {!design && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileImage className="h-8 w-8 text-white/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template.description || "No description"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Delete this template?")) deleteMutation.mutate(template.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">4.5&quot; × 3&quot;</Badge>
                      {template.season && template.season !== "any" && (
                        <Badge variant="secondary">{template.season}</Badge>
                      )}
                      {template.is_default && (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Default</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <TemplateDesigner
        open={designerOpen}
        onClose={() => { setDesignerOpen(false); setEditingTemplate(null); }}
        onSubmit={handleSubmit}
        initialData={editingTemplate ? {
          id: editingTemplate.id,
          name: editingTemplate.name,
          description: editingTemplate.description || "",
          season: editingTemplate.season || "any",
          design: parseDesign(editingTemplate.back_html) || undefined,
        } : undefined}
      />
    </>
  );
}
