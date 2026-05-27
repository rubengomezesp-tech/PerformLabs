import { NextRequest, NextResponse } from "next/server";
import { selectedWorkspaceCookie } from "@/lib/member-app";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const brand = url.searchParams.get("brand");
  const next = url.searchParams.get("next") || "/app";
  const response = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/app", request.url));

  if (brand) {
    response.cookies.set(selectedWorkspaceCookie, brand, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
