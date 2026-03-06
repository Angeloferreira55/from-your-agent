"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAgentProfile, useUpdateProfile } from "@/hooks/use-agent-profile";

export default function SettingsPage() {
  const { data: profile, isLoading } = useAgentProfile();
  const updateProfile = useUpdateProfile();

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Return address fields
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Brokerage address fields
  const [brokAddress1, setBrokAddress1] = useState("");
  const [brokAddress2, setBrokAddress2] = useState("");
  const [brokCity, setBrokCity] = useState("");
  const [brokState, setBrokState] = useState("");
  const [brokZip, setBrokZip] = useState("");
  const [brokPhone, setBrokPhone] = useState("");

  // Populate fields when profile loads
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setEmail(profile.email || "");
    setPhone(profile.phone || "");
    setCompany(profile.company_name || "");
    setLicenseNumber(profile.license_number || "");

    setAddress1(profile.address_line1 || "");
    setAddress2(profile.address_line2 || "");
    setCity(profile.city || "");
    setState(profile.state || "");
    setZip(profile.zip || "");

    setBrokAddress1(profile.brokerage_address_line1 || "");
    setBrokAddress2(profile.brokerage_address_line2 || "");
    setBrokCity(profile.brokerage_city || "");
    setBrokState(profile.brokerage_state || "");
    setBrokZip(profile.brokerage_zip || "");
    setBrokPhone(profile.brokerage_phone || "");
  }, [profile]);

  function handleSaveProfile() {
    updateProfile.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        phone,
        company_name: company,
        license_number: licenseNumber,
      },
      {
        onSuccess: () => toast.success("Profile saved!"),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  function handleSaveReturnAddress() {
    updateProfile.mutate(
      {
        address_line1: address1,
        address_line2: address2,
        city,
        state,
        zip,
      },
      {
        onSuccess: () => toast.success("Return address saved!"),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  function handleSaveBrokerageAddress() {
    updateProfile.mutate(
      {
        brokerage_address_line1: brokAddress1,
        brokerage_address_line2: brokAddress2,
        brokerage_city: brokCity,
        brokerage_state: brokState,
        brokerage_zip: brokZip,
        brokerage_phone: brokPhone,
      },
      {
        onSuccess: () => toast.success("Brokerage address saved!"),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>License #</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="NM-12345" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company / Brokerage</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ABC Realty" />
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSaveProfile}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Return Address */}
      <Card>
        <CardHeader>
          <CardTitle>Return Address</CardTitle>
          <CardDescription>This address appears as the return address on your postcards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <Input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Suite 100" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Albuquerque" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="NM" maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>ZIP</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="87101" />
            </div>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSaveReturnAddress}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Return Address
          </Button>
        </CardContent>
      </Card>

      {/* Brokerage / Office Address */}
      <Card>
        <CardHeader>
          <CardTitle>Brokerage / Office Address</CardTitle>
          <CardDescription>
            Used as the delivery address for print orders. If blank, your return address will be used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Office Phone</Label>
            <Input value={brokPhone} onChange={(e) => setBrokPhone(e.target.value)} placeholder="(555) 987-6543" />
          </div>
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input value={brokAddress1} onChange={(e) => setBrokAddress1(e.target.value)} placeholder="456 Office Blvd" />
          </div>
          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <Input value={brokAddress2} onChange={(e) => setBrokAddress2(e.target.value)} placeholder="Suite 200" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={brokCity} onChange={(e) => setBrokCity(e.target.value)} placeholder="Albuquerque" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={brokState} onChange={(e) => setBrokState(e.target.value)} placeholder="NM" maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>ZIP</Label>
              <Input value={brokZip} onChange={(e) => setBrokZip(e.target.value)} placeholder="87101" />
            </div>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSaveBrokerageAddress}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Brokerage Address
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
