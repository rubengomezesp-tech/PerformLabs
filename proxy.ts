import { NextResponse, type NextRequest } from "next/server";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { authAccessCookie } from "@/lib/auth/session";

/** A trainer's own subdomain/custom domain — not the platform apex or Vercel URL. */
function isTenantHost(request: NextRequest): boolean {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!host || host === "performlabs.app" || host === "localhost" || host === "127.0.0.1") return false;
  return !host.endsWith(".vercel.app");
}

/**
 * Per-request Content-Security-Policy. A fresh nonce authorises exactly the
 * scripts Next.js emits for this response; `'strict-dynamic'` lets those trusted
 * scripts load the rest, so we can drop `'unsafe-inline'`/`'unsafe-eval'` from
 * script-src entirely (the old static policy allowed both, defeating most XSS
 * defence). `'unsafe-eval'` is re-added only in dev, where the HMR client needs it.
 * style-src keeps `'unsafe-inline'`: many libraries set inline styles and that is
 * not a script-execution vector.
 */
function buildContentSecurityPolicy(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "connect-src 'self' https: wss: ws: data:",
    "media-src 'self' blob: data: https:",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildContentSecurityPolicy(nonce);

  // Next reads the nonce from the request's CSP header to sign its own inline
  // bootstrap/hydration scripts; x-nonce is exposed for any server component that
  // renders a script of its own. Both must travel on the *request* headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const proceed = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  // On a trainer's domain the root is THEIR branded member landing, not the
  // PerformLabs commercial site. Serve /m in place (URL stays the trainer's).
  if (request.nextUrl.pathname === "/" && isTenantHost(request)) {
    return withCsp(NextResponse.rewrite(new URL("/m", request.url), { request: { headers: requestHeaders } }));
  }

  const authRequired = isConsoleAuthRequired();

  if (!authRequired) {
    return withCsp(proceed());
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
    return withCsp(NextResponse.redirect(loginUrl));
  }

  return withCsp(proceed());
}

export const config = {
  // Run on every document route so the CSP is applied wherever HTML with scripts
  // is served. Excludes API routes and static assets (no inline scripts there).
  // The rewrite/redirect logic above stays gated on pathname, so widening the
  // matcher only adds the security headers elsewhere — it changes no routing.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
