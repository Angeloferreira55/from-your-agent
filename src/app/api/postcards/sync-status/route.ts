import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lobPostcards } from "@/lib/lob/client";

export const maxDuration = 300;

// POST — Sync postcard statuses from Lob (admin only)
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { campaign_id } = await req.json();
  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
  }

  // Get all postcards with lob IDs for this campaign
  const { data: postcards } = await admin
    .from("postcards")
    .select("id, lob_postcard_id, status")
    .eq("campaign_id", campaign_id)
    .not("lob_postcard_id", "is", null);

  if (!postcards || postcards.length === 0) {
    return NextResponse.json({ error: "No postcards to sync" }, { status: 400 });
  }

  const STATUS_MAP: Record<string, string> = {
    processed_for_delivery: "mailed",
    rendered: "mailed",
    in_transit: "in_transit",
    in_local_area: "in_local_area",
    delivered: "delivered",
    returned_to_sender: "returned",
    cancelled: "canceled",
  };

  let updated = 0;
  let errors = 0;
  const sampleStatuses: string[] = [];

  for (const pc of postcards) {
    try {
      const lobPc = await lobPostcards.get(pc.lob_postcard_id);
      const lobRaw = lobPc as unknown as Record<string, unknown>;
      const lobStatus = (lobRaw.status as string) || "";

      // Log first 3 statuses for debugging
      if (sampleStatuses.length < 3) {
        sampleStatuses.push(`${pc.lob_postcard_id}: lob="${lobStatus}" db="${pc.status}"`);
      }

      const mappedStatus = STATUS_MAP[lobStatus] || lobStatus;

      if (mappedStatus && mappedStatus !== pc.status) {
        await admin
          .from("postcards")
          .update({ status: mappedStatus })
          .eq("id", pc.id);
        updated++;
      }
    } catch {
      errors++;
    }

    // Small delay to respect rate limits
    if (postcards.indexOf(pc) % 50 === 49) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return NextResponse.json({
    total: postcards.length,
    updated,
    errors,
    sampleStatuses,
  });
}
