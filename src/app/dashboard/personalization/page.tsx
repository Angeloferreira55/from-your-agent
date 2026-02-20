"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandingForm } from "@/components/personalization/BrandingForm";
import { PostcardBack } from "@/components/postcard/PostcardBack";
import { TemplateDesigner } from "@/components/admin/TemplateDesigner";
import { useAgentProfile } from "@/hooks/use-agent-profile";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { DesignConfig, DesignElement } from "@/components/admin/TemplateDesigner";

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
  const [localSeasonalFooter, setLocalSeasonalFooter] = useState<string | null>(null);
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
    mutationFn: async (payload: { design: DesignConfig; seasonal_footer?: string; custom_message?: string }) => {
      // Embed seasonal_footer inside agent_card_design JSON so it persists
      // even if the seasonal_footer DB column doesn't exist
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
      toast.success("Your panel design has been saved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save design"),
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
  let savedSeasonalFooter: string | null = null;
  if (profile?.agent_card_design) {
    const d = profile.agent_card_design as Record<string, unknown>;
    if (d.elements) agentDesign = d as unknown as DesignConfig;
    // Extract seasonal_footer stored inside the design JSON
    if (typeof d._seasonal_footer === "string") savedSeasonalFooter = d._seasonal_footer;
  }

  // Build a default DesignConfig from the profile so the designer opens pre-populated
  function buildDefaultDesign(): DesignConfig {
    const elements: DesignElement[] = [];
    let nextId = 1;
    const id = () => `default-${nextId++}`;
    const brandColor = selectedBrokerage?.brand_color || profile?.brand_color || "#E8733A";

    // Headshot
    if (profile?.photo_url) {
      elements.push({
        id: id(), type: "image",
        x: 3, y: 5, width: 30, height: 80,
        src: profile.photo_url, objectFit: "cover",
      });
    }

    // Agent name
    const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "";
    if (name) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 8, width: 60, height: 10,
        text: name, fontSize: 28, fontWeight: "bold", fontColor: "#111827",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // Tagline
    if (profile?.tagline) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 22, width: 60, height: 8,
        text: profile.tagline, fontSize: 14, fontStyle: "italic", fontColor: brandColor,
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // Company name
    const company = selectedBrokerage?.name || profile?.company_name;
    if (company) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 34, width: 60, height: 8,
        text: company, fontSize: 16, fontWeight: "bold", fontColor: "#374151",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // Phone
    if (profile?.phone) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 48, width: 60, height: 7,
        text: profile.phone, fontSize: 14, fontColor: "#6B7280",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // Email
    if (profile?.email) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 58, width: 60, height: 7,
        text: profile.email, fontSize: 12, fontColor: "#6B7280",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // Website
    if (profile?.website) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 68, width: 60, height: 7,
        text: profile.website, fontSize: 12, fontColor: "#6B7280",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // License
    if (profile?.license_number) {
      elements.push({
        id: id(), type: "text",
        x: 36, y: 78, width: 60, height: 7,
        text: profile.license_number, fontSize: 11, fontColor: "#9CA3AF",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    // Team Logo (top-right of agent panel)
    if (profile?.team_logo_url) {
      elements.push({
        id: id(), type: "image",
        x: 68, y: 5, width: 28, height: 35,
        src: profile.team_logo_url, objectFit: "contain",
      });
    }

    // Personal Message (marked so the designer can identify it)
    if (profile?.custom_message) {
      elements.push({
        id: id(), type: "text", _personalMessage: true,
        x: 3, y: 82, width: 94, height: 10,
        text: profile.custom_message, fontSize: 10, fontColor: "#6B7280",
        fontFamily: "sans-serif", textAlign: "left",
      });
    }

    return {
      background: { color: "#ffffff", imageUrl: "", overlayColor: "rgba(0,0,0,0)" },
      elements,
      disclaimer: "",
    };
  }

  // Use saved design, or build from profile data
  const designerInitial: DesignConfig = agentDesign || buildDefaultDesign();

  async function handleDesignSubmit(data: Record<string, unknown>) {
    const design = data.design as DesignConfig;
    const seasonal_footer = data.seasonal_footer as string | undefined;
    const custom_message = data.custom_message as string | undefined;
    if (seasonal_footer) setLocalSeasonalFooter(seasonal_footer);
    await saveDesignMutation.mutateAsync({ design, seasonal_footer, custom_message });
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
                    Personalize your Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                  brokerageDisclaimer={null}
                  templateDesign={templateDesign}
                  agentCardDesign={agentDesign}
                  seasonalFooter={localSeasonalFooter || savedSeasonalFooter || profile?.seasonal_footer || "auto"}
                />
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
                    Click &quot;Personalize your Card&quot; to customize the bottom-left section with your photo, name, and contact info
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
        initialData={{ design: designerInitial, customMessage: profile?.custom_message || "" }}
      />
    </>
  );
}
