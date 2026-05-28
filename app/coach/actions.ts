"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { markOnboardingBriefingReviewed } from "@/lib/repositories/coach-dashboard";
import { applyOnboardingPlanRecommendation, saveOnboardingBriefingReview } from "@/lib/repositories/member-onboarding";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import type { Json } from "@/lib/supabase/database.types";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function reviewInput(formData: FormData, actorUserId?: string | null) {
  return {
    workspaceId: readText(formData, "workspaceId"),
    responseId: readText(formData, "responseId"),
    goal: readText(formData, "goal"),
    daysPerWeek: readText(formData, "daysPerWeek"),
    workoutTemplateId: readText(formData, "workoutTemplateId"),
    dietTemplateId: readText(formData, "dietTemplateId"),
    mealsPerDay: readText(formData, "mealsPerDay"),
    hideMacros: readCheckbox(formData, "hideMacros"),
    coachNotes: readText(formData, "coachNotes"),
    injuries: readText(formData, "injuries"),
    allergies: readText(formData, "allergies"),
    restrictions: readText(formData, "restrictions"),
    reviewedBy: actorUserId ?? null,
  };
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
  const actorUserId = session.mode === "authenticated" ? session.user.id : null;
  const hasReviewFields = formData.has("goal") || formData.has("workoutTemplateId") || formData.has("dietTemplateId");

  const result = await applyOnboardingPlanRecommendation({
    ...(hasReviewFields ? reviewInput(formData, actorUserId) : {}),
    workspaceId,
    responseId,
    approvedBy: actorUserId,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId,
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

export async function saveCoachBriefingReviewAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const responseId = readText(formData, "responseId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const actorUserId = session.mode === "authenticated" ? session.user.id : null;

  await saveOnboardingBriefingReview(reviewInput(formData, actorUserId));

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId,
    action: "coach.onboarding.review_saved",
    entityType: "member_onboarding_response",
    entityId: responseId || null,
    metadata: {
      source: "coach_briefing_detail",
      workoutTemplateId: readText(formData, "workoutTemplateId"),
      dietTemplateId: readText(formData, "dietTemplateId"),
    } satisfies Json,
  });

  revalidatePath("/coach");
  revalidatePath("/coach/members");
  revalidatePath(`/coach/briefings/${responseId}`);
}
