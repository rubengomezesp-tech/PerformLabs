import { isPushConfigured, sendWebPush } from "@/lib/notifications/push";
import { getEnabledPushTemplate } from "@/lib/repositories/notification-management";
import { deletePushSubscription, listMemberSubscriptions, markSubscriptionNotified } from "@/lib/repositories/push-subscriptions";

/**
 * Fire a member's push for a domain event (payment failed, account activated,
 * plan activated…) using the coach's enabled template for that event key.
 * Best-effort and fully self-contained: it never throws, so a push failure can
 * never break the caller — critically the Stripe webhook's payment processing.
 * Ships dark until VAPID keys are set.
 */
export async function fireMemberEventNotification(input: {
  workspaceId: string | null | undefined;
  memberProfileId: string | null | undefined;
  eventKey: string;
}): Promise<void> {
  try {
    const { workspaceId, memberProfileId, eventKey } = input;
    if (!isPushConfigured() || !workspaceId || !memberProfileId) return;

    const template = await getEnabledPushTemplate(workspaceId, eventKey);
    if (!template || !template.body) return;

    const subs = await listMemberSubscriptions(workspaceId, memberProfileId);
    for (const sub of subs) {
      const result = await sendWebPush(sub, {
        title: template.subject || "PerformLabs",
        body: template.body,
        url: "/app",
        tag: `pl-${eventKey}`,
      });
      if (result.ok) await markSubscriptionNotified(sub.id);
      else if (result.gone) await deletePushSubscription(sub.endpoint);
    }
  } catch (error) {
    console.error("fireMemberEventNotification failed", input.eventKey, (error as Error).message);
  }
}
