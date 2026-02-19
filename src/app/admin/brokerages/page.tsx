"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrokerageForm } from "@/components/admin/BrokerageForm";
import { TemplateDesigner, recolorSvgDataUri, type DesignConfig, type BrokerageOption } from "@/components/admin/TemplateDesigner";
import { Plus, Building2, MoreHorizontal, Pencil, Trash2, Globe, ExternalLink, FileImage, Copy } from "lucide-react";
import { toast } from "sonner";
import type { PostcardTemplate } from "@/types/database";

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

interface BrokerageRecord {
  id: string;
  name: string;
  slogan: string;
  website: string;
  logo_url: string;
  second_logo_url: string | null;
  background_url: string;
  brand_color: string;
  overlay_color: string;
  text_color: string;
  social_links: Record<string, string>;
  disclaimer: string;
}

function parseDesign(html: string): DesignConfig | null {
  try {
    if (html.startsWith("{")) return JSON.parse(html);
  } catch { /* not JSON */ }
  return null;
}

function TemplatePreview({ design }: { design: DesignConfig | null }) {
  return (
    <div
      className="relative overflow-hidden rounded border"
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
                fontSize: `${(el.fontSize || 16) * 0.25}px`,
                color: el.fontColor || "#fff",
                fontWeight: el.fontWeight || "normal",
                fontStyle: el.fontStyle || "normal",
                textAlign: el.textAlign || "left",
                fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                lineHeight: el.lineHeight || 1.3,
                letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.25}px` : undefined,
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
          <FileImage className="h-5 w-5 text-white/40" />
        </div>
      )}
    </div>
  );
}

export default function AdminBrokeragesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrokerage, setEditingBrokerage] = useState<BrokerageRecord | null>(null);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PostcardTemplate | null>(null);
  const [designerBrokerageId, setDesignerBrokerageId] = useState<string | null>(null);
  const [designerAutoName, setDesignerAutoName] = useState("");
  const queryClient = useQueryClient();

  // Fetch brokerages
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brokerages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/templates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const brokerages: BrokerageRecord[] = data?.brokerages || [];
  const allTemplates: PostcardTemplate[] = templatesData?.templates || [];
  const brokerageTemplates = allTemplates.filter((t) => t.type === "brokerage");
  const brokeragesList: BrokerageOption[] = brokerages.map((b) => ({ id: b.id, name: b.name }));

  // Group templates by brokerage_id
  const templatesByBrokerage = new Map<string, PostcardTemplate[]>();
  const unlinkedTemplates: PostcardTemplate[] = [];
  for (const t of brokerageTemplates) {
    if (t.brokerage_id) {
      const arr = templatesByBrokerage.get(t.brokerage_id) || [];
      arr.push(t);
      templatesByBrokerage.set(t.brokerage_id, arr);
    } else {
      unlinkedTemplates.push(t);
    }
  }

  // Brokerage CRUD
  const createBrokerageMutation = useMutation({
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

  const updateBrokerageMutation = useMutation({
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

  const deleteBrokerageMutation = useMutation({
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

  // Template CRUD
  const createTemplateMutation = useMutation({
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
      toast.success("Ad template created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTemplateMutation = useMutation({
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
      toast.success("Ad template updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTemplateMutation = useMutation({
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
      toast.success("Ad template deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Brokerage handlers
  function handleEditBrokerage(brokerage: BrokerageRecord) {
    setEditingBrokerage(brokerage);
    setFormOpen(true);
  }

  function handleAddBrokerage() {
    setEditingBrokerage(null);
    setFormOpen(true);
  }

  async function handleBrokerageSubmit(formData: Record<string, unknown>) {
    if (editingBrokerage) {
      await updateBrokerageMutation.mutateAsync(formData);
    } else {
      await createBrokerageMutation.mutateAsync(formData);
    }
  }

  // Template handlers
  function handleCreateAd(brokerageId: string | null) {
    setEditingTemplate(null);
    setDesignerBrokerageId(brokerageId);
    // Auto-generate a name based on brokerage + count
    const brok = brokerages.find((b) => b.id === brokerageId);
    const existing = brokerageId ? (templatesByBrokerage.get(brokerageId) || []).length : unlinkedTemplates.length;
    const autoName = brok ? `${brok.name} Ad ${existing + 1}` : `General Ad ${existing + 1}`;
    setDesignerAutoName(autoName);
    setDesignerOpen(true);
  }

  function handleEditAd(template: PostcardTemplate) {
    setEditingTemplate(template);
    setDesignerBrokerageId(template.brokerage_id);
    setDesignerOpen(true);
  }

  function handleDuplicateAd(template: PostcardTemplate) {
    setEditingTemplate({
      ...template,
      id: "",
      name: `${template.name} (Copy)`,
    });
    setDesignerBrokerageId(template.brokerage_id);
    setDesignerOpen(true);
  }

  async function handleAdSubmit(formData: Record<string, unknown>) {
    if (editingTemplate?.id) {
      await updateTemplateMutation.mutateAsync({ ...formData, id: editingTemplate.id });
    } else {
      await createTemplateMutation.mutateAsync(formData);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brokerages</h1>
            <p className="text-muted-foreground">
              {brokerages.length} brokerage{brokerages.length !== 1 ? "s" : ""} · {brokerageTemplates.length} ad template{brokerageTemplates.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={handleAddBrokerage}>
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
          <div className="space-y-6">
            {brokerages.map((brokerage) => {
              const templates = templatesByBrokerage.get(brokerage.id) || [];
              return (
                <Card key={brokerage.id} className="overflow-hidden">
                  {/* Banner + info row */}
                  <div className="flex">
                    {/* Color banner */}
                    <div
                      className="relative w-48 shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: brokerage.brand_color }}
                    >
                      {brokerage.background_url && (
                        <img src={brokerage.background_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                      )}
                      <div className="absolute inset-0" style={{ backgroundColor: brokerage.overlay_color }} />
                      <div className="relative z-10 flex flex-col items-center gap-1 p-3">
                        {brokerage.logo_url && (
                          <img src={brokerage.logo_url} alt={brokerage.name} className="h-10 w-auto object-contain" />
                        )}
                        {brokerage.slogan && (
                          <p className="text-[9px] font-serif italic text-center leading-tight max-w-[140px]" style={{ color: brokerage.text_color }}>
                            {brokerage.slogan.replace(/\n/g, " ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Info section */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base">{brokerage.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{brokerage.id}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: brokerage.brand_color }} title={brokerage.brand_color} />
                            {brokerage.website && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="h-3 w-3" /> {brokerage.website}
                              </span>
                            )}
                            {brokerage.social_links && Object.keys(brokerage.social_links).length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ExternalLink className="h-3 w-3" /> {Object.keys(brokerage.social_links).length} social
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBrokerage(brokerage)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete ${brokerage.name}?`)) deleteBrokerageMutation.mutate(brokerage.id); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Ad templates section */}
                  <div className="border-t bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Ad Templates ({templates.length})
                      </p>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleCreateAd(brokerage.id)}>
                        <Plus className="mr-1 h-3 w-3" /> New Ad
                      </Button>
                    </div>
                    {templates.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No ad templates yet. Create one to design the brokerage panel for postcards.</p>
                    ) : (
                      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {templates.map((template) => {
                          const design = parseDesign(template.back_html);
                          return (
                            <div key={template.id} className="group relative">
                              <TemplatePreview design={design} />
                              <div className="mt-1.5 flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{template.name}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {template.season && template.season !== "any" && (
                                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{template.season}</Badge>
                                    )}
                                    {template.is_default && (
                                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-[9px] px-1 py-0">Default</Badge>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditAd(template)}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicateAd(template)}>
                                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => { if (confirm("Delete this ad template?")) deleteTemplateMutation.mutate(template.id); }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {/* General (unlinked) brokerage templates */}
            {unlinkedTemplates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">General Templates</h2>
                    <p className="text-xs text-muted-foreground">Brokerage templates not linked to a specific brokerage</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCreateAd(null)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> New General Ad
                  </Button>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {unlinkedTemplates.map((template) => {
                    const design = parseDesign(template.back_html);
                    return (
                      <div key={template.id} className="group relative">
                        <TemplatePreview design={design} />
                        <div className="mt-1.5 flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{template.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {template.season && template.season !== "any" && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">{template.season}</Badge>
                              )}
                              {template.is_default && (
                                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-[9px] px-1 py-0">Default</Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditAd(template)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateAd(template)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { if (confirm("Delete this ad template?")) deleteTemplateMutation.mutate(template.id); }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BrokerageForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleBrokerageSubmit}
        editingBrokerage={editingBrokerage}
      />

      <TemplateDesigner
        open={designerOpen}
        onClose={() => { setDesignerOpen(false); setEditingTemplate(null); setDesignerBrokerageId(null); setDesignerAutoName(""); }}
        onSubmit={handleAdSubmit}
        brokerages={brokeragesList}
        initialData={editingTemplate ? {
          id: editingTemplate.id || undefined,
          name: editingTemplate.name,
          description: editingTemplate.description || "",
          season: editingTemplate.season || "any",
          type: "brokerage",
          brokerage_id: editingTemplate.brokerage_id,
          design: parseDesign(editingTemplate.back_html) || undefined,
        } : designerBrokerageId ? {
          name: designerAutoName,
          type: "brokerage",
          brokerage_id: designerBrokerageId,
        } : {
          name: designerAutoName,
          type: "brokerage",
        }}
      />
    </>
  );
}
