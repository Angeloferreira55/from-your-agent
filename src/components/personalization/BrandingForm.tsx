"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { useAgentProfile, useUpdateProfile, useUploadImage } from "@/hooks/use-agent-profile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PostcardVisibleFields } from "@/types/database";

const DEFAULT_VISIBLE: PostcardVisibleFields = {
  phone: true,
  email: true,
  license: true,
  website: false,
  brokerage_info: true,
};

export function BrandingForm() {
  const { data: profile, isLoading } = useAgentProfile();
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadImage();

  const [tagline, setTagline] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [brandColor, setBrandColor] = useState("#C02646");
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

  useEffect(() => {
    if (profile) {
      setTagline(profile.tagline || "");
      setCustomMessage(profile.custom_message || "");
      setBrandColor(profile.brand_color || "#C02646");
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
    }
  }, [profile]);

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
      } as Record<string, unknown> & Partial<typeof profile>);
      toast.success("Branding saved successfully");
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handleUpload = async (file: File, type: "logo" | "photo" | "brokerage_logo" | "team_logo") => {
    const labels: Record<string, string> = {
      logo: "Logo",
      photo: "Photo",
      brokerage_logo: "Brokerage logo",
      team_logo: "Team logo",
    };
    try {
      await uploadImage.mutateAsync({ file, type });
      toast.success(`${labels[type]} uploaded`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to upload ${labels[type].toLowerCase()}: ${message}`);
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
        {/* Headshot */}
        <ImageUploader
          label="Your Headshot"
          currentUrl={profile?.photo_url ?? null}
          onUpload={(file) => handleUpload(file, "photo")}
          accept="image/png,image/jpeg,image/webp"
          maxSizeMb={10}
          shape="circle"
        />

        {/* Logos */}
        <div>
          <p className="text-sm font-medium mb-3">Logos</p>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploader
              label="Brokerage Logo"
              currentUrl={profile?.brokerage_logo_url ?? null}
              onUpload={(file) => handleUpload(file, "brokerage_logo")}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              maxSizeMb={10}
              shape="square"
            />
            <ImageUploader
              label="Team Logo"
              currentUrl={profile?.team_logo_url ?? null}
              onUpload={(file) => handleUpload(file, "team_logo")}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              maxSizeMb={10}
              shape="square"
            />
          </div>
        </div>

        {/* Brand Color */}
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
              placeholder="#C02646"
              className="w-28 font-mono text-sm"
            />
            <div
              className="h-10 flex-1 rounded-md border"
              style={{ backgroundColor: brandColor }}
            />
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company / Brokerage</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Keller Williams Realty"
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
                  className="h-4 w-4 rounded border-gray-300 accent-[#C02646]"
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

        <Button
          className="w-full bg-[#C02646] hover:bg-[#A01E38]"
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
