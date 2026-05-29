"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { reviewMemberCheckin } from "@/lib/repositories/checkin-management";
import { advanceMemberWorkoutPlan } from "@/lib/repositories/member-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function reviewCoachCheckinAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await reviewMemberCheckin({
    workspaceId,
    checkinId: readText(formData, "checkinId"),
    resultStatus: readText(formData, "resultStatus"),
    coachFeedback: readText(formData, "coachFeedback"),
    nextActions: readText(formData, "nextActions"),
    reviewedBy: session.mode === "authenticated" ? session.user.id : null,
  });

  const planAction = readText(formData, "planAction");
  const memberProfileId = readText(formData, "memberProfileId");
  let planResult: { updated: boolean; currentWeek: number } | null = null;
  if (planAction === "advance" && memberProfileId) {
    const reviewInDays = Number.parseInt(readText(formData, "reviewInDays"), 10);
    planResult = await advanceMemberWorkoutPlan({
      workspaceId,
      memberProfileId,
      advanceWeeks: 1,
      nextReviewInDays: Number.isFinite(reviewInDays) ? reviewInDays : 7,
    });
  }

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.checkin.reviewed",
    entityType: "customer_checkin",
    entityId: readText(formData, "checkinId") || null,
    metadata: {
      resultStatus: readText(formData, "resultStatus"),
      planAction: planAction || "none",
      planAdvancedToWeek: planResult?.updated ? planResult.currentWeek : null,
    },
  });

  revalidatePath("/coach/checkins");
  revalidatePath("/coach/members");
  revalidatePath("/app/progress");
  revalidatePath("/app/workouts");
}
