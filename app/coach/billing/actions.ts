"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { archiveCoachPlan, createCoachPlan } from "@/lib/repositories/coach-plans";
import { deleteStripeAccount, getStripeAccount } from "@/lib/repositories/stripe-billing";
import { createConnectedPrice, createConnectedProduct, createPlatformCheckoutSession, deauthorizeConnect } from "@/lib/stripe/client";
import { getStripeEnv, isPlatformBillingConfigured } from "@/lib/stripe/env";

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
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const interval = String(formData.get("interval") ?? "month") === "year" ? "year" : "month";
  const amountCents = Math.round(amount * 100);
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

export async function archiveCoachPlanAction(formData: FormData) {
  const brand = await getSelectedMemberAppBrand();
  await requireWorkspaceMutationAccess(brand.id);
  const planId = String(formData.get("planId") ?? "");
  if (planId) await archiveCoachPlan(brand.id, planId);
  revalidatePath("/coach/billing");
}
