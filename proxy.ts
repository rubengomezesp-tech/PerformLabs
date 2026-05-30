import { NextResponse, type NextRequest } from "next/server";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { authAccessCookie } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const authRequired = isConsoleAuthRequired();

  if (!authRequired) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authAccessCookie)?.value;
  const isMemberPath = request.nextUrl.pathname.startsWith("/app");
  const protectedPath = request.nextUrl.pathname.startsWith("/console")
    || request.nextUrl.pathname.startsWith("/coach")
    || isMemberPath;

  if (!token && protectedPath) {
    // Members get the passwordless client entry; staff get the console login.
    const loginUrl = new URL(isMemberPath ? "/acceso" : "/login", request.url);
    if (!isMemberPath) {
      loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*", "/coach/:path*", "/app/:path*"],
};
