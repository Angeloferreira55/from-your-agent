import { NextRequest, NextResponse } from "next/server";
import { lobPostcards } from "@/lib/lob/client";

export async function GET(req: NextRequest) {
  const allCookies = req.cookies.getAll();
  const allHeaders = Object.fromEntries(req.headers.entries());

  // Test Lob connection
  let lobStatus = "unknown";
  let lobError = "";
  const lobKeyPrefix = (process.env.LOB_API_KEY || "").substring(0, 8) + "...";
  try {
    const result = await lobPostcards.list(1);
    lobStatus = `ok (${(result as any)?.count ?? "?"} postcards)`;
  } catch (err: unknown) {
    lobStatus = "error";
    lobError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    cookieCount: allCookies.length,
    cookieNames: allCookies.map((c) => c.name),
    hasUserIdHeader: !!allHeaders["x-user-id"],
    userIdHeader: allHeaders["x-user-id"] || null,
    lobKeyPrefix,
    lobStatus,
    lobError: lobError || undefined,
  });
}
