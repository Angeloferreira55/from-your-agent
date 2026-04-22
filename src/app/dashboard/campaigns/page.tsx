"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostcardFront } from "@/components/postcard/PostcardFront";
import { OfferMatchPreview } from "@/components/campaigns/OfferMatchPreview";
import { useAgentProfile } from "@/hooks/use-agent-profile";
import { useAgentCampaigns, useOptInCampaign, useOptOutCampaign } from "@/hooks/use-campaigns";
import { Send, Eye, Check, X, Loader2, Calendar, Users, Mail, TestTube, Rocket, Info } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/types/database";

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type EnrichedCampaign = Campaign & {
  postcard_templates?: { name: string; size: string };
  my_participation?: { id: string; opted_in: boolean; contact_count: number; total_cost: number } | null;
};

export default function CampaignsPage() {
  const { data: profile } = useAgentProfile();
  const { data: campaigns, isLoading } = useAgentCampaigns();
  const queryClient = useQueryClient();
  const optIn = useOptInCampaign();
  const optOut = useOptOutCampaign();

  const [previewCampaign, setPreviewCampaign] = useState<EnrichedCampaign | null>(null);
  const [optInCampaign, setOptInCampaign] = useState<EnrichedCampaign | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testContactIds, setTestContactIds] = useState<string[]>([]);

  // Fetch agent contacts for opt-in selection and test
  const { data: contactsData } = useQuery({
    queryKey: ["contacts-for-optin"],
    queryFn: async () => {
      const res = await fetch("/api/contacts?limit=500&status=active");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!optInCampaign || showTestDialog,
  });

  // Find the current active campaign's template_id for test sends
  const typedAllCampaigns = (campaigns || []) as EnrichedCampaign[];
  const currentCampaign = typedAllCampaigns.find((c) => !c.name?.startsWith("Test")) || typedAllCampaigns[0];

  const contacts = contactsData?.contacts || [];

  // Send test postcards mutation (supports multiple contacts)
  const sendTest = useMutation({
    mutationFn: async ({ contactIds, templateId }: { contactIds: string[]; templateId?: string }) => {
      const res = await fetch("/api/postcards/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids: contactIds, template_id: templateId || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send test postcards");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.mailed > 0) {
        toast.success(`${data.mailed} test postcard${data.mailed > 1 ? "s" : ""} sent!`, {
          description: data.results
            ?.filter((r: { success: boolean }) => r.success)
            .map((r: { contact: string }) => r.contact)
            .join(", "),
        });
      }
      if (data.failed > 0) {
        const failedResults = data.results?.filter((r: { success: boolean }) => !r.success) || [];
        const firstError = failedResults[0]?.error || "Unknown error";
        toast.error(`${data.failed} postcard${data.failed > 1 ? "s" : ""} failed`, {
          description: firstError,
          duration: 10000,
        });
      }
      setShowTestDialog(false);
      setTestContactIds([]);
      queryClient.invalidateQueries({ queryKey: ["agent-campaigns"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Your postcards are sent automatically every month to all your active contacts.
          </p>
        </div>
        <Button
          onClick={() => setShowTestDialog(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <TestTube className="mr-2 h-4 w-4" />
          Send Test Postcards
        </Button>
      </div>

      {/* Campaign info card */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <Rocket className="h-5 w-5 text-orange-600" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">Monthly Campaigns</p>
            <p className="text-sm text-muted-foreground">
              Each month a new campaign is created with curated local deals. We mail postcards to your active contacts
              and bill you per card sent. Keep your contacts list and personalization up to date — we handle the rest.
              Use the &quot;Send Test Postcards&quot; button above to do a trial run before your first campaign.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Questions? Contact us at support@from-your-agent.com
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <CardTitle>No campaigns yet</CardTitle>
            <CardDescription>
              No campaigns have been created yet. Use &quot;Send Test Postcards&quot; above to verify your profile and contacts are set up correctly.
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
                companyName={profile?.company_name}
                brokerageLogoUrl={profile?.brokerage_logo_url}
                brandColor={profile?.brand_color}
              />
            </TabsContent>
            <TabsContent value="back" className="mt-4">
              {/* Iframe renders the EXACT same HTML that Lob prints */}
              <div className="relative w-full" style={{ aspectRatio: "2775 / 1875" }}>
                <iframe
                  src={`/api/postcards/preview-back?template_id=${previewCampaign?.template_id || ""}&month=${previewCampaign?.month || ""}`}
                  className="absolute inset-0 w-full h-full border rounded-md"
                  title="Postcard back preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
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

      {/* Send Test Postcards Dialog */}
      <Dialog open={showTestDialog} onOpenChange={(open) => { setShowTestDialog(open); if (!open) { setTestContactIds([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Test Postcards</DialogTitle>
            <DialogDescription>
              Select contacts to send a real test postcard to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Current campaign info */}
            {currentCampaign && (
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Campaign</p>
                <p className="text-sm font-semibold">{currentCampaign.name || `${MONTHS[currentCampaign.month]} ${currentCampaign.year}`}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {testContactIds.length} contact{testContactIds.length !== 1 ? "s" : ""} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (testContactIds.length === contacts.length) {
                    setTestContactIds([]);
                  } else {
                    setTestContactIds(contacts.map((c: { id: string }) => c.id));
                  }
                }}
              >
                {testContactIds.length === contacts.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border">
              {contacts.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No active contacts found. Upload contacts first.
                </p>
              ) : (
                contacts.map((contact: { id: string; first_name: string; last_name: string; city: string; state: string; address_line1: string }) => (
                  <label
                    key={contact.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                      testContactIds.includes(contact.id) ? "bg-orange-50" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={testContactIds.includes(contact.id)}
                      onCheckedChange={(checked) => {
                        setTestContactIds((prev) =>
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
                        {contact.address_line1}, {contact.city}, {contact.state}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              disabled={testContactIds.length === 0 || sendTest.isPending}
              onClick={() => sendTest.mutate({ contactIds: testContactIds, templateId: currentCampaign?.template_id })}
            >
              {sendTest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send {testContactIds.length > 0 ? `${testContactIds.length} Test${testContactIds.length > 1 ? "s" : ""}` : "Test"}
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
