import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only these routes need a live Supabase auth check in the middleware.
// Everything else — marketing pages, API routes, static assets — skips the
// network call entirely. API handlers derive the user from the auth cookie
// via getUserId() (which falls back to decoding the cookie JWT), so they do
// not depend on this middleware running.
function needsAuthCheck(path: string): boolean {
  return (
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path === "/login" ||
    path === "/signup"
  );
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public / API / static routes: never touch Supabase. This keeps the
  // marketing site up even when Supabase is slow or unreachable, and is what
  // prevents a hanging auth call from becoming a MIDDLEWARE_INVOCATION_TIMEOUT.
  if (!needsAuthCheck(path)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Guard the Supabase network call: if it doesn't answer within 3s (or throws
  // on a network error), bail out instead of letting the request hang until
  // Vercel returns a 504.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  let degraded = false;
  try {
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null }; timedOut: true }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, timedOut: true }), 3000)
      ),
    ]);
    user = authResult.data.user;
    degraded = "timedOut" in authResult;
  } catch {
    degraded = true;
  }

  // Fail safe on timeout/error: send protected routes to login rather than hang.
  if (degraded) {
    if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // Redirect unauthenticated users from protected routes
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Check admin role for /admin routes
  if (user && path.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("agent_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Pass verified user ID to route handlers via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id"); // prevent client spoofing
  if (user) {
    requestHeaders.set("x-user-id", user.id);
  }

  // Recreate response with modified request headers
  const finalResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Preserve Supabase Set-Cookie headers for the browser
  for (const { name, value, ...options } of supabaseResponse.cookies.getAll()) {
    finalResponse.cookies.set(name, value, options);
  }

  return finalResponse;
}
