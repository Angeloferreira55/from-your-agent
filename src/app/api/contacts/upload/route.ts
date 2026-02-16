import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/contacts/upload — bulk import contacts from CSV data
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
  const { contacts, fileName, columnMapping } = body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
  }

  // Create import batch record
  const { data: importBatch, error: batchError } = await admin
    .from("contact_imports")
    .insert({
      agent_id: profile.id,
      file_name: fileName || "upload.csv",
      total_rows: contacts.length,
      column_mapping: columnMapping,
      status: "processing",
    })
    .select()
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: Array<{ row: number; error: string }> = [];

  // Process contacts in batches of 100
  const batchSize = 100;
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);

    const rows = batch
      .map((contact: Record<string, string>, idx: number) => {
        const firstName = (contact.first_name || "").trim();
        const lastName = (contact.last_name || "").trim();
        const addressLine1 = (contact.address_line1 || "").trim();
        const city = (contact.city || "").trim();
        const state = (contact.state || "").trim();
        const zip = (contact.zip || "").trim();

        // Validate required fields
        if (!firstName || !lastName || !addressLine1 || !city || !state || !zip) {
          errors.push({
            row: i + idx + 1,
            error: "Missing required field(s): first_name, last_name, address, city, state, or zip",
          });
          errorCount++;
          return null;
        }

        return {
          agent_id: profile.id,
          first_name: firstName,
          last_name: lastName,
          address_line1: addressLine1,
          address_line2: (contact.address_line2 || "").trim() || null,
          city,
          state: state.toUpperCase().substring(0, 2),
          zip: zip.substring(0, 10),
          email: (contact.email || "").trim() || null,
          phone: (contact.phone || "").trim() || null,
          relationship_type: contact.relationship_type || "sphere",
          source: "csv_import" as const,
          import_batch_id: importBatch.id,
        };
      })
      .filter(Boolean);

    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await admin
        .from("contacts")
        .insert(rows)
        .select("id");

      if (insertError) {
        errorCount += rows.length;
        errors.push({
          row: i + 1,
          error: `Batch insert failed: ${insertError.message}`,
        });
      } else {
        importedCount += inserted?.length || 0;
      }
    }
  }

  skippedCount = contacts.length - importedCount - errorCount;

  // Update import batch with results
  await admin
    .from("contact_imports")
    .update({
      imported_count: importedCount,
      skipped_count: skippedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : null,
      status: errorCount === contacts.length ? "failed" : "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", importBatch.id);

  return NextResponse.json({
    importId: importBatch.id,
    total: contacts.length,
    imported: importedCount,
    skipped: skippedCount,
    errors: errorCount,
    errorDetails: errors.slice(0, 10), // Return first 10 errors
  });
}
