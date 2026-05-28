"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { markOnboardingBriefingReviewed } from "@/lib/repositories/coach-dashboard";
import { applyOnboardingPlanRecommendation } from "@/lib/repositories/member-onboarding";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import type { Json } from "@/lib/supabase/database.types";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function markCoachBriefingReviewedAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const responseId = readText(formData, "responseId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await markOnboardingBriefingReviewed({
    workspaceId,
    responseId,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.onboarding.reviewed",
    entityType: "member_onboarding_response",
    entityId: responseId || null,
    metadata: { source: "coach_dashboard" },
  });

  revalidatePath("/coach");
  revalidatePath("/coach/members");
}

export async function applyCoachBriefingRecommendationAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const responseId = readText(formData, "responseId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const result = await applyOnboardingPlanRecommendation({
    workspaceId,
    responseId,
    approvedBy: session.mode === "authenticated" ? session.user.id : null,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.onboarding.plan_applied",
    entityType: "member_onboarding_response",
    entityId: responseId || null,
    metadata: {
      source: "coach_dashboard",
      workoutTemplateId: result.templateId,
      dietTemplateId: result.dietTemplateId,
      workoutAssignmentCreated: result.assignmentCreated,
      mealAssignmentCreated: result.mealAssignmentCreated,
    } satisfies Json,
  });

  revalidatePath("/coach");
  revalidatePath("/coach/members");
  revalidatePath("/app");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
}
