import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

// For Server Components (uses next/headers cookies)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// For Route Handlers — extract user ID directly from Supabase auth cookie JWT
export function getUserId(req: NextRequest): string | null {
  // Try middleware header first
  const headerId = req.headers.get("x-user-id");
  if (headerId) return headerId;

  // Fallback: decode JWT from Supabase auth cookie
  try {
    const allCookies = req.cookies.getAll();

    // Find Supabase auth token cookies (may be chunked: .0, .1, etc.)
    const authCookies = allCookies
      .filter((c) => c.name.includes("-auth-token"))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (authCookies.length === 0) return null;

    // Reconstruct the value (chunked cookies are split into parts)
    let tokenStr = authCookies.map((c) => c.value).join("");

    // Remove "base64-" prefix if present (supabase ssr v0.5+ format)
    if (tokenStr.startsWith("base64-")) {
      tokenStr = Buffer.from(tokenStr.slice(7), "base64").toString();
    }

    // Parse the session JSON to get the access_token
    const session = JSON.parse(tokenStr);
    const accessToken = session.access_token;
    if (!accessToken) return null;

    // Decode JWT payload (base64url encoded, no verification needed —
    // middleware already verified the session)
    const payloadB64 = accessToken.split(".")[1];
    if (!payloadB64) return null;

    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    );
    return payload.sub || null;
  } catch (err) {
    console.error("[getUserId] failed to decode auth cookie:", err);
    return null;
  }
}
