import { isPushConfigured, sendWebPush } from "@/lib/notifications/push";
import {
  claimScheduledNotificationForSend,
  listDueScheduledNotifications,
  markScheduledNotificationStatus,
} from "@/lib/repositories/notification-management";
import { deletePushSubscription, listActiveSubscriptions } from "@/lib/repositories/push-subscriptions";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";

export type ScheduledRunResult = {
  ok: boolean;
  reason?: string;
  campaigns: number;
  sent: number;
  pruned: number;
};

/**
 * Delivers due scheduled push campaigns. For each campaign whose delivery time has
 * passed (status 'scheduled', channel 'push'), claim it atomically so overlapping
 * cron runs never double-send, push the coach's message to every opted-in member
 * of that workspace, prune dead subscriptions, and mark it 'sent'. Templated copy,
 * zero AI cost. Ships dark until VAPID keys are set.
 */
export async function runScheduledNotifications(options: { maxCampaigns?: number } = {}): Promise<ScheduledRunResult> {
  if (!isPushConfigured()) {
    return { ok: false, reason: "push_not_configured", campaigns: 0, sent: 0, pruned: 0 };
  }

  const due = await listDueScheduledNotifications(options.maxCampaigns ?? 200);
  if (!due.length) {
    return { ok: true, campaigns: 0, sent: 0, pruned: 0 };
  }

  const { workspaces } = await listWorkspaceSummaries();
  const nameById = new Map(workspaces.map((workspace) => [workspace.id, workspace.name]));

  let campaigns = 0;
  let sent = 0;
  let pruned = 0;

  for (const campaign of due) {
    const claimed = await claimScheduledNotificationForSend(campaign.id);
    if (!claimed) continue; // another run already took it
    campaigns += 1;

    try {
      const subs = await listActiveSubscriptions(campaign.workspaceId);
      const title = nameById.get(campaign.workspaceId) || "PerformLabs";
      for (const sub of subs) {
        const result = await sendWebPush(sub, {
          title,
          body: campaign.message || title,
          url: "/app",
          tag: "pl-campaign",
        });
        if (result.ok) {
          sent += 1;
        } else if (result.gone) {
          await deletePushSubscription(sub.endpoint);
          pruned += 1;
        }
      }
      await markScheduledNotificationStatus(campaign.id, "sent");
    } catch (error) {
      console.error("Scheduled campaign delivery failed", campaign.id, (error as Error).message);
      await markScheduledNotificationStatus(campaign.id, "failed");
    }
  }

  return { ok: true, campaigns, sent, pruned };
}
