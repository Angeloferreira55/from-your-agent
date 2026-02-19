import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "template-assets";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
  } else {
    await admin.storage.updateBucket(BUCKET, { public: true });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { base64?: string; ext?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { base64, ext, contentType } = body;
  if (!base64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  const filename = `${Date.now()}.${ext || "png"}`;
  const filePath = `${userId}/card-design/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  try {
    await ensureBucket(admin);

    const { error } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/png" });

    if (error) {
      console.error("Design upload failed:", error.message);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Design upload error:", err);
    return NextResponse.json({ error: "Upload failed unexpectedly" }, { status: 500 });
  }
}
