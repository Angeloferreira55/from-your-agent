import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

export const PARTNER_TERMS_VERSION = "2026-09-v1";

// Valid merchant categories (mirrors the admin OfferForm list).
const CATEGORIES = new Set([
  "restaurant", "cafe", "pizza", "mexican", "asian", "italian", "american",
  "bbq", "seafood", "bakery", "ice_cream", "bar", "brewery", "other_food",
  "spa", "salon", "fitness", "entertainment", "retail", "service",
]);

function isMissingColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  // PostgREST unknown column (PGRST204) or Postgres undefined_column (42703)
  return err.code === "PGRST204" || err.code === "42703" ||
    /column .* does not exist/i.test(err.message || "");
}

const LOGO_BUCKET = "merchant-assets";
const MAX_LOGO_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

/**
 * Uploads a business logo (base64) to public storage and returns its URL.
 * Returns null on any problem — a logo is optional and must never block signup.
 */
async function uploadLogo(
  admin: ReturnType<typeof createAdminClient>,
  merchantId: string,
  base64: string,
  contentType: string,
  ext: string,
): Promise<string | null> {
  try {
    if (!ALLOWED_LOGO_TYPES.has(contentType)) return null;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) return null;

    // Ensure the public bucket exists.
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === LOGO_BUCKET)) {
      await admin.storage.createBucket(LOGO_BUCKET, { public: true });
    }

    const safeExt = /^[a-z0-9]{1,5}$/i.test(ext) ? ext.toLowerCase() : "png";
    const filePath = `${merchantId}/logo.${safeExt}`;
    const { error } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(filePath, buffer, { upsert: true, contentType });
    if (error) return null;

    const { data: { publicUrl } } = admin.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
    return publicUrl;
  } catch {
    return null;
  }
}

/**
 * POST — Public "Become a Partner" signup (NO auth).
 *
 * A business registers itself and accepts the partner terms. We create a
 * merchant + offer in a pending, inactive state for admin review. Nothing goes
 * live until an admin approves it from /admin/partners.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; humans leave them empty.
  if (typeof body.company_website === "string" && body.company_website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const businessName = str(body.business_name);
  const contactName = str(body.contact_name);
  const contactEmail = str(body.contact_email);
  const phone = str(body.phone);
  const discountText = str(body.discount_text);
  const termsAccepted = body.terms_accepted === true;
  const signature = str(body.signature);

  // Required-field validation.
  const missing: string[] = [];
  if (!businessName) missing.push("business name");
  if (!contactName) missing.push("your name");
  if (!contactEmail) missing.push("email");
  if (!phone) missing.push("phone");
  if (!discountText) missing.push("the offer");
  if (missing.length > 0) {
    return NextResponse.json({ error: `Please fill in: ${missing.join(", ")}.` }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!termsAccepted || !signature) {
    return NextResponse.json(
      { error: "Please accept the partner terms and type your name to sign." },
      { status: 400 }
    );
  }

  const category = CATEGORIES.has(str(body.category)) ? str(body.category) : "restaurant";
  const now = new Date();
  const nowIso = now.toISOString();
  const validFrom = nowIso.split("T")[0];
  const validUntil = new Date(now.getFullYear(), now.getMonth() + 4, now.getDate())
    .toISOString()
    .split("T")[0];

  const admin = createAdminClient();

  const baseMerchant = {
    name: businessName,
    category,
    address_line1: str(body.address_line1) || null,
    city: str(body.city) || null,
    state: str(body.state) || null,
    zip: str(body.zip) || null,
    phone,
    website: str(body.website) || null,
    is_active: false, // pending review — not live until an admin approves
  };

  const partnerMeta = {
    source: "partner_form",
    partner_status: "pending",
    contact_name: contactName,
    contact_email: contactEmail,
    terms_accepted_at: nowIso,
    terms_signature: signature,
    terms_version: PARTNER_TERMS_VERSION,
  };

  // Attempt insert with the proper partner columns (migration 018). If those
  // columns don't exist yet, fall back to stashing the metadata in `notes` as
  // JSON so the form still works before the migration is applied.
  let merchant: { id: string } | null = null;

  const full = await admin
    .from("merchants")
    .insert({ ...baseMerchant, ...partnerMeta })
    .select("id")
    .single();

  if (full.error && isMissingColumnError(full.error)) {
    const fallback = await admin
      .from("merchants")
      .insert({ ...baseMerchant, notes: JSON.stringify({ partner: partnerMeta }) })
      .select("id")
      .single();
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    merchant = fallback.data;
  } else if (full.error) {
    return NextResponse.json({ error: full.error.message }, { status: 500 });
  } else {
    merchant = full.data;
  }

  // Optional logo upload (base64). Never blocks signup if it fails.
  const logoBase64 = str(body.logo_base64);
  if (logoBase64) {
    const logoUrl = await uploadLogo(
      admin,
      merchant!.id,
      logoBase64,
      str(body.logo_content_type) || "image/png",
      str(body.logo_ext) || "png",
    );
    if (logoUrl) {
      await admin.from("merchants").update({ logo_url: logoUrl }).eq("id", merchant!.id);
    }
  }

  // Create the pending offer (inactive until approved).
  const { error: offerErr } = await admin.from("offers").insert({
    merchant_id: merchant!.id,
    title: str(body.offer_title) || `${businessName} offer`,
    discount_text: discountText,
    fine_print: str(body.fine_print) || null,
    valid_from: validFrom,
    valid_until: validUntil,
    featured: false,
    is_active: false,
  });

  if (offerErr) {
    return NextResponse.json({ error: offerErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, merchant_id: merchant!.id }, { status: 201 });
}
