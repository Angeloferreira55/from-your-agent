"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Gift, Mail, Store } from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café / Coffee" },
  { value: "bakery", label: "Bakery" },
  { value: "ice_cream", label: "Ice Cream / Dessert" },
  { value: "bar", label: "Bar" },
  { value: "brewery", label: "Brewery" },
  { value: "other_food", label: "Other Food & Drink" },
  { value: "spa", label: "Spa" },
  { value: "salon", label: "Salon" },
  { value: "fitness", label: "Fitness" },
  { value: "entertainment", label: "Entertainment" },
  { value: "retail", label: "Retail" },
  { value: "service", label: "Service" },
];

const TERMS: { title: string; body: string }[] = [
  { title: "The Offer", body: "You agree to honor the discount exactly as printed, for all of the dates shown." },
  { title: "Permission", body: "You allow From Your Agent to feature your business name, logo, and offer on mailed postcards and online promotion." },
  { title: "No Cost", body: "Being featured is free. You only cover the discount you choose to give your customers." },
  { title: "Authority", body: "You confirm you are authorized to enter this agreement on behalf of the business." },
  { title: "Ending It", body: "Either side may end the partnership with written notice. Postcards already printed may still circulate." },
];

export default function PartnerSignupPage() {
  const [form, setForm] = useState({
    business_name: "", category: "restaurant", contact_name: "", contact_email: "",
    phone: "", website: "", address_line1: "", city: "", state: "NM", zip: "",
    discount_text: "", fine_print: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted || !signature.trim()) {
      setError("Please accept the partner terms and type your name to sign.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company_website: honeypot, // honeypot
          terms_accepted: accepted,
          signature: signature.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#0B1F3B]">You&apos;re on the list!</h1>
        <p className="mt-4 text-muted-foreground">
          Thanks for signing up to be a featured partner. We&apos;ll review your offer and reach out
          at <span className="font-medium text-foreground">{form.contact_email}</span> to confirm the details
          before your deal appears on any postcards.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0B1F3B] text-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#E8733A] mb-3">
            Become a Featured Partner
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            Get your business in front of local homeowners — free.*
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            We mail beautifully designed postcards to homes across the area every month. Feature your
            offer at no cost — you only honor the discount you choose to give.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#E8733A]" /> Mailed to local homes</span>
            <span className="flex items-center gap-2"><Gift className="h-4 w-4 text-[#E8733A]" /> No cost to be featured</span>
            <span className="flex items-center gap-2"><Store className="h-4 w-4 text-[#E8733A]" /> New customers at your door</span>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            *Free to be featured — you only cover the discount you choose to offer.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-6">
          <Card>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot (hidden from humans) */}
                <input
                  type="text" tabIndex={-1} autoComplete="off"
                  className="hidden" aria-hidden="true"
                  value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
                />

                <div>
                  <h2 className="text-lg font-semibold text-[#0B1F3B]">Your business</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="business_name">Business name *</Label>
                      <Input id="business_name" required value={form.business_name} onChange={set("business_name")} placeholder="ABC Plumbing" />
                    </div>
                    <div>
                      <Label htmlFor="category">Type of business</Label>
                      <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                        <SelectTrigger id="category" className="mt-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" value={form.website} onChange={set("website")} placeholder="abcplumbing.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address_line1">Address</Label>
                      <Input id="address_line1" value={form.address_line1} onChange={set("address_line1")} placeholder="123 Main St NE" />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={set("city")} placeholder="Albuquerque" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" value={form.state} onChange={set("state")} maxLength={2} placeholder="NM" />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP</Label>
                        <Input id="zip" value={form.zip} onChange={set("zip")} placeholder="87111" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#0B1F3B]">Your offer</h2>
                  <p className="text-sm text-muted-foreground">What deal should we feature for homeowners?</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="discount_text">The offer *</Label>
                      <Input id="discount_text" required value={form.discount_text} onChange={set("discount_text")} placeholder="10% off any service" />
                    </div>
                    <div>
                      <Label htmlFor="fine_print">Limits / fine print</Label>
                      <Textarea id="fine_print" rows={2} value={form.fine_print} onChange={set("fine_print")} placeholder="One per customer. Not valid with other promotions." />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#0B1F3B]">Contact</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact_name">Your name *</Label>
                      <Input id="contact_name" required value={form.contact_name} onChange={set("contact_name")} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" required type="tel" value={form.phone} onChange={set("phone")} placeholder="(505) 555-0123" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="contact_email">Email *</Label>
                      <Input id="contact_email" required type="email" value={form.contact_email} onChange={set("contact_email")} placeholder="you@yourbusiness.com" />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="rounded-lg border bg-[#F7F8FA] p-5">
                  <h2 className="text-base font-semibold text-[#0B1F3B]">Partner terms</h2>
                  <ol className="mt-3 space-y-2 text-sm text-gray-700">
                    {TERMS.map((t, i) => (
                      <li key={t.title} className="flex gap-2">
                        <span className="font-semibold text-[#E8733A]">{i + 1}.</span>
                        <span><span className="font-medium">{t.title}.</span> {t.body}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5 flex items-start gap-3">
                    <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
                    <Label htmlFor="accept" className="text-sm font-normal leading-snug">
                      I have read and agree to the partner terms above, and I am authorized to sign on behalf of this business.
                    </Label>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="signature">Type your full name to sign *</Label>
                    <Input
                      id="signature" value={signature} onChange={(e) => setSignature(e.target.value)}
                      placeholder="Jane Doe"
                      className="mt-1 max-w-xs font-serif italic"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" size="lg" disabled={submitting} className="w-full bg-[#E8733A] hover:bg-[#CF6430] text-white">
                  {submitting ? "Submitting…" : "Sign up as a partner"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  No cost, no obligation. We&apos;ll confirm your offer before it appears on any postcard.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
