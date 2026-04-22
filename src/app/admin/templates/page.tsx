"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TemplateDesigner, recolorSvgDataUri, type DesignConfig, type BrokerageOption } from "@/components/admin/TemplateDesigner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DEAL_PANEL_LAYOUTS } from "@/lib/deal-panel-templates";

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
import { Plus, FileImage, MoreHorizontal, Trash2, Pencil, Copy, LayoutTemplate, PanelsTopLeft, EyeOff, Eye, Check, Printer, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PostcardTemplate } from "@/types/database";

function parseDesign(html: string): DesignConfig | null {
  try {
    if (html.startsWith("{")) return JSON.parse(html);
  } catch { /* not JSON */ }
  return null;
}

/* ── Reusable preview card — uses iframe with actual Lob renderer ── */
function TemplatePreviewCard({
  design,
  templateId,
  aspectRatio,
}: {
  design: DesignConfig | null;
  templateId?: string;
  aspectRatio: string;
}) {
  if (!design) {
    return (
      <div className="relative overflow-hidden bg-muted/50" style={{ aspectRatio }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <FileImage className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>
    );
  }

  // If we have a templateId, use the Lob renderer via iframe for accurate preview
  if (templateId) {
    const month = new Date().getMonth() + 1;
    return (
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <iframe
          src={`/api/postcards/preview-back?template_id=${templateId}&month=${month}`}
          className="absolute inset-0 w-full h-full border-0 pointer-events-none"
          title="Template preview"
        />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        aspectRatio,
        backgroundColor: design.background.colorEnabled !== false ? (design.background.color || "#1B3A5C") : "transparent",
      }}
    >
      {design.background.imageUrl && (
        <img
          src={design.background.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: design.background.imageFit || "cover",
            opacity: design.background.colorEnabled !== false ? 0.3 : 1,
          }}
        />
      )}
      {design.background.colorEnabled !== false && (
        <div className="absolute inset-0" style={{ backgroundColor: design.background.overlayColor }} />
      )}
      {design.elements.map((el) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width}%`,
            height: el.type === "text" ? "auto" : `${el.height}%`,
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
            el.tintColor ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: el.tintColor,
                  WebkitMaskImage: `url(${el.src})`,
                  maskImage: `url(${el.src})`,
                  WebkitMaskSize: el.objectFit || "contain",
                  maskSize: el.objectFit || "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            ) : (
              <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit || "contain" }} />
            )
          )}
          {el.type === "shape" && (
            <>
              {el.shapeType === "rectangle" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: el.shapeFilled ? (el.shapeColor || "#ffffff") : "transparent",
                    border: !el.shapeFilled ? `${(el.shapeBorderWidth || 2) * 0.35}px solid ${el.shapeColor || "#ffffff"}` : "none",
                    borderRadius: 0,
                    opacity: el.opacity ?? 1,
                  }}
                />
              )}
              {el.shapeType === "circle" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: el.shapeFilled ? (el.shapeColor || "#ffffff") : "transparent",
                    border: !el.shapeFilled ? `${(el.shapeBorderWidth || 2) * 0.35}px solid ${el.shapeColor || "#ffffff"}` : "none",
                    borderRadius: "50%",
                    opacity: el.opacity ?? 1,
                  }}
                />
              )}
              {el.shapeType === "line" && (
                <div
                  className="w-full"
                  style={{
                    height: `${(el.shapeBorderWidth || 2) * 0.35}px`,
                    backgroundColor: el.shapeColor || "#ffffff",
                    transform: el.shapeRotation ? `rotate(${el.shapeRotation}deg)` : undefined,
                    transformOrigin: "center center",
                    position: "absolute",
                    top: "50%",
                    opacity: el.opacity ?? 1,
                  }}
                />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminTemplatesPage() {
  const [designerOpen, setDesignerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PostcardTemplate | null>(null);
  const [designerInitialTab, setDesignerInitialTab] = useState<"front" | "back">("front");
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const queryClient = useQueryClient();

  // All templates (including inactive)
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "templates", "all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/templates?include_deleted=true");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Alias for compatibility
  const allData = data;

  const { data: brokeragesData } = useQuery({
    queryKey: ["brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/brokerages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
  const brokeragesList: BrokerageOption[] = (brokeragesData?.brokerages || []).map((b: { id: string; name: string }) => ({ id: b.id, name: b.name }));

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
      toast.success("Template moved to trash");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      toast.success(is_active ? "Template activated" : "Template deactivated");
    },
    onError: (err) => toast.error(err.message),
  });

  const allTemplates: PostcardTemplate[] = data?.templates || [];
  const templates = allTemplates.filter((t) => t.type === "monthly");

  // Split templates by which sides have content
  const frontTemplates = templates.filter((t) => t.front_html && parseDesign(t.front_html));
  const offerPanelTemplates = templates.filter((t) => t.back_html && parseDesign(t.back_html));

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // Clear is_default from all other monthly front templates, then set the selected one
      const otherDefaults = frontTemplates.filter((t) => t.is_default && t.id !== id);
      await Promise.all(
        otherDefaults.map((t) =>
          fetch("/api/admin/templates", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: t.id, is_default: false }),
          })
        )
      );
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_default: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      toast.success("Template set for printing");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCreate(tab: "front" | "back") {
    if (tab === "back") {
      setLayoutPickerOpen(true);
      return;
    }
    setEditingTemplate(null);
    setDesignerInitialTab(tab);
    setDesignerOpen(true);
  }

  function handleLayoutPick(layout: typeof DEAL_PANEL_LAYOUTS[number] | null) {
    setLayoutPickerOpen(false);
    setEditingTemplate(null);
    setDesignerInitialTab("back");
    if (layout) {
      // Open designer pre-populated with the selected layout
      setEditingTemplate({
        id: "",
        name: "",
        description: null,
        size: "6x9",
        type: "monthly",
        brokerage_id: null,
        front_html: "",
        back_html: JSON.stringify(layout.build()),
        front_preview_url: null,
        back_preview_url: null,
        merge_variables: [],
        is_default: false,
        is_active: true,
        season: null,
        created_at: "",
        updated_at: "",
      });
    }
    setDesignerOpen(true);
  }

  function handleEdit(template: PostcardTemplate, tab: "front" | "back") {
    setEditingTemplate(template);
    setDesignerInitialTab(tab);
    setDesignerOpen(true);
  }

  function handleDuplicate(template: PostcardTemplate) {
    setEditingTemplate({
      ...template,
      id: "",
      name: `${template.name} (Copy)`,
    });
    setDesignerInitialTab("front");
    setDesignerOpen(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    if (editingTemplate?.id) {
      await updateMutation.mutateAsync({ ...formData, id: editingTemplate.id });
    } else {
      await createMutation.mutateAsync(formData);
    }
  }

  function TemplateCard({ template, side }: { template: PostcardTemplate; side: "front" | "back" }) {
    const design = side === "front"
      ? (template.front_html ? parseDesign(template.front_html) : null)
      : parseDesign(template.back_html);
    const isInactive = !template.is_active;

    return (
      <Card className={cn("overflow-hidden", isInactive && "opacity-60")}>
        <TemplatePreviewCard design={design} templateId={template.id || undefined} aspectRatio="3/2" />
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
                <DropdownMenuItem onClick={() => handleEdit(template, side)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleActiveMutation.mutate({ id: template.id, is_active: !template.is_active })}>
                  {isInactive ? (
                    <><Eye className="mr-2 h-4 w-4" /> Activate</>
                  ) : (
                    <><EyeOff className="mr-2 h-4 w-4" /> Deactivate</>
                  )}
                </DropdownMenuItem>
                {side === "front" && !isInactive && (
                  <DropdownMenuItem onClick={async () => {
                    if (!confirm("Send a test print to your office address?")) return;
                    try {
                      const res = await fetch("/api/postcards/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ template_id: template.id }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      toast.success(`Test print sent! ${data.mailed} postcard(s) queued.`);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to send test");
                    }
                  }}>
                    <Send className="mr-2 h-4 w-4" /> Send Test Print
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Permanently delete this template?")) deleteMutation.mutate(template.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Status badges */}
          {(isInactive || template.is_default) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isInactive && (
                <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
              )}
              {template.is_default && side === "front" && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Printer className="mr-1 h-3 w-3" /> Selected for Print
                </Badge>
              )}
            </div>
          )}
          {/* Use This Template button — only for active front templates */}
          {side === "front" && !isInactive && !template.is_default && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => setDefaultMutation.mutate(template.id)}
              disabled={setDefaultMutation.isPending}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Use This Template
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">
              Monthly postcard designs · {templates.filter(t => t.is_active).length} active, {templates.filter(t => !t.is_active).length} inactive
            </p>
          </div>
        </div>

        {/* ── Section 1: Front Designs ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Front Designs</h2>
                <p className="text-sm text-muted-foreground">Full 6&quot; × 9&quot; postcard front</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleCreate("front")}>
              <Plus className="mr-2 h-4 w-4" />
              New Front
            </Button>
          </div>

          {!isLoading && frontTemplates.length === 0 ? (
            <Card>
              <CardHeader className="text-center py-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">No front designs yet</CardTitle>
                <CardDescription>Create front designs for your monthly postcards (Christmas, Thanksgiving, etc.).</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {frontTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} side="front" />
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: Offer Panels ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Offer Panels</h2>
                <p className="text-sm text-muted-foreground">Back top-left · 4.5&quot; × 3&quot; · deal &amp; business details</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleCreate("back")}>
              <Plus className="mr-2 h-4 w-4" />
              New Offer Panel
            </Button>
          </div>

          {!isLoading && offerPanelTemplates.length === 0 ? (
            <Card>
              <CardHeader className="text-center py-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <PanelsTopLeft className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">No offer panels yet</CardTitle>
                <CardDescription>Create offer panel designs with business details and deal info.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerPanelTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} side="back" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layout Picker Dialog */}
      <Dialog open={layoutPickerOpen} onOpenChange={setLayoutPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose a Starting Layout</DialogTitle>
            <DialogDescription>
              Pick a layout to start with, or start from scratch
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {DEAL_PANEL_LAYOUTS.map((layout) => {
              const preview = layout.build();
              return (
                <button
                  key={layout.key}
                  onClick={() => handleLayoutPick(layout)}
                  className="group rounded-lg border-2 border-gray-200 p-2 transition-all hover:border-orange-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 text-left"
                >
                  <TemplatePreviewCard design={preview} aspectRatio="3/2" />
                  <p className="mt-1.5 text-xs font-medium text-gray-700 group-hover:text-orange-600">
                    {layout.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{layout.description}</p>
                </button>
              );
            })}
          </div>
          <Button variant="outline" className="w-full" onClick={() => handleLayoutPick(null)}>
            Start from Scratch
          </Button>
        </DialogContent>
      </Dialog>

      <TemplateDesigner
        open={designerOpen}
        onClose={() => { setDesignerOpen(false); setEditingTemplate(null); }}
        onSubmit={handleSubmit}
        brokerages={brokeragesList}
        initialTab={designerInitialTab}
        initialData={editingTemplate ? {
          id: editingTemplate.id || undefined,
          name: editingTemplate.name,
          description: editingTemplate.description || "",
          season: editingTemplate.season || "any",
          type: "monthly",
          brokerage_id: editingTemplate.brokerage_id,
          design: parseDesign(editingTemplate.back_html) || undefined,
          frontDesign: editingTemplate.front_html ? parseDesign(editingTemplate.front_html) || undefined : undefined,
        } : {
          type: "monthly",
        }}
      />
    </>
  );
}
