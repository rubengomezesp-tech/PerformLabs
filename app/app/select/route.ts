import { NextRequest, NextResponse } from "next/server";
import { selectedWorkspaceCookie } from "@/lib/member-app";

/**
 * Accept only same-origin absolute paths. Rejects protocol-relative (`//evil`),
 * scheme (`://`) and backslash (`/\evil`, which browsers normalize to `//`)
 * forms so `?next=` can't become an open redirect.
 */
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/app";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const brand = url.searchParams.get("brand");
  const response = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), request.url));

  // The cookie value feeds getWorkspaceBrand's lookup, so only set it for a
  // well-formed slug/uuid/domain ref — never arbitrary attacker-controlled input.
  if (brand && /^[a-z0-9.-]+$/i.test(brand)) {
    response.cookies.set(selectedWorkspaceCookie, brand, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
