import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const STATE_NAME_TO_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

function normalizeState(raw: string): string {
  const trimmed = raw.trim();
  // Already a 2-letter abbreviation
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  // Try full state name lookup
  const abbr = STATE_NAME_TO_ABBR[trimmed.toLowerCase()];
  if (abbr) return abbr;
  // Fallback: take first 2 characters uppercased
  return trimmed.toUpperCase().substring(0, 2);
}

// Extend Vercel function timeout for large imports
export const maxDuration = 60;

// POST /api/contacts/upload — bulk import contacts from CSV data
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  let { data: profile } = await admin
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  // Profile missing (e.g. created before trigger was deployed) — auto-create it
  if (!profile) {
    const { data: { user } } = await admin.auth.admin.getUserById(userId);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: newProfile, error: createError } = await admin
      .from("agent_profiles")
      .insert({
        user_id: userId,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
      })
      .select("id")
      .single();

    if (createError) {
      return NextResponse.json({ error: "Failed to initialize profile" }, { status: 500 });
    }
    profile = newProfile;
  }

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
        // Support full_name column — split on first space into first + last
        let firstName = (contact.first_name || "").trim();
        let lastName = (contact.last_name || "").trim();
        if (!firstName && !lastName && contact.full_name) {
          const parts = contact.full_name.trim().split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || parts[0] || "";
        }
        // Support full_address column — parse "123 Main St, City, ST 12345"
        let addressLine1 = (contact.address_line1 || "").trim();
        let city = (contact.city || "").trim();
        let state = (contact.state || "").trim();
        let zip = (contact.zip || "").trim();
        if (!addressLine1 && contact.full_address) {
          const parts = contact.full_address.split(",").map((p: string) => p.trim());
          if (parts.length >= 3) {
            addressLine1 = parts[0];
            city = parts[1];
            const stateZip = parts[2].trim().split(/\s+/);
            state = stateZip[0] || "";
            zip = stateZip[1] || "";
          } else if (parts.length === 2) {
            addressLine1 = parts[0];
            city = parts[1];
          } else {
            addressLine1 = parts[0] || contact.full_address.trim();
          }
        }

        // Validate required fields
        if (!firstName || !lastName || !addressLine1 || !city || !state || !zip) {
          errors.push({
            row: i + idx + 1,
            error: "Missing required field(s): name, address, city, state, or zip",
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
          state: normalizeState(state),
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
