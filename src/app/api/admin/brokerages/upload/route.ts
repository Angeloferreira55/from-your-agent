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

  const { base64, brokerageId, type, ext, contentType } = await request.json();

  const validTypes = ["logo", "background", "second_logo"];
  if (!base64 || !brokerageId || !validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const filePath = `brokerages/${brokerageId}/${type}.${ext || "png"}`;
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

  // Map type to DB column
  const fieldMap: Record<string, string> = {
    logo: "logo_url",
    background: "background_url",
    second_logo: "second_logo_url",
  };

  const { error: updateError } = await admin
    .from("brokerages")
    .update({ [fieldMap[type]]: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", brokerageId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
