import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const allCookies = req.cookies.getAll();
  const allHeaders = Object.fromEntries(req.headers.entries());

  return NextResponse.json({
    cookieCount: allCookies.length,
    cookieNames: allCookies.map((c) => c.name),
    hasUserIdHeader: !!allHeaders["x-user-id"],
    userIdHeader: allHeaders["x-user-id"] || null,
    headerKeys: Object.keys(allHeaders),
  });
}
