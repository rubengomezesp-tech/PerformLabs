import { calculateNutritionTargets } from "@/lib/domain/nutrition-engine";
import { members } from "@/lib/data";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type ManagedMember = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  goal: string;
  heightCm: number | null;
  startingWeightKg: number | null;
  subscriptionStatus: string;
  onboardingStatus: string;
  timezone: string;
  createdAt: string;
  activeWorkoutPlan: {
    id: string;
    name: string;
    daysPerWeek: number | null;
    currentMonth: number;
    currentWeek: number;
    nextReviewOn: string;
    reviewStatus: string;
    assignmentGoal: string;
  } | null;
};

export type MemberInput = {
  workspaceId: string;
  fullName: string;
  email: string;
  phone: string;
  goal: string;
  heightCm: string;
  startingWeightKg: string;
  sex: string;
  timezone: string;
};

export type MemberAssignmentInput = {
  workspaceId: string;
  memberProfileId: string;
  workoutTemplateId: string;
  dietTemplateId: string;
  assignmentGoal?: string;
  assignmentNotes?: string;
  currentMonth?: string;
  currentWeek?: string;
  nextReviewOn?: string;
  assignedBy?: string | null;
};

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function fallbackMembers(): ManagedMember[] {
  return members.map((member) => ({
    id: member.email,
    userId: member.email,
    fullName: member.name,
    email: member.email,
    phone: "",
    goal: member.progress,
    heightCm: null,
    startingWeightKg: null,
    subscriptionStatus: member.status.toLowerCase(),
    onboardingStatus: "demo",
    timezone: "Europe/Madrid",
    createdAt: new Date().toISOString(),
    activeWorkoutPlan: null,
  }));
}

function parseInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export async function listManagedMembers(workspaceId?: string): Promise<ManagedMember[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return fallbackMembers();

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("member_profiles")
    .select("id,user_id,full_name,phone,goal,height_cm,starting_weight_kg,subscription_status,onboarding_status,timezone,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load members", error.message);
    return fallbackMembers();
  }

  if (!data?.length) return [];

  const memberIds = data.map((member) => member.id);
  const assignments = await supabase
    .from("assigned_workout_plans")
    .select("id,member_profile_id,name,days_per_week,current_month,current_week,next_review_on,review_status,assignment_goal,created_at")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .in("member_profile_id", memberIds)
    .order("created_at", { ascending: false });

  if (assignments.error) {
    console.error("Unable to load active workout assignments", assignments.error.message);
  }

  const assignmentByMember = new Map<string, NonNullable<ManagedMember["activeWorkoutPlan"]>>();
  for (const assignment of assignments.data ?? []) {
    if (assignmentByMember.has(assignment.member_profile_id)) continue;
    assignmentByMember.set(assignment.member_profile_id, {
      id: assignment.id,
      name: assignment.name,
      daysPerWeek: assignment.days_per_week,
      currentMonth: assignment.current_month,
      currentWeek: assignment.current_week,
      nextReviewOn: assignment.next_review_on ?? "",
      reviewStatus: assignment.review_status,
      assignmentGoal: assignment.assignment_goal ?? "",
    });
  }

  const userIds = data.map((member) => member.user_id);
  const userEmailById = new Map<string, string>();

  for (const userId of userIds) {
    const userResult = await supabase.auth.admin.getUserById(userId);
    if (userResult.data.user?.email) {
      userEmailById.set(userId, userResult.data.user.email);
    }
  }

  return data.map((member) => ({
    id: member.id,
    userId: member.user_id,
    fullName: member.full_name,
    email: userEmailById.get(member.user_id) ?? "email pendiente",
    phone: member.phone ?? "",
    goal: member.goal ?? "",
    heightCm: member.height_cm,
    startingWeightKg: member.starting_weight_kg,
    subscriptionStatus: member.subscription_status,
    onboardingStatus: member.onboarding_status,
    timezone: member.timezone,
    createdAt: member.created_at,
    activeWorkoutPlan: assignmentByMember.get(member.id) ?? null,
  }));
}

export async function createManagedMember(input: MemberInput) {
  if (!input.workspaceId) throw new Error("Selecciona una marca antes de crear clientes.");
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName || !email.includes("@")) throw new Error("Nombre y email valido son obligatorios.");

  const supabase = createServiceSupabaseClient();
  const userResult = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (userResult.error || !userResult.data.user) {
    throw new Error(`No se pudo crear el usuario: ${userResult.error?.message ?? "sin usuario"}`);
  }

  const { error } = await supabase.from("member_profiles").insert({
    workspace_id: input.workspaceId,
    user_id: userResult.data.user.id,
    full_name: fullName,
    phone: input.phone.trim() || null,
    goal: input.goal.trim() || null,
    height_cm: parseNumber(input.heightCm),
    starting_weight_kg: parseNumber(input.startingWeightKg),
    sex: input.sex || null,
    timezone: input.timezone.trim() || "Europe/Madrid",
    subscription_status: "trialing",
    onboarding_status: "invited",
  });

  if (error) {
    await supabase.auth.admin.deleteUser(userResult.data.user.id);
    throw new Error(`No se pudo crear el perfil: ${error.message}`);
  }
}

export async function assignPlansToMember(input: MemberAssignmentInput) {
  if (!input.workspaceId || !input.memberProfileId) throw new Error("Falta marca o cliente.");
  const supabase = createServiceSupabaseClient();
  const nowDate = new Date();
  const now = nowDate.toISOString().slice(0, 10);

  if (input.workoutTemplateId) {
    const workout = await supabase
      .from("workout_templates")
      .select("name,days_per_week")
      .eq("id", input.workoutTemplateId)
      .maybeSingle();

    const archive = await supabase
      .from("assigned_workout_plans")
      .update({ status: "archived", review_status: "completed", updated_at: new Date().toISOString() })
      .eq("workspace_id", input.workspaceId)
      .eq("member_profile_id", input.memberProfileId)
      .eq("status", "active");

    if (archive.error) throw new Error(`No se pudo cerrar el entrenamiento anterior: ${archive.error.message}`);

    const { error } = await supabase.from("assigned_workout_plans").insert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      source_template_id: input.workoutTemplateId,
      name: workout.data?.name ?? "Plan de entrenamiento",
      days_per_week: workout.data?.days_per_week ?? null,
      current_month: parseInteger(input.currentMonth, 1, 1, 3),
      current_week: parseInteger(input.currentWeek, 1, 1, 12),
      assignment_goal: input.assignmentGoal?.trim() || null,
      assignment_notes: input.assignmentNotes?.trim() || null,
      starts_on: now,
      ends_on: addDays(nowDate, 84),
      next_review_on: input.nextReviewOn || addDays(nowDate, 7),
      review_status: "pending",
      assigned_by: input.assignedBy ?? null,
      status: "active",
    });

    if (error) throw new Error(`No se pudo asignar entrenamiento: ${error.message}`);
  }

  if (input.dietTemplateId) {
    const member = await supabase
      .from("member_profiles")
      .select("sex,height_cm,starting_weight_kg")
      .eq("id", input.memberProfileId)
      .maybeSingle();
    const diet = await supabase
      .from("diet_templates")
      .select("name")
      .eq("id", input.dietTemplateId)
      .maybeSingle();
    const target = member.data?.height_cm && member.data.starting_weight_kg
      ? calculateNutritionTargets({
          gender: member.data.sex === "female" ? "female" : "male",
          age: 35,
          heightCm: Number(member.data.height_cm),
          weightKg: Number(member.data.starting_weight_kg),
          activityLevel: "moderate",
          goal: "fat_loss",
        })
      : null;

    const { error } = await supabase.from("assigned_meal_plans").insert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      source_template_id: input.dietTemplateId,
      name: diet.data?.name ?? "Plan nutricional",
      starts_on: now,
      formula_snapshot: target?.formulaSnapshot ?? {},
      target_calories: target?.targetCalories ?? null,
      target_protein_g: target?.proteinG ?? null,
      target_carbs_g: target?.carbsG ?? null,
      target_fat_g: target?.fatG ?? null,
      status: "active",
    });

    if (error) throw new Error(`No se pudo asignar nutricion: ${error.message}`);
  }
}
