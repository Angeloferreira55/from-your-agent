import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/contacts — list contacts for current agent
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  let query = admin
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("agent_id", profile.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contacts: data, total: count, page, limit });
}

// POST /api/contacts — create a single contact
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json();

  const { data, error } = await admin
    .from("contacts")
    .insert({
      agent_id: profile.id,
      first_name: body.first_name,
      last_name: body.last_name,
      address_line1: body.address_line1,
      address_line2: body.address_line2 || null,
      city: body.city,
      state: body.state,
      zip: body.zip,
      email: body.email || null,
      phone: body.phone || null,
      relationship_type: body.relationship_type || "sphere",
      tags: body.tags || null,
      notes: body.notes || null,
      source: "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/contacts — update a contact
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Contact ID required" }, { status: 400 });

  const { data, error } = await admin
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE /api/contacts — delete contacts
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const body = await request.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [body.id];

  const { error } = await admin
    .from("contacts")
    .delete()
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: ids.length });
}
