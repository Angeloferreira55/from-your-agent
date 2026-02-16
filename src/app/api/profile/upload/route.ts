import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { base64, type, ext, contentType } = await req.json();

  const validTypes = ["logo", "photo", "brokerage_logo", "team_logo"];
  if (!base64 || !validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const bucket = type === "photo" ? "agent-photos" : "agent-logos";
  const filePath = `${userId}/${type}.${ext || "jpg"}`;
  const buffer = Buffer.from(base64, "base64");

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/jpeg" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  const fieldMap: Record<string, string> = {
    logo: "logo_url",
    photo: "photo_url",
    brokerage_logo: "brokerage_logo_url",
    team_logo: "team_logo_url",
  };

  const { error: updateError } = await admin
    .from("agent_profiles")
    .update({ [fieldMap[type]]: publicUrl })
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
