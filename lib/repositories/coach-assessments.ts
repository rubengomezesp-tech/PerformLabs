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
  /** Presente al editar una fila concreta (reevaluaciones del histórico). */
  assessmentId?: string | null;
};

export type AssessmentHistoryEntry = {
  id: string;
  assessmentKind: "initial" | "reassessment";
  status: AssessmentStatus;
  interviewAt: string;
  completionPercent: number;
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
    .order("interview_at", { ascending: false })
    .limit(1)
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

export async function getCoachMemberAssessmentById(
  workspaceId: string,
  memberProfileId: string,
  assessmentId: string,
): Promise<CoachMemberAssessment | null> {
  if (!getSupabaseServiceEnv().ok) return null;
  await assertMemberInWorkspace(workspaceId, memberProfileId);
  const result = await createServiceSupabaseClient()
    .from("coach_member_assessments")
    .select("id,member_profile_id,assessment_kind,status,locale,interview_at,answers,risk_flags,completion_percent,coach_summary,training_priorities,nutrition_strategy,next_review_on,updated_at")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .eq("id", assessmentId)
    .maybeSingle();
  if (result.error) throw new Error(`No se pudo leer la valoración: ${result.error.message}`);
  if (!result.data) return null;
  const row = result.data;
  return {
    id: row.id,
    memberProfileId: row.member_profile_id,
    assessmentKind: row.assessment_kind as CoachMemberAssessment["assessmentKind"],
    status: row.status as AssessmentStatus,
    locale: (row.locale === "en" ? "en" : "es"),
    interviewAt: row.interview_at ?? "",
    answers: asAnswers(row.answers),
    riskFlags: Array.isArray(row.risk_flags) ? (row.risk_flags as string[]) : [],
    completionPercent: row.completion_percent ?? 0,
    coachSummary: row.coach_summary ?? "",
    trainingPriorities: row.training_priorities ?? "",
    nutritionStrategy: row.nutrition_strategy ?? "",
    nextReviewOn: row.next_review_on ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

/** Histórico completo (inicial + reevaluaciones), más reciente primero. */
export async function listCoachMemberAssessments(
  workspaceId: string,
  memberProfileId: string,
): Promise<AssessmentHistoryEntry[]> {
  if (!getSupabaseServiceEnv().ok) return [];
  await assertMemberInWorkspace(workspaceId, memberProfileId);
  const result = await createServiceSupabaseClient()
    .from("coach_member_assessments")
    .select("id,assessment_kind,status,interview_at,completion_percent")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .order("interview_at", { ascending: false });
  if (result.error) throw new Error(`No se pudo leer el histórico: ${result.error.message}`);
  return (result.data ?? []).map((row) => ({
    id: row.id,
    assessmentKind: row.assessment_kind as AssessmentHistoryEntry["assessmentKind"],
    status: row.status as AssessmentStatus,
    interviewAt: row.interview_at ?? "",
    completionPercent: row.completion_percent ?? 0,
  }));
}

export async function saveCoachMemberAssessment(input: SaveCoachAssessmentInput) {
  await assertMemberInWorkspace(input.workspaceId, input.memberProfileId);
  const supabase = createServiceSupabaseClient();
  const row = {
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
    };

  // Tres caminos: edición por id (histórico), inicial única (update-or-insert),
  // reevaluación nueva (insert — la unique parcial solo cubre la inicial).
  if (input.assessmentId) {
    const result = await supabase
      .from("coach_member_assessments")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("workspace_id", input.workspaceId)
      .eq("member_profile_id", input.memberProfileId)
      .eq("id", input.assessmentId)
      .select("id")
      .single();
    if (result.error) throw new Error(`No se pudo guardar la valoración: ${result.error.message}`);
    return result.data.id;
  }

  if (input.assessmentKind === "initial") {
    const existing = await supabase
      .from("coach_member_assessments")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("member_profile_id", input.memberProfileId)
      .eq("assessment_kind", "initial")
      .maybeSingle();
    if (existing.data?.id) {
      const result = await supabase
        .from("coach_member_assessments")
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq("id", existing.data.id)
        .select("id")
        .single();
      if (result.error) throw new Error(`No se pudo guardar la valoración: ${result.error.message}`);
      return result.data.id;
    }
  }

  const result = await supabase
    .from("coach_member_assessments")
    .insert(row)
    .select("id")
    .single();
  if (result.error) throw new Error(`No se pudo guardar la valoración: ${result.error.message}`);
  return result.data.id;
}
