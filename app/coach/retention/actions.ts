"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { draftRetentionMessage } from "@/lib/ai/retention-copilot";
import { checkAiQuota, recordAiUsage } from "@/lib/ai/usage";
import { getCoachBrain } from "@/lib/repositories/coach-brain";
import { createOutreachDraft, setOutreachStatus } from "@/lib/repositories/retention-outreach";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function draftRetentionNudgeAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const memberProfileId = readText(formData, "memberProfileId");
  const memberName = readText(formData, "memberName") || "Cliente";
  const reason = readText(formData, "reason");
  const riskScore = parseInt(readText(formData, "riskScore"), 10) || 0;

  const quota = await checkAiQuota(workspaceId, "coach_brain");
  if (!quota.allowed) {
    revalidatePath("/coach/retention");
    return;
  }

  const brand = await getWorkspaceBrand(workspaceId);
  const brain = await getCoachBrain(workspaceId);
  const result = await draftRetentionMessage({
    brain,
    brandName: brand?.name ?? "tu coach",
    memberName,
    reasons: reason ? reason.split(" · ") : [],
    riskScore,
  });

  if (!result.ok) {
    revalidatePath("/coach/retention");
    return;
  }

  await recordAiUsage({ workspaceId, feature: "coach_brain", model: result.model, usage: result.usage, memberProfileId });
  await createOutreachDraft({ workspaceId, memberProfileId, riskScore, reason, message: result.message });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.retention_nudge.drafted",
    entityType: "retention_outreach",
    entityId: memberProfileId,
  });

  revalidatePath("/coach/retention");
}

export async function markOutreachSentAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const outreachId = readText(formData, "outreachId");

  await setOutreachStatus(workspaceId, outreachId, "sent");

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.retention_nudge.sent",
    entityType: "retention_outreach",
    entityId: outreachId,
  });

  revalidatePath("/coach/retention");
}

export async function dismissOutreachAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  await requireWorkspaceMutationAccess(workspaceId);
  await setOutreachStatus(workspaceId, readText(formData, "outreachId"), "dismissed");
  revalidatePath("/coach/retention");
}
