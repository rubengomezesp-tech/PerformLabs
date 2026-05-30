import { isPushConfigured, sendWebPush, type PushPayload } from "@/lib/notifications/push";
import { getRetentionRadar, type RetentionMember } from "@/lib/repositories/member-retention";
import {
  deletePushSubscription,
  listNudgeableSubscriptions,
  markSubscriptionNotified,
} from "@/lib/repositories/push-subscriptions";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";

function buildNudge(brandName: string, member: RetentionMember): PushPayload {
  const reasons = member.reasons.join(" ").toLowerCase();
  let body: string;
  if (reasons.includes("sin actividad")) {
    body = `${member.fullName.split(" ")[0]}, hace días que no te vemos. Un pequeño paso hoy te devuelve el ritmo 💪`;
  } else if (reasons.includes("entreno")) {
    body = "Esta semana aún no has entrenado. ¿Reservamos 30 minutos hoy?";
  } else if (reasons.includes("check-in")) {
    body = "Tu check-in está pendiente. Cuéntanos cómo vas y ajustamos el plan.";
  } else {
    body = "Tu objetivo te espera. ¿Entrenamos hoy? 💪";
  }
  return { title: brandName || "PerformLabs", body, url: "/app", tag: "pl-nudge" };
}

export type NudgeRunResult = {
  ok: boolean;
  reason?: string;
  sent: number;
  pruned: number;
  workspaces: number;
};

/**
 * Proactive inactivity nudges: for each workspace, find at-risk members (from the
 * retention radar) who have an active push subscription not contacted within the
 * cooldown, and send a motivational reminder — even with the app closed.
 * Templated content (zero AI cost). Frequency-capped to avoid spam.
 */
export async function runInactivityNudges(options: { maxPerRun?: number; cooldownDays?: number } = {}): Promise<NudgeRunResult> {
  const maxPerRun = options.maxPerRun ?? 1000;
  const cooldownDays = options.cooldownDays ?? 3;

  if (!isPushConfigured()) {
    return { ok: false, reason: "push_not_configured", sent: 0, pruned: 0, workspaces: 0 };
  }

  const { workspaces } = await listWorkspaceSummaries();
  let sent = 0;
  let pruned = 0;
  let processed = 0;

  for (const workspace of workspaces) {
    if (sent >= maxPerRun) break;
    const subs = await listNudgeableSubscriptions(workspace.id, cooldownDays);
    if (!subs.length) continue;

    const radar = await getRetentionRadar(workspace.id);
    const riskByMember = new Map(radar.members.filter((member) => member.tier !== "low").map((member) => [member.id, member]));
    if (!riskByMember.size) continue;
    processed += 1;

    for (const sub of subs) {
      if (sent >= maxPerRun) break;
      const risk = sub.memberProfileId ? riskByMember.get(sub.memberProfileId) : null;
      if (!risk) continue; // only nudge members the radar flags as at-risk

      const result = await sendWebPush(sub, buildNudge(workspace.name, risk));
      if (result.ok) {
        sent += 1;
        await markSubscriptionNotified(sub.id);
      } else if (result.gone) {
        await deletePushSubscription(sub.endpoint);
        pruned += 1;
      }
    }
  }

  return { ok: true, sent, pruned, workspaces: processed };
}
