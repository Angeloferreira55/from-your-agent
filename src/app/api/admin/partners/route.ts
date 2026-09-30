import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();
  if (profile?.role !== "admin") return null;
  return profile;
}

function isMissingColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "PGRST204" || err.code === "42703" || /column .* does not exist/i.test(err.message || "");
}

type MerchantRow = Record<string, unknown> & {
  id: string;
  name: string;
  is_active: boolean;
  notes: string | null;
  offers?: Array<Record<string, unknown>>;
};

// Extract normalized partner info from a merchant row, whether it was stored in
// the dedicated columns (migration 018) or the notes-JSON fallback.
function parsePartner(m: MerchantRow) {
  const fromNotes = (() => {
    try {
      const n = JSON.parse((m.notes as string) || "{}");
      return n?.partner || null;
    } catch {
      return null;
    }
  })();

  const isPartner = m.source === "partner_form" || !!fromNotes;
  if (!isPartner) return null;

  // Prefer real columns, fall back to notes JSON.
  const colStatus = m.partner_status as string | undefined;
  const notesStatus = fromNotes?.partner_status as string | undefined;
  const status = m.source === "partner_form"
    ? (colStatus || "pending")
    : (m.is_active ? "active" : (notesStatus || "pending"));

  return {
    contact_name: (m.contact_name as string) || fromNotes?.contact_name || null,
    contact_email: (m.contact_email as string) || fromNotes?.contact_email || null,
    signed_at: (m.terms_accepted_at as string) || fromNotes?.terms_accepted_at || null,
    signature: (m.terms_signature as string) || fromNotes?.terms_signature || null,
    status,
  };
}

// GET — list partner signups (admin only)
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!(await requireAdmin(admin, userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: merchants, error } = await admin
    .from("merchants")
    .select("*, offers(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const partners = (merchants || [])
    .map((m) => {
      const p = parsePartner(m as MerchantRow);
      if (!p) return null;
      const offer = (m.offers || [])[0] as Record<string, unknown> | undefined;
      return {
        merchant_id: m.id,
        business_name: m.name,
        category: m.category,
        city: m.city,
        state: m.state,
        phone: m.phone,
        website: m.website,
        created_at: m.created_at,
        ...p,
        offer: offer
          ? { title: offer.title, discount_text: offer.discount_text, fine_print: offer.fine_print }
          : null,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ partners });
}

// PATCH — approve or decline a partner signup (admin only)
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!(await requireAdmin(admin, userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { merchant_id, action } = (await request.json()) as { merchant_id?: string; action?: string };
  if (!merchant_id || (action !== "approve" && action !== "decline")) {
    return NextResponse.json({ error: "merchant_id and a valid action are required" }, { status: 400 });
  }

  const approve = action === "approve";
  const newStatus = approve ? "active" : "declined";

  // Update with the proper columns; fall back to notes JSON if migration 018
  // hasn't been applied.
  const withCols = await admin
    .from("merchants")
    .update({ is_active: approve, partner_status: newStatus })
    .eq("id", merchant_id);

  if (withCols.error && isMissingColumnError(withCols.error)) {
    // Fallback: flip is_active and rewrite the partner_status inside notes JSON.
    const { data: row } = await admin.from("merchants").select("notes").eq("id", merchant_id).single();
    let notes: Record<string, unknown> = {};
    try { notes = JSON.parse(row?.notes || "{}"); } catch { notes = {}; }
    const partner = (notes.partner as Record<string, unknown>) || {};
    partner.partner_status = newStatus;
    notes.partner = partner;
    const fb = await admin
      .from("merchants")
      .update({ is_active: approve, notes: JSON.stringify(notes) })
      .eq("id", merchant_id);
    if (fb.error) return NextResponse.json({ error: fb.error.message }, { status: 500 });
  } else if (withCols.error) {
    return NextResponse.json({ error: withCols.error.message }, { status: 500 });
  }

  // Activate/deactivate the associated offer(s) to match.
  await admin.from("offers").update({ is_active: approve }).eq("merchant_id", merchant_id);

  return NextResponse.json({ ok: true, status: newStatus });
}
