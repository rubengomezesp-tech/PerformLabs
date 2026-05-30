import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { buildConnectAuthorizeUrl } from "@/lib/stripe/client";
import { isStripeConnectConfigured } from "@/lib/stripe/env";

export const dynamic = "force-dynamic";

/**
 * Starts the Stripe Connect (Standard) OAuth flow for the current workspace.
 * A random nonce is stored httpOnly and echoed back as `state` to defend the
 * callback against CSRF.
 */
export async function GET(request: NextRequest) {
  const brand = await getSelectedMemberAppBrand();
  await requireWorkspaceMutationAccess(brand.id);

  const origin = request.nextUrl.origin;
  if (!isStripeConnectConfigured()) {
    return NextResponse.redirect(`${origin}/coach/billing?status=not_configured`);
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${origin}/api/stripe/connect/callback`;
  const authorizeUrl = buildConnectAuthorizeUrl(nonce, redirectUri);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("stripe_connect_state", `${nonce}:${brand.id}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
