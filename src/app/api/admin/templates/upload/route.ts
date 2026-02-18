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

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { base64, ext, contentType } = await request.json();
  if (!base64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const filename = `${Date.now()}.${ext || "png"}`;
  const filePath = `templates/assets/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  const { error: uploadError } = await admin.storage
    .from("brokerage-assets")
    .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/png" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from("brokerage-assets")
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl });
}
