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

// Try multiple buckets in order — use whichever one exists
const BUCKET_CANDIDATES = ["brokerage-assets", "agent-logos", "agent-photos"];

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
  const filePath = `templates/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  // Try each bucket until one works
  let uploadedBucket: string | null = null;
  let lastError: string = "";

  for (const bucket of BUCKET_CANDIDATES) {
    const { error } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/png" });

    if (!error) {
      uploadedBucket = bucket;
      break;
    }
    lastError = error.message;
  }

  // If none of the existing buckets worked, try creating a new one
  if (!uploadedBucket) {
    const newBucket = "template-assets";
    await admin.storage.createBucket(newBucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });

    const { error } = await admin.storage
      .from(newBucket)
      .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/png" });

    if (error) {
      console.error("Template upload failed on all buckets:", lastError, error.message);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
    uploadedBucket = newBucket;
  }

  const { data: { publicUrl } } = admin.storage
    .from(uploadedBucket)
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl });
}
