import { NextResponse, type NextRequest } from "next/server";
import { authAccessCookie } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const authRequired = process.env.COACHOS_AUTH_REQUIRED === "true";

  if (!authRequired) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authAccessCookie)?.value;

  if (!token && request.nextUrl.pathname.startsWith("/console")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*"],
};
