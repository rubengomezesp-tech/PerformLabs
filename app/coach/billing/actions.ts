"use server";

import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { archiveCoachPlan, createCoachPlan } from "@/lib/repositories/coach-plans";
import { deleteStripeAccount, getStripeAccount } from "@/lib/repositories/stripe-billing";
import { createConnectedPrice, createConnectedProduct, createPlatformCheckoutSession, deauthorizeConnect } from "@/lib/stripe/client";
import { getStripeEnv, isPlatformBillingConfigured } from "@/lib/stripe/env";
import { createMemberCheckout } from "@/lib/stripe/member-checkout";

async function baseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function subscribePlatformAction() {
  const brand = await getSelectedMemberAppBrand();
  const session = await requireWorkspaceMutationAccess(brand.id);
  if (!isPlatformBillingConfigured()) redirect("/coach/billing?status=not_configured");

  const { platformPriceId } = getStripeEnv();
  const origin = await baseUrl();
  const checkout = await createPlatformCheckoutSession({
    workspaceId: brand.id,
    priceId: platformPriceId,
    successUrl: `${origin}/coach/billing?status=subscribed`,
    cancelUrl: `${origin}/coach/billing?status=cancelled`,
    customerEmail: session.user.email ?? undefined,
  });
  redirect(checkout.url);
}

export async function disconnectStripeAction() {
  const brand = await getSelectedMemberAppBrand();
  await requireWorkspaceMutationAccess(brand.id);

  const account = await getStripeAccount(brand.id);
  if (account) {
    try {
      await deauthorizeConnect(account.stripeUserId);
    } catch {
      // Best effort: even if Stripe deauthorize fails, drop our local link.
    }
    await deleteStripeAccount(brand.id);
  }
  revalidatePath("/coach/billing");
}

export async function createCoachPlanAction(formData: FormData) {
  const brand = await getSelectedMemberAppBrand();
  await requireWorkspaceMutationAccess(brand.id);

  const account = await getStripeAccount(brand.id);
  if (!account || !account.chargesEnabled) redirect("/coach/billing?status=connect_first");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").replace(",", ".").trim();
  const interval = String(formData.get("interval") ?? "month") === "year" ? "year" : "month";
  // Real money goes to Stripe: never use native float arithmetic. `29.99 * 100`
  // is 2998.9999… in IEEE-754; Decimal keeps it exact (2999). Decimal throws on a
  // non-numeric string, which we treat as an invalid plan.
  let amountCents = 0;
  try {
    amountCents = new Decimal(amountRaw).times(100).round().toNumber();
  } catch {
    amountCents = 0;
  }
  if (!name || !Number.isFinite(amountCents) || amountCents < 50) {
    redirect("/coach/billing?status=invalid_plan");
  }

  const currency = (account.defaultCurrency || "eur").toLowerCase();
  const product = await createConnectedProduct(account.stripeUserId, name, description || null);
  const price = await createConnectedPrice(account.stripeUserId, { product: product.id, amountCents, currency, interval });
  await createCoachPlan({
    workspaceId: brand.id,
    name,
    description: description || null,
    amountCents,
    currency,
    interval,
    stripeProductId: product.id,
    stripePriceId: price.id,
  });
  revalidatePath("/coach/billing");
}

/**
 * Generate a TEST member-subscription checkout link for one of the coach's
 * client plans (Direct charge on the connected account, 25% platform fee). Lets
 * the coach verify the billing engine end to end before Phase 2 wires the member
 * app. Redirects to the Stripe URL on success, or back with an error param.
 */
export async function createMemberCheckoutLinkAction(formData: FormData) {
  const brand = await getSelectedMemberAppBrand();
  await requireWorkspaceMutationAccess(brand.id);

  const planId = String(formData.get("planId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  if (!planId) redirect("/coach/billing?status=invalid_plan");

  const origin = await baseUrl();
  const result = await createMemberCheckout({
    workspaceId: brand.id,
    planId,
    email: email || undefined,
    successUrl: `${origin}/coach/billing?status=member_checkout_ok`,
    cancelUrl: `${origin}/coach/billing?status=cancelled`,
  });

  if (!result.ok) redirect(`/coach/billing?status=member_checkout_error`);
  redirect(result.url);
}

export async function archiveCoachPlanAction(formData: FormData) {
  const brand = await getSelectedMemberAppBrand();
  await requireWorkspaceMutationAccess(brand.id);
  const planId = String(formData.get("planId") ?? "");
  if (planId) await archiveCoachPlan(brand.id, planId);
  revalidatePath("/coach/billing");
}
