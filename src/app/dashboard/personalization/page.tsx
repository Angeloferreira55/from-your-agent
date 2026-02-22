"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandingForm } from "@/components/personalization/BrandingForm";
import { TemplatePicker } from "@/components/personalization/TemplatePicker";
import { TemplateDesigner } from "@/components/admin/TemplateDesigner";
import { useAgentProfile } from "@/hooks/use-agent-profile";
import { PANEL_TEMPLATES, profileToTemplateData } from "@/lib/agent-panel-templates";
import { Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { DesignConfig, DesignElement } from "@/components/admin/TemplateDesigner";
import type { PanelTemplate } from "@/lib/agent-panel-templates";

interface BrokerageConfig {
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

export default function PersonalizationPage() {
  const { data: profile } = useAgentProfile();
  const [designerOpen, setDesignerOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const queryClient = useQueryClient();

  const refreshPreview = useCallback(() => setPreviewKey((k) => k + 1), []);

  const { data: brokeragesData } = useQuery({
    queryKey: ["brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/brokerages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const saveDesignMutation = useMutation({
    mutationFn: async (payload: { design: DesignConfig; seasonal_footer?: string; custom_message?: string }) => {
      const designWithFooter = { ...payload.design } as Record<string, unknown>;
      if (payload.seasonal_footer !== undefined) {
        designWithFooter._seasonal_footer = payload.seasonal_footer;
      }
      const body: Record<string, unknown> = { agent_card_design: designWithFooter };
      if (payload.seasonal_footer !== undefined) body.seasonal_footer = payload.seasonal_footer;
      if (payload.custom_message !== undefined) body.custom_message = payload.custom_message;
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
      refreshPreview();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save design"),
  });

  const brokerages: BrokerageConfig[] = brokeragesData?.brokerages || [];
  const selectedBrokerage = profile?.brokerage_id
    ? brokerages.find((b) => b.id === profile.brokerage_id) || null
    : null;

  // Detect which template key is active (if any)
  const activeTemplateKey = useMemo(() => {
    const d = profile?.agent_card_design as Record<string, unknown> | null;
    return (d?._templateKey as string) || null;
  }, [profile?.agent_card_design]);

  // Parse the agent's bottom-left card design
  let agentDesign: DesignConfig | null = null;
  if (profile?.agent_card_design) {
    const d = profile.agent_card_design as Record<string, unknown>;
    if (d.elements) agentDesign = d as unknown as DesignConfig;
  }

  // Build a default DesignConfig from the profile so the designer opens pre-populated
  function buildDefaultDesign(): DesignConfig {
    const elements: DesignElement[] = [];
    let nextId = 1;
    const id = () => `default-${nextId++}`;
    const brandColor = selectedBrokerage?.brand_color || profile?.brand_color || "#E8733A";

    if (profile?.photo_url) {
      elements.push({ id: id(), type: "image", x: 3, y: 5, width: 30, height: 80, src: profile.photo_url, objectFit: "cover" });
    }
    const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "";
    if (name) {
      elements.push({ id: id(), type: "text", x: 36, y: 8, width: 60, height: 10, text: name, fontSize: 28, fontWeight: "bold", fontColor: "#111827", fontFamily: "sans-serif", textAlign: "left" });
    }
    if (profile?.tagline) {
      elements.push({ id: id(), type: "text", x: 36, y: 22, width: 60, height: 8, text: profile.tagline, fontSize: 14, fontStyle: "italic", fontColor: brandColor, fontFamily: "sans-serif", textAlign: "left" });
    }
    const company = selectedBrokerage?.name || profile?.company_name;
    if (company) {
      elements.push({ id: id(), type: "text", x: 36, y: 34, width: 60, height: 8, text: company, fontSize: 16, fontWeight: "bold", fontColor: "#374151", fontFamily: "sans-serif", textAlign: "left" });
    }
    if (profile?.phone) {
      elements.push({ id: id(), type: "text", x: 36, y: 48, width: 60, height: 7, text: profile.phone, fontSize: 14, fontColor: "#6B7280", fontFamily: "sans-serif", textAlign: "left" });
    }
    if (profile?.email) {
      elements.push({ id: id(), type: "text", x: 36, y: 58, width: 60, height: 7, text: profile.email, fontSize: 12, fontColor: "#6B7280", fontFamily: "sans-serif", textAlign: "left" });
    }
    if (profile?.website) {
      elements.push({ id: id(), type: "text", x: 36, y: 68, width: 60, height: 7, text: profile.website, fontSize: 12, fontColor: "#6B7280", fontFamily: "sans-serif", textAlign: "left" });
    }
    if (profile?.license_number) {
      elements.push({ id: id(), type: "text", x: 36, y: 78, width: 60, height: 7, text: profile.license_number, fontSize: 11, fontColor: "#9CA3AF", fontFamily: "sans-serif", textAlign: "left" });
    }
    if (profile?.team_logo_url) {
      elements.push({ id: id(), type: "image", x: 68, y: 5, width: 28, height: 35, src: profile.team_logo_url, objectFit: "contain" });
    }
    if (profile?.custom_message) {
      elements.push({ id: id(), type: "text", _personalMessage: true, x: 3, y: 82, width: 94, height: 10, text: profile.custom_message, fontSize: 10, fontColor: "#6B7280", fontFamily: "sans-serif", textAlign: "left" });
    }

    return {
      background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
      elements,
      disclaimer: "",
    };
  }

  const designerInitial: DesignConfig = agentDesign || buildDefaultDesign();

  async function handleDesignSubmit(data: Record<string, unknown>) {
    const design = data.design as DesignConfig;
    const seasonal_footer = data.seasonal_footer as string | undefined;
    const custom_message = data.custom_message as string | undefined;
    // Custom designer clears template key
    await saveDesignMutation.mutateAsync({ design, seasonal_footer, custom_message });
    toast.success("Your panel design has been saved");
  }

  // When an agent picks a pre-made template
  async function handleTemplatePick(template: PanelTemplate) {
    if (!profile) return;
    const data = profileToTemplateData(profile);
    const design = template.build(data);
    // Stamp the template key so we know which one is active
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (design as any)._templateKey = template.key;
    // Preserve seasonal footer preference
    const existingDesign = profile.agent_card_design as Record<string, unknown> | null;
    if (existingDesign?._seasonal_footer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (design as any)._seasonal_footer = existingDesign._seasonal_footer;
    }
    await saveDesignMutation.mutateAsync({ design });
    toast.success(`Applied "${template.label}" layout`);
  }

  // Called by BrandingForm after saving — regenerate card from template if one is active
  const handleBrandingSaved = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ["agent-profile"] });
    if (!activeTemplateKey) {
      // No active template — just refresh the preview so updated profile data (team logo, etc.) appears
      refreshPreview();
      return;
    }
    const freshProfile = queryClient.getQueryData<typeof profile>(["agent-profile"]);
    if (!freshProfile) return;
    const template = PANEL_TEMPLATES.find((t) => t.key === activeTemplateKey);
    if (!template) return;
    const data = profileToTemplateData(freshProfile);
    const design = template.build(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (design as any)._templateKey = activeTemplateKey;
    const existingDesign = freshProfile.agent_card_design as Record<string, unknown> | null;
    if (existingDesign?._seasonal_footer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (design as any)._seasonal_footer = existingDesign._seasonal_footer;
    }
    await saveDesignMutation.mutateAsync({ design });
  }, [activeTemplateKey, queryClient, saveDesignMutation, refreshPreview]);

  const brandColor = selectedBrokerage?.brand_color || profile?.brand_color || "#E8733A";

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personalization</h1>
          <p className="text-muted-foreground">
            Customize the back of your postcards with your branding
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Branding Form */}
          <BrandingForm onSaved={handleBrandingSaved} />

          {/* Right: Template Gallery + Live Preview */}
          <div className="space-y-4">
            {/* Template Picker */}
            <TemplatePicker
              activeKey={activeTemplateKey}
              onSelect={handleTemplatePick}
              brandColor={brandColor}
            />

            {/* Live Preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      This is exactly what gets printed
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDesignerOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Customize
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ aspectRatio: "1387.5 / 937.5" }}>
                  <iframe
                    key={previewKey}
                    src={`/api/postcards/preview-back?_t=${previewKey}`}
                    className="absolute inset-0 w-full h-full border rounded-md"
                    title="Postcard back preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={refreshPreview}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Refresh Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tips for a great postcard</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">&bull;</span>
                    Use a professional headshot with good lighting
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">&bull;</span>
                    Upload a high-resolution team logo (PNG with transparent background works best)
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">&bull;</span>
                    Pick a template above, or click &quot;Customize&quot; for full control
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">&bull;</span>
                    Select your brokerage to auto-fill branding (logo, colors, slogan)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TemplateDesigner
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        onSubmit={handleDesignSubmit}
        mode="agent"
        initialData={{ design: designerInitial, customMessage: profile?.custom_message || "" }}
      />
    </>
  );
}
