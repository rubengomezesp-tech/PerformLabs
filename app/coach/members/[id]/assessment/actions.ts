"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import {
  calculateAssessmentCompletion,
  calculateAssessmentRiskFlags,
  readAssessmentAnswers,
  resolveAssessmentStatus,
} from "@/lib/domain/coach-assessment";
import { saveCoachMemberAssessment } from "@/lib/repositories/coach-assessments";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveCoachAssessmentAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const memberProfileId = readText(formData, "memberProfileId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const answers = readAssessmentAnswers(formData);
  const intent = readText(formData, "intent") === "complete" ? "complete" : "draft";
  const riskFlags = calculateAssessmentRiskFlags(answers);
  const completionPercent = calculateAssessmentCompletion(answers);
  const status = resolveAssessmentStatus(answers, intent);
  const locale = readText(formData, "locale") === "en" ? "en" : "es";
  const interviewValue = readText(formData, "interviewAt");
  const interviewDate = interviewValue ? new Date(interviewValue) : new Date();

  await saveCoachMemberAssessment({
    workspaceId,
    memberProfileId,
    assessmentKind: "initial",
    status,
    locale,
    interviewAt: Number.isNaN(interviewDate.getTime()) ? new Date().toISOString() : interviewDate.toISOString(),
    answers,
    riskFlags,
    completionPercent,
    coachSummary: readText(formData, "coachSummary"),
    trainingPriorities: readText(formData, "trainingPriorities"),
    nutritionStrategy: readText(formData, "nutritionStrategy"),
    nextReviewOn: readText(formData, "nextReviewOn"),
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.member.assessment_saved",
    entityType: "coach_member_assessment",
    entityId: memberProfileId,
    metadata: { status, completionPercent, riskFlagCount: riskFlags.length },
  });

  revalidatePath(`/coach/members/${memberProfileId}`);
  revalidatePath(`/coach/members/${memberProfileId}/assessment`);
  redirect(`/coach/members/${memberProfileId}/assessment?saved=${status}`);
}
