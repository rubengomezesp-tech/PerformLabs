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
import { getCoachMemberAssessment, getCoachMemberAssessmentById, saveCoachMemberAssessment } from "@/lib/repositories/coach-assessments";
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

  const assessmentId = readText(formData, "assessmentId");
  const assessmentKind = readText(formData, "assessmentKind") === "reassessment" ? "reassessment" as const : "initial" as const;

  const savedId = await saveCoachMemberAssessment({
    workspaceId,
    memberProfileId,
    assessmentId: assessmentId || null,
    assessmentKind,
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
  redirect(`/coach/members/${memberProfileId}/assessment?saved=${status}${assessmentKind === "reassessment" ? `&aid=${savedId}` : ""}`);
}

/**
 * Nueva reevaluación (D-11): parte de la última valoración (inicial o
 * reevaluación previa) precargada, como borrador con fecha de hoy.
 */
export async function startReassessmentAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const memberProfileId = readText(formData, "memberProfileId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const fromId = readText(formData, "fromAssessmentId");
  const base = fromId
    ? await getCoachMemberAssessmentById(workspaceId, memberProfileId, fromId)
    : (await getCoachMemberAssessment(workspaceId, memberProfileId, "reassessment"))
      ?? await getCoachMemberAssessment(workspaceId, memberProfileId, "initial");

  const newId = await saveCoachMemberAssessment({
    workspaceId,
    memberProfileId,
    assessmentKind: "reassessment",
    status: "draft",
    locale: base?.locale ?? "es",
    interviewAt: new Date().toISOString(),
    answers: base?.answers ?? {},
    riskFlags: base?.riskFlags ?? [],
    completionPercent: base?.completionPercent ?? 0,
    coachSummary: "",
    trainingPriorities: base?.trainingPriorities ?? "",
    nutritionStrategy: base?.nutritionStrategy ?? "",
    nextReviewOn: "",
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.member.reassessment_started",
    entityType: "coach_member_assessment",
    entityId: newId,
    metadata: { memberProfileId, fromAssessmentId: fromId || null },
  });

  revalidatePath(`/coach/members/${memberProfileId}/assessment`);
  redirect(`/coach/members/${memberProfileId}/assessment?aid=${newId}`);
}
