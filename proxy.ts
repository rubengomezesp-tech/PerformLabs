import { NextResponse, type NextRequest } from "next/server";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { authAccessCookie } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const authRequired = isConsoleAuthRequired();

  if (!authRequired) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authAccessCookie)?.value;
  const protectedPath = request.nextUrl.pathname.startsWith("/console")
    || request.nextUrl.pathname.startsWith("/coach")
    || request.nextUrl.pathname.startsWith("/app");

  if (!token && protectedPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*", "/coach/:path*", "/app/:path*"],
};
