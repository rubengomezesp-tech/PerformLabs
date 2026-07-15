import type { CoachAssessmentAnswers, AssessmentStatus } from "@/lib/domain/coach-assessment";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CoachMemberAssessment = {
  id: string;
  memberProfileId: string;
  assessmentKind: "initial" | "reassessment";
  status: AssessmentStatus;
  locale: "es" | "en";
  interviewAt: string;
  answers: CoachAssessmentAnswers;
  riskFlags: string[];
  completionPercent: number;
  coachSummary: string;
  trainingPriorities: string;
  nutritionStrategy: string;
  nextReviewOn: string;
  updatedAt: string;
};

export type SaveCoachAssessmentInput = Omit<CoachMemberAssessment, "id" | "updatedAt"> & {
  workspaceId: string;
  actorUserId: string | null;
};

async function assertMemberInWorkspace(workspaceId: string, memberProfileId: string) {
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", memberProfileId)
    .maybeSingle();
  if (result.error || !result.data) throw new Error("Ese cliente no pertenece a tu marca.");
}

function asAnswers(value: Json): CoachAssessmentAnswers {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CoachAssessmentAnswers)
    : {};
}

export async function getCoachMemberAssessment(
  workspaceId: string,
  memberProfileId: string,
  assessmentKind: "initial" | "reassessment" = "initial",
): Promise<CoachMemberAssessment | null> {
  if (!getSupabaseServiceEnv().ok) return null;
  await assertMemberInWorkspace(workspaceId, memberProfileId);
  const result = await createServiceSupabaseClient()
    .from("coach_member_assessments")
    .select("id,member_profile_id,assessment_kind,status,locale,interview_at,answers,risk_flags,completion_percent,coach_summary,training_priorities,nutrition_strategy,next_review_on,updated_at")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .eq("assessment_kind", assessmentKind)
    .maybeSingle();
  if (result.error) throw new Error(`No se pudo leer la valoración: ${result.error.message}`);
  if (!result.data) return null;
  const row = result.data;
  return {
    id: row.id,
    memberProfileId: row.member_profile_id,
    assessmentKind: row.assessment_kind as CoachMemberAssessment["assessmentKind"],
    status: row.status as AssessmentStatus,
    locale: row.locale as CoachMemberAssessment["locale"],
    interviewAt: row.interview_at,
    answers: asAnswers(row.answers),
    riskFlags: row.risk_flags,
    completionPercent: row.completion_percent,
    coachSummary: row.coach_summary ?? "",
    trainingPriorities: row.training_priorities ?? "",
    nutritionStrategy: row.nutrition_strategy ?? "",
    nextReviewOn: row.next_review_on ?? "",
    updatedAt: row.updated_at,
  };
}

export async function saveCoachMemberAssessment(input: SaveCoachAssessmentInput) {
  await assertMemberInWorkspace(input.workspaceId, input.memberProfileId);
  const result = await createServiceSupabaseClient()
    .from("coach_member_assessments")
    .upsert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      assessment_kind: input.assessmentKind,
      status: input.status,
      locale: input.locale,
      interview_at: input.interviewAt,
      answers: input.answers as Json,
      risk_flags: input.riskFlags,
      completion_percent: input.completionPercent,
      coach_summary: input.coachSummary || null,
      training_priorities: input.trainingPriorities || null,
      nutrition_strategy: input.nutritionStrategy || null,
      next_review_on: input.nextReviewOn || null,
      created_by: input.actorUserId,
      updated_by: input.actorUserId,
    }, { onConflict: "member_profile_id,assessment_kind" })
    .select("id")
    .single();
  if (result.error) throw new Error(`No se pudo guardar la valoración: ${result.error.message}`);
  return result.data.id;
}
