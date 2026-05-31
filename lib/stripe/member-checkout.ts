import { getCoachClientPlan } from "@/lib/repositories/coach-plans";
import { getStripeAccount } from "@/lib/repositories/stripe-billing";
import { createConnectedCheckoutSession } from "@/lib/stripe/client";
import { getStripeEnv, isStripeConfigured } from "@/lib/stripe/env";

// Server-callable entry point for the MEMBER -> COACH subscription checkout.
// Plain async (NOT "use server"): a server action wraps it. Degrades gracefully
// and returns a typed result instead of throwing, so callers can branch on it.

export type CreateMemberCheckoutInput = {
  workspaceId: string;
  planId: string;
  email?: string;
  memberProfileId?: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreateMemberCheckoutResult =
  | { ok: true; url: string }
  | {
      ok: false;
      reason:
        | "stripe_not_configured"
        | "missing_params"
        | "account_not_found"
        | "charges_disabled"
        | "plan_not_found"
        | "plan_workspace_mismatch"
        | "plan_missing_price"
        | "checkout_failed";
    };

/**
 * Build a Stripe Checkout Session for a member subscribing to their coach via a
 * Direct charge on the coach's connected account. PerformLabs keeps a 25%
 * application fee (env STRIPE_APPLICATION_FEE_PERCENT) on every invoice.
 *
 * Returns `{ ok:false, reason }` for every failure (never throws to the caller).
 */
export async function createMemberCheckout(
  input: CreateMemberCheckoutInput,
): Promise<CreateMemberCheckoutResult> {
  if (!isStripeConfigured()) return { ok: false, reason: "stripe_not_configured" };
  if (!input.workspaceId || !input.planId) return { ok: false, reason: "missing_params" };

  try {
    const [account, plan] = await Promise.all([
      getStripeAccount(input.workspaceId),
      getCoachClientPlan(input.planId),
    ]);

    if (!account) return { ok: false, reason: "account_not_found" };
    if (!account.chargesEnabled) return { ok: false, reason: "charges_disabled" };
    if (!plan) return { ok: false, reason: "plan_not_found" };
    if (plan.workspaceId !== input.workspaceId) return { ok: false, reason: "plan_workspace_mismatch" };
    if (!plan.stripePriceId) return { ok: false, reason: "plan_missing_price" };

    const metadata = {
      kind: "member_subscription",
      workspace_id: input.workspaceId,
      coach_client_plan_id: input.planId,
      member_profile_id: input.memberProfileId ?? "",
    };

    const session = await createConnectedCheckoutSession(
      {
        mode: "subscription",
        lineItems: [{ price: plan.stripePriceId }],
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        customerEmail: input.email,
        applicationFeePercent: getStripeEnv().applicationFeePercent,
        clientReferenceId: input.memberProfileId,
        metadata,
        subscriptionMetadata: metadata,
      },
      { stripeAccount: account.stripeUserId },
    );

    if (!session.url) return { ok: false, reason: "checkout_failed" };
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("createMemberCheckout failed", (error as Error).message);
    return { ok: false, reason: "checkout_failed" };
  }
}
