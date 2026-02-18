"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BrandingForm } from "@/components/personalization/BrandingForm";
import { PostcardFront } from "@/components/postcard/PostcardFront";
import { PostcardBack } from "@/components/postcard/PostcardBack";
import { TemplateDesigner } from "@/components/admin/TemplateDesigner";
import { useAgentProfile } from "@/hooks/use-agent-profile";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { DesignConfig } from "@/components/admin/TemplateDesigner";

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
  const [previewSide, setPreviewSide] = useState<"front" | "back">("back");
  const [designerOpen, setDesignerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: brokeragesData } = useQuery({
    queryKey: ["brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/brokerages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: templateData } = useQuery({
    queryKey: ["brokerage-template", profile?.brokerage_id],
    queryFn: async () => {
      const url = profile?.brokerage_id
        ? `/api/templates?brokerage_id=${profile.brokerage_id}`
        : "/api/templates";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!profile,
  });

  const saveDesignMutation = useMutation({
    mutationFn: async (design: DesignConfig) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_card_design: design }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
      toast.success("Your panel design has been saved");
    },
    onError: () => toast.error("Failed to save design"),
  });

  const brokerages: BrokerageConfig[] = brokeragesData?.brokerages || [];
  const selectedBrokerage = profile?.brokerage_id
    ? brokerages.find((b) => b.id === profile.brokerage_id) || null
    : null;

  // Parse the brokerage template design config
  let templateDesign: DesignConfig | null = null;
  if (templateData?.template?.back_html) {
    try {
      const parsed = JSON.parse(templateData.template.back_html);
      if (parsed.elements) templateDesign = parsed;
    } catch { /* not JSON */ }
  }

  // Parse the agent's bottom-left card design
  let agentDesign: DesignConfig | null = null;
  if (profile?.agent_card_design) {
    const d = profile.agent_card_design as Record<string, unknown>;
    if (d.elements) agentDesign = d as unknown as DesignConfig;
  }

  async function handleDesignSubmit(data: Record<string, unknown>) {
    const design = data.design as DesignConfig;
    await saveDesignMutation.mutateAsync(design);
  }

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
          <BrandingForm />

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      See how your postcard looks as you make changes
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDesignerOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Design Your Panel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={previewSide} onValueChange={(v) => setPreviewSide(v as "front" | "back")}>
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="back" className="flex-1">Back (Your Side)</TabsTrigger>
                    <TabsTrigger value="front" className="flex-1">Front (Offers)</TabsTrigger>
                  </TabsList>

                  <TabsContent value="back">
                    <PostcardBack
                      agentName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
                      companyName={selectedBrokerage?.name || profile?.company_name}
                      tagline={profile?.tagline}
                      customMessage={profile?.custom_message}
                      phone={profile?.phone}
                      email={profile?.email}
                      website={profile?.website}
                      licenseNumber={profile?.license_number}
                      teamLogoUrl={profile?.team_logo_url}
                      brokerageLogoUrl={selectedBrokerage?.logo_url || profile?.brokerage_logo_url}
                      photoUrl={profile?.photo_url}
                      brandColor={selectedBrokerage?.brand_color || profile?.brand_color}
                      brokeragePhone={profile?.brokerage_phone}
                      brokerageAddress={
                        profile?.brokerage_address_line1
                          ? [
                              profile.brokerage_address_line1,
                              profile.brokerage_address_line2,
                              [profile.brokerage_city, profile.brokerage_state, profile.brokerage_zip].filter(Boolean).join(", "),
                            ].filter(Boolean).join(", ")
                          : null
                      }
                      visibleFields={profile?.postcard_visible_fields}
                      brokerageSlogan={selectedBrokerage?.slogan}
                      brokerageBackgroundUrl={selectedBrokerage?.background_url}
                      brokerageOverlayColor={selectedBrokerage?.overlay_color}
                      brokerageTextColor={selectedBrokerage?.text_color}
                      brokerageSocialLinks={selectedBrokerage?.social_links}
                      brokerageDisclaimer={selectedBrokerage?.disclaimer}
                      templateDesign={templateDesign}
                      agentCardDesign={agentDesign}
                    />
                  </TabsContent>

                  <TabsContent value="front">
                    <PostcardFront
                      agentName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
                      brokerageLogoUrl={selectedBrokerage?.logo_url || profile?.brokerage_logo_url}
                      brandColor={selectedBrokerage?.brand_color || profile?.brand_color}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Tips card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tips for a great postcard</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">•</span>
                    Use a professional headshot with good lighting
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">•</span>
                    Upload a high-resolution team logo if you have one (PNG with transparent background works best)
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">•</span>
                    Click &quot;Design Your Panel&quot; to customize the bottom-left section with your photo, name, and contact info
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-orange-500">•</span>
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
        initialData={agentDesign ? { design: agentDesign } : undefined}
      />
    </>
  );
}
