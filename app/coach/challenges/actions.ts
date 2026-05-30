"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { createChallenge, setChallengeStatus, type ChallengeMetric } from "@/lib/repositories/challenges";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createChallengeAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createChallenge({
    workspaceId,
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    metric: (readText(formData, "metric") || "workouts") as ChallengeMetric,
    goal: parseInt(readText(formData, "goal"), 10) || 12,
    startsOn: readText(formData, "startsOn"),
    endsOn: readText(formData, "endsOn"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.challenge.created",
    entityType: "challenge",
  });

  revalidatePath("/coach/challenges");
  revalidatePath("/app/challenges");
}

export async function endChallengeAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const challengeId = readText(formData, "challengeId");

  await setChallengeStatus(workspaceId, challengeId, "ended");

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.challenge.ended",
    entityType: "challenge",
    entityId: challengeId,
  });

  revalidatePath("/coach/challenges");
  revalidatePath("/app/challenges");
}
