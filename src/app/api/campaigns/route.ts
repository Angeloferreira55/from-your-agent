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

// GET — list campaigns or fetch single campaign by id
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await admin
      .from("campaigns")
      .select("*, postcard_templates(name, size)")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  }

  const { data, error } = await admin
    .from("campaigns")
    .select("*, postcard_templates(name)")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

// POST — create campaign (admin only)
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  const { data, error } = await admin
    .from("campaigns")
    .insert({
      name: body.name,
      description: body.description || null,
      month: body.month,
      year: body.year,
      template_id: body.template_id,
      offer_ids: body.offer_ids || [],
      mail_date: body.mail_date,
      cutoff_date: body.cutoff_date,
      status: "draft",
      created_by: adminProfile.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — update campaign (admin only)
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await admin
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete campaign (admin only)
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { error } = await admin.from("campaigns").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
