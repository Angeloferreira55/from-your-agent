import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BROKERAGES, type BrokerageConfig } from "@/data/brokerages";

async function requireAdmin(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();
  if (profile?.role !== "admin") return null;
  return profile;
}

// In-memory store starts from static data. Persists across requests in the same process.
let brokerageStore: Record<string, BrokerageConfig> = { ...BROKERAGES };

// GET — list all brokerages
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const brokerages = Object.values(brokerageStore).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return NextResponse.json({ brokerages });
}

// POST — create new brokerage
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  if (!body.id || !body.name) {
    return NextResponse.json({ error: "ID and Name are required" }, { status: 400 });
  }

  if (brokerageStore[body.id]) {
    return NextResponse.json({ error: "Brokerage with this ID already exists" }, { status: 409 });
  }

  const brokerage: BrokerageConfig = {
    id: body.id,
    name: body.name,
    slogan: body.slogan || "",
    website: body.website || "",
    logoUrl: body.logoUrl || "",
    secondLogoUrl: body.secondLogoUrl || undefined,
    backgroundUrl: body.backgroundUrl || "",
    brandColor: body.brandColor || "#1B3A5C",
    overlayColor: body.overlayColor || "rgba(27, 58, 92, 0.65)",
    textColor: body.textColor || "#FFFFFF",
    socialLinks: body.socialLinks || {},
    disclaimer: body.disclaimer || "If your home is currently on the market, please don't consider this a solicitation.",
  };

  brokerageStore[brokerage.id] = brokerage;
  return NextResponse.json(brokerage, { status: 201 });
}

// PATCH — update existing brokerage
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id || !brokerageStore[id]) {
    return NextResponse.json({ error: "Brokerage not found" }, { status: 404 });
  }

  brokerageStore[id] = { ...brokerageStore[id], ...updates };
  return NextResponse.json(brokerageStore[id]);
}

// DELETE — remove brokerage
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  if (!body.id || !brokerageStore[body.id]) {
    return NextResponse.json({ error: "Brokerage not found" }, { status: 404 });
  }

  delete brokerageStore[body.id];
  return NextResponse.json({ deleted: true });
}
