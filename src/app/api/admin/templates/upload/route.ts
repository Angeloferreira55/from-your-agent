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

const BUCKET = "template-assets";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  // Check if bucket exists
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
  } else {
    // Ensure it's public
    await admin.storage.updateBucket(BUCKET, { public: true });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminProfile = await requireAdmin(admin, userId);
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: { base64?: string; ext?: string; contentType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { base64, ext, contentType } = body;
  if (!base64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const filename = `${Date.now()}.${ext || "png"}`;
  const filePath = `templates/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  try {
    await ensureBucket(admin);

    const { error } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/png" });

    if (error) {
      console.error("Template upload failed:", error.message);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Template upload error:", err);
    return NextResponse.json({ error: "Upload failed unexpectedly" }, { status: 500 });
  }
}
