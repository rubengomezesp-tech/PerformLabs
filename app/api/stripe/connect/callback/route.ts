import { NextResponse, type NextRequest } from "next/server";
import { upsertStripeAccount } from "@/lib/repositories/stripe-billing";
import { exchangeConnectCode, retrieveAccount, type StripeAccountResponse } from "@/lib/stripe/client";
import { isStripeConnectConfigured } from "@/lib/stripe/env";

export const dynamic = "force-dynamic";

/** Stripe redirects here after the coach authorizes. We validate the state,
 * exchange the code for the connected account id, and persist it. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const billing = `${origin}/coach/billing`;

  if (!isStripeConnectConfigured()) {
    return NextResponse.redirect(`${billing}?status=not_configured`);
  }

  const params = request.nextUrl.searchParams;
  if (params.get("error")) {
    return NextResponse.redirect(`${billing}?status=denied`);
  }

  const code = params.get("code");
  const state = params.get("state");
  const cookie = request.cookies.get("stripe_connect_state")?.value ?? "";
  const [cookieNonce, workspaceId] = cookie.split(":");

  if (!code || !state || !cookieNonce || state !== cookieNonce || !workspaceId) {
    return NextResponse.redirect(`${billing}?status=invalid_state`);
  }

  try {
    const token = await exchangeConnectCode(code);
    let account: StripeAccountResponse | null = null;
    try {
      account = await retrieveAccount(token.stripe_user_id);
    } catch {
      // Non-fatal: store what we have; the webhook will fill the rest.
    }
    await upsertStripeAccount({
      workspaceId,
      stripeUserId: token.stripe_user_id,
      livemode: Boolean(token.livemode),
      scope: token.scope ?? null,
      country: account?.country ?? null,
      defaultCurrency: account?.default_currency ?? null,
      chargesEnabled: account?.charges_enabled ?? false,
      payoutsEnabled: account?.payouts_enabled ?? false,
      detailsSubmitted: account?.details_submitted ?? false,
    });
  } catch {
    return NextResponse.redirect(`${billing}?status=error`);
  }

  const response = NextResponse.redirect(`${billing}?status=connected`);
  response.cookies.set("stripe_connect_state", "", { path: "/", maxAge: 0 });
  return response;
}
