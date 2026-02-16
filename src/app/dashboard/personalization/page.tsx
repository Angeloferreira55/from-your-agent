"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandingForm } from "@/components/personalization/BrandingForm";
import { PostcardFront } from "@/components/postcard/PostcardFront";
import { PostcardBack } from "@/components/postcard/PostcardBack";
import { useAgentProfile } from "@/hooks/use-agent-profile";

export default function PersonalizationPage() {
  const { data: profile } = useAgentProfile();
  const [previewSide, setPreviewSide] = useState<"front" | "back">("back");

  return (
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
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your postcard looks as you make changes
              </CardDescription>
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
                    companyName={profile?.company_name}
                    tagline={profile?.tagline}
                    customMessage={profile?.custom_message}
                    phone={profile?.phone}
                    email={profile?.email}
                    website={profile?.website}
                    licenseNumber={profile?.license_number}
                    teamLogoUrl={profile?.team_logo_url}
                    brokerageLogoUrl={profile?.brokerage_logo_url}
                    photoUrl={profile?.photo_url}
                    brandColor={profile?.brand_color}
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
                  />
                </TabsContent>

                <TabsContent value="front">
                  <PostcardFront
                    agentName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
                    brokerageLogoUrl={profile?.brokerage_logo_url}
                    brandColor={profile?.brand_color}
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
                  Upload a high-resolution logo (PNG with transparent background works best)
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-orange-500">•</span>
                  Keep your message personal and warm — recipients should feel valued
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-orange-500">•</span>
                  Choose a brand color that matches your company branding
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
