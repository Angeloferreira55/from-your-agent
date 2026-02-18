import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_CANDIDATES = ["agent-logos", "agent-photos", "brokerage-assets"];

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { base64, ext, contentType } = await req.json();
  if (!base64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  const filename = `${Date.now()}.${ext || "png"}`;
  const filePath = `${userId}/card-design/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  let uploadedBucket: string | null = null;
  for (const bucket of BUCKET_CANDIDATES) {
    const { error } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, { upsert: true, contentType: contentType || "image/png" });
    if (!error) {
      uploadedBucket = bucket;
      break;
    }
  }

  if (!uploadedBucket) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from(uploadedBucket)
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl });
}
