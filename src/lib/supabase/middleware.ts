import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

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
