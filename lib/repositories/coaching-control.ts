import {
  ageFromBirthDate,
  buildCoachingSignals,
  normalizeActivityLevel,
  normalizeCoachingGoal,
  type CoachingSignals,
} from "@/lib/domain/coaching-control";
import type { ActivityLevel, NutritionGoal } from "@/lib/domain/nutrition-engine";
import { getCoachMemberAssessment } from "@/lib/repositories/coach-assessments";
import { listManagedCheckins } from "@/lib/repositories/checkin-management";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type AdjustmentStatus = "draft" | "published";

export type CoachAdjustmentHistoryItem = {
  id: string;
  version: number;
  status: AdjustmentStatus;
  goal: NutritionGoal;
  effectiveOn: string;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
  dailyStepsTarget: number | null;
  trainingDaysPerWeek: number | null;
  currentTrainingWeek: number | null;
  nextReviewOn: string;
  rationale: string;
  memberMessage: string;
  calculationSnapshot: Record<string, Json | undefined>;
  createdAt: string;
};

export type CoachMemberControlSnapshot = {
  member: {
    id: string;
    fullName: string;
    goal: string;
    sex: "male" | "female";
    age: number;
    birthDate: string | null;
    heightCm: number | null;
    startingWeightKg: number | null;
    activityLevel: ActivityLevel;
    onboardingStatus: string;
  };
  signals: CoachingSignals;
  checkinCount: number;
  assessment: {
    status: string;
    completionPercent: number;
    riskFlags: string[];
    nextReviewOn: string;
  } | null;
  mealPlan: {
    id: string;
    name: string;
    targetCalories: number | null;
    targetProteinG: number | null;
    targetCarbsG: number | null;
    targetFatG: number | null;
    waterTargetMl: number | null;
    fiberTargetG: number | null;
    mealsPerDay: number | null;
    nextReviewOn: string;
    version: number;
    sourceTemplateId: string;
  } | null;
  workoutPlan: {
    id: string;
    name: string;
    daysPerWeek: number | null;
    currentWeek: number;
    nextReviewOn: string;
    version: number;
    sourceTemplateId: string;
  } | null;
  preferences: {
    daysPerWeek: number | null;
    dailyStepsTarget: number | null;
  };
  onboarding: {
    goal: string;
    activityLevel: number | null;
    mealsPerDay: number | null;
    trainingDaysPerWeek: number | null;
    submittedAt: string;
  } | null;
  history: CoachAdjustmentHistoryItem[];
};

export type SaveCoachAdjustmentInput = {
  workspaceId: string;
  memberProfileId: string;
  status: AdjustmentStatus;
  goal: NutritionGoal;
  effectiveOn: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  waterTargetMl: number;
  fiberTargetG: number;
  dailyStepsTarget: number;
  trainingDaysPerWeek: number;
  currentTrainingWeek: number;
  nextReviewOn: string;
  rationale: string;
  memberMessage: string;
  calculationSnapshot: Record<string, Json | undefined>;
  actorUserId: string | null;
};

export type SaveCoachAdjustmentResult = {
  adjustmentId: string;
  version: number;
  mealPlanUpdated: boolean;
  workoutPlanUpdated: boolean;
};

async function assertMemberInWorkspace(workspaceId: string, memberProfileId: string) {
  const result = await createServiceSupabaseClient()
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", memberProfileId)
    .maybeSingle();
  if (result.error || !result.data) throw new Error("Ese cliente no pertenece a tu marca.");
}

export async function getCoachMemberControlSnapshot(
  workspaceId: string,
  memberProfileId: string,
): Promise<CoachMemberControlSnapshot | null> {
  if (!getSupabaseServiceEnv().ok || !isUuid(workspaceId) || !isUuid(memberProfileId)) return null;
  await assertMemberInWorkspace(workspaceId, memberProfileId);
  const supabase = createServiceSupabaseClient();

  const [profileResult, mealResult, workoutResult, preferencesResult, onboardingResult, historyResult, checkins, assessment] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("id,full_name,goal,sex,birth_date,height_cm,starting_weight_kg,activity_level,onboarding_status")
      .eq("workspace_id", workspaceId)
      .eq("id", memberProfileId)
      .single(),
    supabase
      .from("assigned_meal_plans")
      .select("id,name,target_calories,target_protein_g,target_carbs_g,target_fat_g,water_target_ml,fiber_target_g,meals_per_day,next_review_on,version,source_template_id")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("assigned_workout_plans")
      .select("id,name,days_per_week,current_week,next_review_on,version,source_template_id")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("member_fitness_preferences")
      .select("days_per_week,daily_steps_target")
      .eq("member_profile_id", memberProfileId)
      .maybeSingle(),
    supabase
      .from("member_onboarding_responses")
      .select("goal,activity_level,meals_per_day,training_days_per_week,submitted_at")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .maybeSingle(),
    supabase
      .from("coach_member_adjustments")
      .select("id,version,status,goal,effective_on,target_calories,target_protein_g,target_carbs_g,target_fat_g,daily_steps_target,training_days_per_week,current_training_week,next_review_on,rationale,member_message,calculation_snapshot,created_at")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", memberProfileId)
      .order("version", { ascending: false })
      .limit(12),
    listManagedCheckins(workspaceId, memberProfileId),
    getCoachMemberAssessment(workspaceId, memberProfileId),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error(`No se pudo leer el cliente: ${profileResult.error?.message ?? "sin datos"}`);
  }
  for (const result of [mealResult, workoutResult, preferencesResult, onboardingResult, historyResult]) {
    if (result.error) throw new Error(`No se pudo construir la lectura actual: ${result.error.message}`);
  }

  const profile = profileResult.data;
  const signals = buildCoachingSignals(checkins.map((checkin) => ({
    submittedAt: checkin.submittedAt,
    weightKg: checkin.values.weightKg,
    waistCm: checkin.values.waistCm,
    trainingAdherence: checkin.values.trainingAdherence,
    nutritionAdherence: checkin.values.nutritionAdherence,
  })), profile.starting_weight_kg);
  const onboarding = onboardingResult.data;
  const activityRaw = onboarding?.activity_level ?? profile.activity_level;

  return {
    member: {
      id: profile.id,
      fullName: profile.full_name,
      goal: profile.goal ?? onboarding?.goal ?? "",
      sex: profile.sex === "female" ? "female" : "male",
      age: ageFromBirthDate(profile.birth_date),
      birthDate: profile.birth_date,
      heightCm: profile.height_cm,
      startingWeightKg: profile.starting_weight_kg,
      activityLevel: normalizeActivityLevel(activityRaw),
      onboardingStatus: profile.onboarding_status,
    },
    signals,
    checkinCount: checkins.length,
    assessment: assessment ? {
      status: assessment.status,
      completionPercent: assessment.completionPercent,
      riskFlags: assessment.riskFlags,
      nextReviewOn: assessment.nextReviewOn,
    } : null,
    mealPlan: mealResult.data ? {
      id: mealResult.data.id,
      name: mealResult.data.name,
      targetCalories: mealResult.data.target_calories,
      targetProteinG: mealResult.data.target_protein_g,
      targetCarbsG: mealResult.data.target_carbs_g,
      targetFatG: mealResult.data.target_fat_g,
      waterTargetMl: mealResult.data.water_target_ml,
      fiberTargetG: mealResult.data.fiber_target_g,
      mealsPerDay: mealResult.data.meals_per_day,
      nextReviewOn: mealResult.data.next_review_on ?? "",
      version: mealResult.data.version,
      sourceTemplateId: mealResult.data.source_template_id ?? "",
    } : null,
    workoutPlan: workoutResult.data ? {
      id: workoutResult.data.id,
      name: workoutResult.data.name,
      daysPerWeek: workoutResult.data.days_per_week,
      currentWeek: workoutResult.data.current_week,
      nextReviewOn: workoutResult.data.next_review_on ?? "",
      version: workoutResult.data.version,
      sourceTemplateId: workoutResult.data.source_template_id ?? "",
    } : null,
    preferences: {
      daysPerWeek: preferencesResult.data?.days_per_week ?? null,
      dailyStepsTarget: preferencesResult.data?.daily_steps_target ?? null,
    },
    onboarding: onboarding ? {
      goal: onboarding.goal ?? "",
      activityLevel: onboarding.activity_level,
      mealsPerDay: onboarding.meals_per_day,
      trainingDaysPerWeek: onboarding.training_days_per_week,
      submittedAt: onboarding.submitted_at,
    } : null,
    history: (historyResult.data ?? []).map((item) => ({
      id: item.id,
      version: item.version,
      status: item.status as AdjustmentStatus,
      goal: normalizeCoachingGoal(item.goal),
      effectiveOn: item.effective_on,
      targetCalories: item.target_calories,
      targetProteinG: item.target_protein_g,
      targetCarbsG: item.target_carbs_g,
      targetFatG: item.target_fat_g,
      dailyStepsTarget: item.daily_steps_target,
      trainingDaysPerWeek: item.training_days_per_week,
      currentTrainingWeek: item.current_training_week,
      nextReviewOn: item.next_review_on ?? "",
      rationale: item.rationale ?? "",
      memberMessage: item.member_message ?? "",
      calculationSnapshot: item.calculation_snapshot && typeof item.calculation_snapshot === "object" && !Array.isArray(item.calculation_snapshot)
        ? item.calculation_snapshot as Record<string, Json | undefined>
        : {},
      createdAt: item.created_at,
    })),
  };
}

export async function saveCoachMemberAdjustment(input: SaveCoachAdjustmentInput): Promise<SaveCoachAdjustmentResult> {
  await assertMemberInWorkspace(input.workspaceId, input.memberProfileId);
  const snapshot = await getCoachMemberControlSnapshot(input.workspaceId, input.memberProfileId);
  if (!snapshot) throw new Error("No se pudo construir la lectura actual del cliente.");

  const sourceSnapshot: Json = {
    capturedAt: new Date().toISOString(),
    member: {
      goal: snapshot.member.goal,
      age: snapshot.member.age,
      sex: snapshot.member.sex,
      heightCm: snapshot.member.heightCm,
      startingWeightKg: snapshot.member.startingWeightKg,
      activityLevel: snapshot.member.activityLevel,
      onboardingStatus: snapshot.member.onboardingStatus,
    },
    signals: snapshot.signals,
    checkinCount: snapshot.checkinCount,
    assessment: snapshot.assessment,
    activePlanIds: {
      meal: snapshot.mealPlan?.id ?? null,
      workout: snapshot.workoutPlan?.id ?? null,
    },
  };

  const { data, error } = await createServiceSupabaseClient().rpc("save_coach_member_adjustment", {
    p_workspace_id: input.workspaceId,
    p_member_profile_id: input.memberProfileId,
    p_status: input.status,
    p_goal: input.goal,
    p_effective_on: input.effectiveOn,
    p_target_calories: input.targetCalories,
    p_target_protein_g: input.targetProteinG,
    p_target_carbs_g: input.targetCarbsG,
    p_target_fat_g: input.targetFatG,
    p_water_target_ml: input.waterTargetMl,
    p_fiber_target_g: input.fiberTargetG,
    p_daily_steps_target: input.dailyStepsTarget,
    p_training_days_per_week: input.trainingDaysPerWeek,
    p_current_training_week: input.currentTrainingWeek,
    p_next_review_on: input.nextReviewOn,
    p_source_snapshot: sourceSnapshot,
    p_calculation_snapshot: input.calculationSnapshot as Json,
    p_rationale: input.rationale,
    p_member_message: input.memberMessage,
    p_created_by: input.actorUserId as string,
  });
  if (error || !data?.[0]) throw new Error(`No se pudo guardar el ajuste: ${error?.message ?? "sin respuesta"}`);
  const saved = data[0];
  return {
    adjustmentId: saved.adjustment_id,
    version: saved.adjustment_version,
    mealPlanUpdated: saved.meal_plan_updated,
    workoutPlanUpdated: saved.workout_plan_updated,
  };
}
