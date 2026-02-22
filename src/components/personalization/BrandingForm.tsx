"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ImageUploader } from "./ImageUploader";
import { useAgentProfile, useUpdateProfile, useUploadImage } from "@/hooks/use-agent-profile";
import { toast } from "sonner";
import { Loader2, Lock, Building2, X } from "lucide-react";
import type { PostcardVisibleFields } from "@/types/database";

interface BrokerageOption {
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

const DEFAULT_VISIBLE: PostcardVisibleFields = {
  phone: true,
  email: true,
  license: true,
  website: false,
  brokerage_info: true,
};

const FOOTER_OPTIONS = [
  { value: "auto", label: "Auto (by month)", gradient: "linear-gradient(90deg, #6366f1, #a855f7)" },
  { value: "none", label: "None", gradient: "" },
  { value: "january", label: "New Year", gradient: "linear-gradient(90deg, #1e3a5f 0%, #c9a84c 50%, #1e3a5f 100%)" },
  { value: "february", label: "Valentine's", gradient: "linear-gradient(90deg, #f9a8c9 0%, #e8314f 50%, #f9a8c9 100%)" },
  { value: "march", label: "St. Patrick's", gradient: "linear-gradient(90deg, #2d8f4e 0%, #4fc978 50%, #2d8f4e 100%)" },
  { value: "april", label: "Spring", gradient: "linear-gradient(90deg, #a8d8a8 0%, #f5e663 50%, #a8d8a8 100%)" },
  { value: "may", label: "Mother's Day", gradient: "linear-gradient(90deg, #f4a6d7 0%, #d8b4fe 50%, #f4a6d7 100%)" },
  { value: "june", label: "Summer", gradient: "linear-gradient(90deg, #87ceeb 0%, #ffd700 50%, #87ceeb 100%)" },
  { value: "july", label: "4th of July", gradient: "linear-gradient(90deg, #bf0a30 0%, #002868 50%, #bf0a30 100%)" },
  { value: "august", label: "Late Summer", gradient: "linear-gradient(90deg, #f97316 0%, #0d9488 50%, #f97316 100%)" },
  { value: "september", label: "Fall", gradient: "linear-gradient(90deg, #d97706 0%, #92400e 50%, #d97706 100%)" },
  { value: "october", label: "Halloween", gradient: "linear-gradient(90deg, #f97316 0%, #1c1917 50%, #f97316 100%)" },
  { value: "november", label: "Thanksgiving", gradient: "linear-gradient(90deg, #92400e 0%, #ca8a04 50%, #92400e 100%)" },
  { value: "december", label: "Holidays", gradient: "linear-gradient(90deg, #dc2626 0%, #16a34a 50%, #dc2626 100%)" },
  { value: "social", label: "Social Media", gradient: "linear-gradient(90deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)" },
  { value: "consultation", label: "Free Consult", gradient: "linear-gradient(90deg, #0a0a0a 0%, #2a2a2a 50%, #0a0a0a 100%)" },
  { value: "referral", label: "Referrals", gradient: "linear-gradient(90deg, #1a3a2a 0%, #40916c 50%, #1a3a2a 100%)" },
];

export function BrandingForm({ onSaved }: { onSaved?: () => void } = {}) {
  const { data: profile, isLoading } = useAgentProfile();
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadImage();

  const { data: brokeragesData } = useQuery({
    queryKey: ["brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/brokerages");
      if (!res.ok) throw new Error("Failed to fetch brokerages");
      return res.json();
    },
  });

  const brokerages: BrokerageOption[] = brokeragesData?.brokerages || [];

  const [brokerageId, setBrokerageId] = useState("");
  const [tagline, setTagline] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [brandColor, setBrandColor] = useState("#E8733A");
  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [brokeragePhone, setBrokeragePhone] = useState("");
  const [brokerageAddress1, setBrokerageAddress1] = useState("");
  const [brokerageAddress2, setBrokerageAddress2] = useState("");
  const [brokerageCity, setBrokerageCity] = useState("");
  const [brokerageState, setBrokerageState] = useState("");
  const [brokerageZip, setBrokerageZip] = useState("");
  const [visibleFields, setVisibleFields] = useState<PostcardVisibleFields>(DEFAULT_VISIBLE);
  const [seasonalFooter, setSeasonalFooter] = useState("auto");

  useEffect(() => {
    if (profile) {
      setBrokerageId(profile.brokerage_id || "");
      setTagline(profile.tagline || "");
      setCustomMessage(profile.custom_message || "");
      setBrandColor(profile.brand_color || "#E8733A");
      setCompanyName(profile.company_name || "");
      setLicenseNumber(profile.license_number || "");
      setPhone(profile.phone || "");
      setWebsite(profile.website || "");
      setBrokeragePhone(profile.brokerage_phone || "");
      setBrokerageAddress1(profile.brokerage_address_line1 || "");
      setBrokerageAddress2(profile.brokerage_address_line2 || "");
      setBrokerageCity(profile.brokerage_city || "");
      setBrokerageState(profile.brokerage_state || "");
      setBrokerageZip(profile.brokerage_zip || "");
      setVisibleFields(profile.postcard_visible_fields || DEFAULT_VISIBLE);
      setSeasonalFooter(profile.seasonal_footer || "auto");
    }
  }, [profile]);

  const selectedBrokerage = brokerages.find((b) => b.id === brokerageId) || null;

  const handleBrokerageChange = async (value: string) => {
    setBrokerageId(value);
    const brokerage = brokerages.find((b) => b.id === value);
    if (brokerage) {
      setCompanyName(brokerage.name);
      setBrandColor(brokerage.brand_color);
      // Save brokerage_id + auto-filled fields immediately
      try {
        await updateProfile.mutateAsync({
          brokerage_id: value,
          company_name: brokerage.name,
          brand_color: brokerage.brand_color,
        } as Record<string, unknown>);
        toast.success(`Switched to ${brokerage.name}`);
      } catch {
        toast.error("Failed to update brokerage");
      }
    }
  };

  const toggleVisible = (key: keyof PostcardVisibleFields) => {
    setVisibleFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        tagline: tagline || null,
        custom_message: customMessage || null,
        brand_color: brandColor,
        company_name: companyName || null,
        license_number: licenseNumber || null,
        phone: phone || null,
        website: website || null,
        brokerage_phone: brokeragePhone || null,
        brokerage_address_line1: brokerageAddress1 || null,
        brokerage_address_line2: brokerageAddress2 || null,
        brokerage_city: brokerageCity || null,
        brokerage_state: brokerageState || null,
        brokerage_zip: brokerageZip || null,
        postcard_visible_fields: visibleFields,
        brokerage_id: brokerageId || null,
        seasonal_footer: seasonalFooter,
      } as Record<string, unknown>);
      toast.success("Branding saved successfully");
      onSaved?.();
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const checkImageResolution = (file: File, minWidth = 300, minHeight = 300): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      if (file.type === "image/svg+xml") {
        resolve({ width: 1000, height: 1000 }); // SVGs scale infinitely
        return;
      }
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
          reject(new Error(`Image resolution is too low (${img.naturalWidth}x${img.naturalHeight}px). For best print quality, use an image at least ${minWidth}x${minHeight}px.`));
        } else {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image"));
      };
      img.src = url;
    });
  };

  const handleUpload = async (file: File, type: "photo" | "team_logo") => {
    const labels: Record<string, string> = {
      photo: "Photo",
      team_logo: "Team logo",
    };
    try {
      if (type === "team_logo") {
        await checkImageResolution(file, 300, 300);
      }
      await uploadImage.mutateAsync({ file, type });
      toast.success(`${labels[type]} uploaded`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to upload ${labels[type].toLowerCase()}: ${message}`);
    }
  };

  const handleRemoveTeamLogo = async () => {
    try {
      await updateProfile.mutateAsync({ team_logo_url: null } as Record<string, unknown>);
      toast.success("Team logo removed");
    } catch {
      toast.error("Failed to remove team logo");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Branding</CardTitle>
        <CardDescription>
          This information appears on the back of every postcard you send
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brokerage Selector */}
        <div className="space-y-2">
          <Label>Your Brokerage</Label>
          <Select value={brokerageId} onValueChange={handleBrokerageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select your brokerage..." />
            </SelectTrigger>
            <SelectContent>
              {brokerages.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <div className="flex items-center gap-2">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt="" className="h-4 w-auto object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    {b.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBrokerage && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <Lock className="h-3 w-3 shrink-0" />
              Brokerage branding (logo, colors, slogan) is managed by your admin
            </div>
          )}
        </div>

        {/* Brokerage preview when selected */}
        {selectedBrokerage && (
          <div
            className="relative overflow-hidden rounded-lg p-3"
            style={{ backgroundColor: selectedBrokerage.brand_color }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundColor: selectedBrokerage.overlay_color }}
            />
            {selectedBrokerage.background_url && (
              <img
                src={selectedBrokerage.background_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}
            <div className="relative z-10 flex items-center gap-3">
              {selectedBrokerage.logo_url && (
                <img
                  src={selectedBrokerage.logo_url}
                  alt={selectedBrokerage.name}
                  className="h-8 w-auto object-contain"
                />
              )}
              <div>
                <p className="text-sm font-semibold text-white">{selectedBrokerage.name}</p>
                {selectedBrokerage.slogan && (
                  <p className="text-xs italic text-white/80">{selectedBrokerage.slogan}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Headshot */}
        <ImageUploader
          label="Your Headshot"
          currentUrl={profile?.photo_url ?? null}
          onUpload={(file) => handleUpload(file, "photo")}
          accept="image/png,image/jpeg,image/webp"
          maxSizeMb={10}
          shape="circle"
        />

        {/* Team Logo only (brokerage logo is admin-managed) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Team Logo</p>
            {profile?.team_logo_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleRemoveTeamLogo}
              >
                <X className="mr-1 h-3 w-3" />
                Remove
              </Button>
            )}
          </div>
          <ImageUploader
            label="Team Logo (optional)"
            currentUrl={profile?.team_logo_url ?? null}
            onUpload={(file) => handleUpload(file, "team_logo")}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            maxSizeMb={10}
            shape="square"
            size="large"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Min 300x300px recommended for print quality. Appears under your brokerage logo on postcards.
          </p>
        </div>

        {/* Brand Color — locked if brokerage selected */}
        {!selectedBrokerage && (
          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="brandColor"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border p-1"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#E8733A"
                className="w-28 font-mono text-sm"
              />
              <div
                className="h-10 flex-1 rounded-md border"
                style={{ backgroundColor: brandColor }}
              />
            </div>
          </div>
        )}

        {/* Company Info — company name locked if brokerage selected */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company / Brokerage</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Keller Williams Realty"
              disabled={!!selectedBrokerage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License #</Label>
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="DRE #01234567"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.yoursite.com"
            />
          </div>
        </div>

        {/* Brokerage Address & Phone (Compliance) */}
        <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Brokerage Office Info</p>
            <p className="text-xs text-muted-foreground">Required for compliance on postcards</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brokeragePhone">Brokerage Phone</Label>
            <Input
              id="brokeragePhone"
              value={brokeragePhone}
              onChange={(e) => setBrokeragePhone(e.target.value)}
              placeholder="(555) 000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brokerageAddress1">Brokerage Address</Label>
            <Input
              id="brokerageAddress1"
              value={brokerageAddress1}
              onChange={(e) => setBrokerageAddress1(e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <Input
            value={brokerageAddress2}
            onChange={(e) => setBrokerageAddress2(e.target.value)}
            placeholder="Suite / Unit (optional)"
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={brokerageCity}
              onChange={(e) => setBrokerageCity(e.target.value)}
              placeholder="City"
            />
            <Input
              value={brokerageState}
              onChange={(e) => setBrokerageState(e.target.value)}
              placeholder="State"
              maxLength={2}
            />
            <Input
              value={brokerageZip}
              onChange={(e) => setBrokerageZip(e.target.value)}
              placeholder="ZIP"
              maxLength={10}
            />
          </div>
        </div>

        {/* Postcard Visibility */}
        <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Postcard Visibility</p>
            <p className="text-xs text-muted-foreground">Choose which fields appear on your postcard</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "phone" as const, label: "Phone Number" },
              { key: "email" as const, label: "Email Address" },
              { key: "license" as const, label: "License #" },
              { key: "website" as const, label: "Website" },
              { key: "brokerage_info" as const, label: "Brokerage Office Info" },
            ]).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleFields[key]}
                  onChange={() => toggleVisible(key)}
                  className="h-4 w-4 rounded border-gray-300 accent-[#E8733A]"
                />
                <span className={visibleFields[key] ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Your trusted neighborhood agent"
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground">{tagline.length}/80 characters</p>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Personal Message</Label>
          <Textarea
            id="message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Hi! I hope you enjoy these exclusive local deals. As always, I'm here for all your real estate needs..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{customMessage.length}/200 characters</p>
        </div>

        {/* Seasonal Footer */}
        <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Seasonal Footer</p>
            <p className="text-xs text-muted-foreground">A themed banner at the bottom of your agent panel</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FOOTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSeasonalFooter(opt.value)}
                className={cn(
                  "relative rounded-md border-2 overflow-hidden text-left transition-all",
                  seasonalFooter === opt.value
                    ? "border-[#E8733A] ring-1 ring-[#E8733A]"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <div
                  className="h-6 w-full"
                  style={{
                    background: opt.gradient || "#e5e7eb",
                  }}
                />
                <p className="text-[10px] font-medium px-1.5 py-1 truncate">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-[#E8733A] hover:bg-[#CF6430]"
          onClick={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Branding"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
