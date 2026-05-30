import { NextResponse, type NextRequest } from "next/server";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { authAccessCookie } from "@/lib/auth/session";

/** A trainer's own subdomain/custom domain — not the platform apex or Vercel URL. */
function isTenantHost(request: NextRequest): boolean {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!host || host === "performlabs.app" || host === "localhost" || host === "127.0.0.1") return false;
  return !host.endsWith(".vercel.app");
}

export function proxy(request: NextRequest) {
  // On a trainer's domain the root is THEIR branded member landing, not the
  // PerformLabs commercial site. Serve /m in place (URL stays the trainer's).
  if (request.nextUrl.pathname === "/" && isTenantHost(request)) {
    return NextResponse.rewrite(new URL("/m", request.url));
  }

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
  matcher: ["/", "/console/:path*", "/coach/:path*", "/app/:path*"],
};
