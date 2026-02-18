"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostcardFront } from "@/components/postcard/PostcardFront";
import { PostcardBack } from "@/components/postcard/PostcardBack";
import { OfferMatchPreview } from "@/components/campaigns/OfferMatchPreview";
import { useAgentProfile } from "@/hooks/use-agent-profile";
import { useAgentCampaigns, useOptInCampaign, useOptOutCampaign } from "@/hooks/use-campaigns";
import { Send, Eye, Check, X, Loader2, Calendar, Users, Mail } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/types/database";
import type { DesignConfig } from "@/components/admin/TemplateDesigner";

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type EnrichedCampaign = Campaign & {
  postcard_templates?: { name: string; size: string };
  my_participation?: { id: string; opted_in: boolean; contact_count: number; total_cost: number } | null;
};

export default function CampaignsPage() {
  const { data: profile } = useAgentProfile();
  const { data: campaigns, isLoading } = useAgentCampaigns();
  const optIn = useOptInCampaign();
  const optOut = useOptOutCampaign();

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
  let campaignTemplateDesign: DesignConfig | null = null;
  if (templateData?.template?.back_html) {
    try {
      const parsed = JSON.parse(templateData.template.back_html);
      if (parsed.elements) campaignTemplateDesign = parsed;
    } catch { /* not JSON */ }
  }

  const [previewCampaign, setPreviewCampaign] = useState<EnrichedCampaign | null>(null);
  const [optInCampaign, setOptInCampaign] = useState<EnrichedCampaign | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Fetch agent contacts for opt-in selection
  const { data: contactsData } = useQuery({
    queryKey: ["contacts-for-optin"],
    queryFn: async () => {
      const res = await fetch("/api/contacts?limit=500&status=active");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!optInCampaign,
  });

  const contacts = contactsData?.contacts || [];

  const handleOptIn = async () => {
    if (!optInCampaign) return;
    try {
      await optIn.mutateAsync({
        campaignId: optInCampaign.id,
        contactIds: selectedContacts,
      });
      toast.success(`Opted in with ${selectedContacts.length} contacts`);
      setOptInCampaign(null);
      setSelectedContacts([]);
    } catch {
      toast.error("Failed to opt in");
    }
  };

  const handleOptOut = async (campaignId: string) => {
    try {
      await optOut.mutateAsync(campaignId);
      toast.success("Opted out of campaign");
    } catch {
      toast.error("Failed to opt out");
    }
  };

  const toggleAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c: { id: string }) => c.id));
    }
  };

  const typedCampaigns = (campaigns || []) as EnrichedCampaign[];

  const upcoming = typedCampaigns.filter((c) => ["draft", "scheduled"].includes(c.status));
  const active = typedCampaigns.filter((c) => ["generating", "ready_to_mail", "mailing"].includes(c.status));
  const past = typedCampaigns.filter((c) => ["mailed", "completed"].includes(c.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          View upcoming campaigns, preview your postcards, and opt in
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : typedCampaigns.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No campaigns available</CardTitle>
            <CardDescription>
              Campaigns will appear here once they are created by the admin. You&apos;ll be able to preview postcards and opt in.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Upcoming campaigns */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onPreview={() => setPreviewCampaign(campaign)}
                    onOptIn={() => {
                      setOptInCampaign(campaign);
                      setSelectedContacts([]);
                    }}
                    onOptOut={() => handleOptOut(campaign.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active campaigns */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                In Progress
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {active.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onPreview={() => setPreviewCampaign(campaign)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past campaigns */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Check className="h-4 w-4" />
                Completed
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {past.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onPreview={() => setPreviewCampaign(campaign)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Postcard Preview Dialog */}
      <Dialog open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Postcard Preview — {previewCampaign?.name}</DialogTitle>
            <DialogDescription>
              {MONTHS[previewCampaign?.month || 0]} {previewCampaign?.year}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="front">
            <TabsList className="w-full">
              <TabsTrigger value="front" className="flex-1">Front (Offers)</TabsTrigger>
              <TabsTrigger value="back" className="flex-1">Back (Your Branding)</TabsTrigger>
            </TabsList>
            <TabsContent value="front" className="mt-4">
              <PostcardFront
                campaignName={previewCampaign?.name}
                month={MONTHS[previewCampaign?.month || 0]}
                year={previewCampaign?.year}
                agentName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
                brokerageLogoUrl={profile?.brokerage_logo_url}
                brandColor={profile?.brand_color}
              />
            </TabsContent>
            <TabsContent value="back" className="mt-4">
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
                templateDesign={campaignTemplateDesign}
                agentCardDesign={profile?.agent_card_design ? (profile.agent_card_design as unknown as import("@/components/admin/TemplateDesigner").DesignConfig) : null}
              />
            </TabsContent>
          </Tabs>
          {previewCampaign && (
            <div className="mt-4">
              <OfferMatchPreview campaignId={previewCampaign.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Opt-In Dialog with Contact Selection */}
      <Dialog open={!!optInCampaign} onOpenChange={() => setOptInCampaign(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Opt In — {optInCampaign?.name}</DialogTitle>
            <DialogDescription>
              Select which contacts should receive postcards for this campaign.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedContacts.length} of {contacts.length} contacts selected
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAllContacts}>
                {selectedContacts.length === contacts.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border">
              {contacts.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No active contacts found. Upload contacts first.
                </p>
              ) : (
                contacts.map((contact: { id: string; first_name: string; last_name: string; city: string; state: string }) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => {
                        setSelectedContacts((prev) =>
                          checked
                            ? [...prev, contact.id]
                            : prev.filter((id) => id !== contact.id)
                        );
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contact.city}, {contact.state}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOptInCampaign(null)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              disabled={selectedContacts.length === 0 || optIn.isPending}
              onClick={handleOptIn}
            >
              {optIn.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Opt In ({selectedContacts.length} contacts)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign card component
function CampaignCard({
  campaign,
  onPreview,
  onOptIn,
  onOptOut,
}: {
  campaign: EnrichedCampaign;
  onPreview: () => void;
  onOptIn?: () => void;
  onOptOut?: () => void;
}) {
  const isOptedIn = campaign.my_participation?.opted_in;
  const canOptIn = ["draft", "scheduled"].includes(campaign.status);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{campaign.name}</CardTitle>
            <CardDescription>
              {MONTHS[campaign.month]} {campaign.year}
              {campaign.postcard_templates?.name && (
                <> — {campaign.postcard_templates.name}</>
              )}
            </CardDescription>
          </div>
          <Badge
            variant={
              campaign.status === "completed" || campaign.status === "mailed"
                ? "secondary"
                : campaign.status === "canceled"
                ? "destructive"
                : "default"
            }
          >
            {campaign.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold">{campaign.offer_ids?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Offers</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold">{campaign.my_participation?.contact_count || 0}</p>
            <p className="text-[10px] text-muted-foreground">My Contacts</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold text-sm">{campaign.mail_date || "TBD"}</p>
            <p className="text-[10px] text-muted-foreground">Mail Date</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </Button>
          {canOptIn && !isOptedIn && onOptIn && (
            <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={onOptIn}>
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Opt In
            </Button>
          )}
          {isOptedIn && onOptOut && (
            <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={onOptOut}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Opt Out
            </Button>
          )}
          {isOptedIn && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 self-center">
              <Check className="mr-1 h-3 w-3" /> Opted In
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
