import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { sendWelcomeEmail, sendNewAgentNotification } from "@/lib/email/client";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, firstName } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await sendWelcomeEmail(email, firstName || "there");

    // Notify admin of new signup (fire-and-forget)
    sendNewAgentNotification(email, firstName || "").catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Welcome email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
