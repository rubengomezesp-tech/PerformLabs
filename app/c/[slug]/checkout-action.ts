"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createMemberCheckout } from "@/lib/stripe/member-checkout";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Public sales-page checkout: a visitor picks a coach plan and we start a
 * member -> coach Direct-charge subscription (25% platform fee) by reusing the
 * Fase 1 `createMemberCheckout`. No member account exists yet — the Stripe webhook
 * provisions one after the payment is confirmed.
 */
export async function startMemberCheckoutAction(formData: FormData): Promise<void> {
  const workspaceId = readText(formData, "workspaceId");
  const planId = readText(formData, "planId");
  const slug = readText(formData, "slug");
  const email = readText(formData, "email");

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const proto = headerStore.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;
  const base = slug ? `${origin}/c/${slug}` : origin;

  if (!workspaceId || !planId) redirect(`${base}?status=error`);

  // Remember which coach this visitor is buying from so /acceso and /app resolve
  // the right brand when they return from Stripe (before custom domains, Fase 3).
  (await cookies()).set("performlabs_workspace_id", workspaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  const result = await createMemberCheckout({
    workspaceId,
    planId,
    email: email || undefined,
    successUrl: `${base}/gracias`,
    cancelUrl: `${base}?status=cancelled`,
  });

  if (!result.ok) redirect(`${base}?status=${result.reason}`);
  redirect(result.url);
}
