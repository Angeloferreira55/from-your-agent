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

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data, error } = await admin
    .from("regions")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ regions: data });
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  const { data, error } = await admin
    .from("regions")
    .insert({
      name: body.name,
      description: body.description || null,
      center_lat: body.center_lat || null,
      center_lng: body.center_lng || null,
      radius_miles: body.radius_miles || 25,
      state_codes: body.state_codes || null,
      zip_codes: body.zip_codes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await admin
    .from("regions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { error } = await admin.from("regions").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
