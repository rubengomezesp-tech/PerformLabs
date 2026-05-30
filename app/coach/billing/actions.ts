"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { deleteStripeAccount, getStripeAccount } from "@/lib/repositories/stripe-billing";
import { createPlatformCheckoutSession, deauthorizeConnect } from "@/lib/stripe/client";
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
