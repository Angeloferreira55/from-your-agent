import { type NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Endpoints and their limits (requests per window)
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/email/welcome":   { limit: 5,  windowMs: 60_000 },       // 5/min per IP
  "/api/auth/check-admin": { limit: 10, windowMs: 60_000 },      // 10/min per IP
  "/api/postcards/test":  { limit: 10, windowMs: 60_000 },       // 10/min per IP
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = RATE_LIMITS[pathname];

  if (rule) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const result = rateLimit(`${ip}:${pathname}`, rule.limit, rule.windowMs);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(rule.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/email/welcome",
    "/api/auth/check-admin",
    "/api/postcards/test",
  ],
};
