"use server";

import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getDefaultMember } from "@/lib/repositories/coach-brain";
import { deletePushSubscription, savePushSubscription } from "@/lib/repositories/push-subscriptions";

type ClientSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function subscribeMemberPushAction(subscription: ClientSubscription, userAgent?: string) {
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return { ok: false as const };
  }
  const brand = await getSelectedMemberAppBrand();
  const member = await getDefaultMember(brand.id);
  await savePushSubscription({
    workspaceId: brand.id,
    memberProfileId: member?.id ?? null,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: userAgent ?? null,
  });
  return { ok: true as const };
}

export async function unsubscribeMemberPushAction(endpoint: string) {
  if (endpoint) await deletePushSubscription(endpoint);
  return { ok: true as const };
}
