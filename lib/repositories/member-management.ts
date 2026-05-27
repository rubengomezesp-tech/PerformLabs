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
  }));
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
  const now = new Date().toISOString().slice(0, 10);

  if (input.workoutTemplateId) {
    const workout = await supabase
      .from("workout_templates")
      .select("name")
      .eq("id", input.workoutTemplateId)
      .maybeSingle();

    const { error } = await supabase.from("assigned_workout_plans").insert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      source_template_id: input.workoutTemplateId,
      name: workout.data?.name ?? "Plan de entrenamiento",
      starts_on: now,
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
