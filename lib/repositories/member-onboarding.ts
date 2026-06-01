import { getMemberContext } from "@/lib/auth/member-access";
import { cloudinaryFetch, exerciseCardImage } from "@/lib/cloudinary";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { assignDietTemplateToMember, assignWorkoutTemplateToMember } from "@/lib/repositories/member-management";
import { listManagedDietTemplates, type ManagedDietTemplate } from "@/lib/repositories/nutrition-management";
import { seedSuggestedHabitsForMember } from "@/lib/repositories/habit-tracking";
import { listManagedWorkoutTemplates, type ManagedWorkoutTemplate } from "@/lib/repositories/training-management";
import {
  selectProgram,
  normalizeGoal,
  normalizeLevel,
  normalizeSex as toProgramSex,
  normalizePlace,
  bucketMinutes,
  type MatchTemplate,
  type QuizAnswers,
} from "@/lib/domain/program-matcher";
import {
  selectDietTemplate,
  normalizeGoal as normalizeDietGoal,
  normalizeDietStyle,
  isHalalLabel,
  isKetoLabel,
  bucketMeals,
  type DietQuizAnswers,
  type DietMatchTemplate,
} from "@/lib/domain/diet-matcher";

export type MemberExerciseProgression = {
  /** Best set (by reps × weight) logged for this exercise in the prior 14 days. */
  lastWeightKg: number | null;
  lastReps: number | null;
  /** ISO date (YYYY-MM-DD) of that last logged set. */
  lastLoggedOn: string | null;
};

export type MemberAssignedWorkoutExercise = {
  id: string;
  sourceTemplateExerciseId: string | null;
  exerciseId: string;
  exerciseName: string;
  videoUrl: string;
  thumbnailUrl: string;
  imageUrl: string;
  /** Ordered demo frames (start→end) for the animated preview when no real video. */
  frames: string[];
  muscleGroups: string[];
  equipment: string[];
  difficulty: string;
  instructions: string;
  sets: number | null;
  reps: string;
  tempo: string;
  restSeconds: number | null;
  targetRir: string;
  notes: string;
  sortOrder: number;
  progression: MemberExerciseProgression | null;
};

export type MemberAssignedWorkoutDay = {
  id: string;
  sourceTemplateDayId: string | null;
  assignedPlanId: string;
  title: string;
  weekNumber: number;
  monthNumber: number;
  dayNumber: number;
  scheduledOn: string;
  status: string;
  focus: string;
  notes: string;
  estimatedMinutes: number | null;
  exercises: MemberAssignedWorkoutExercise[];
};

export type MemberOnboardingInput = {
  workspaceId: string;
  fullName: string;
  goal: string;
  heightCm: string;
  weightKg: string;
  birthDate: string;
  sex: string;
  timezone: string;
  injuries: string;
  healthConditions: string;
  experienceLevel: string;
  availableEquipment: string;
  preferredTrainingDays: string;
  cardioPreference: string;
  activityLevel: string;
  sleepHours: string;
  stepsTarget: string;
  trainingLocation: string;
  daysPerWeek: string;
  sessionMinutes: string;
  mealsPerDay: string;
  dietStyle: string;
  allergies: string;
  preferredFoods: string;
  dislikedFoods: string;
  cookingTimeMinutes: string;
  budgetLevel: string;
  hideMacros: boolean;
  notes: string;
  email?: string;
  /** Only true for an authenticated workspace admin/owner — gates self-provision. */
  allowProvision?: boolean;
};

export type MemberTrainingContext = {
  memberProfileId: string | null;
  preferredDaysPerWeek: number | null;
  activeAssignment: {
    id: string;
    name: string;
    sourceTemplateId: string | null;
    startsOn: string;
    endsOn: string;
    version: number;
    currentWeek: number;
    currentMonth: number;
    daysPerWeek: number | null;
    goal: string;
    notes: string;
    nextReviewOn: string;
  } | null;
  activeTemplate: ManagedWorkoutTemplate | null;
  assignedDays: MemberAssignedWorkoutDay[];
  activeAssignedDay: MemberAssignedWorkoutDay | null;
};

export type MemberCardioContext = {
  hasProfile: boolean;
  /** Member's declared cardio preference (free text, e.g. "HIIT", "caminar"). */
  preference: string;
  /** Normalized preferred modality, used to highlight the matching protocol. */
  preferredModality: "hiit" | "liss" | null;
  dailyStepsTarget: number | null;
  goal: string;
  /** Cardio sessions per week suggested from the training goal. */
  weeklySessions: number;
};

export type CoachBriefingReviewInput = {
  workspaceId: string;
  responseId: string;
  goal: string;
  daysPerWeek: string;
  workoutTemplateId: string;
  dietTemplateId: string;
  mealsPerDay: string;
  hideMacros: boolean;
  coachNotes: string;
  injuries: string;
  allergies: string;
  restrictions: string;
  reviewedBy?: string | null;
};

export type ApplyCoachBriefingInput = {
  workspaceId: string;
  responseId: string;
  goal?: string;
  daysPerWeek?: string;
  workoutTemplateId?: string;
  dietTemplateId?: string;
  mealsPerDay?: string;
  hideMacros?: boolean;
  coachNotes?: string;
  injuries?: string;
  allergies?: string;
  restrictions?: string;
  approvedBy?: string | null;
};

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function normalizeLocation(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "home" || normalized === "casa") return "home";
  if (normalized === "outdoor" || normalized === "exterior") return "outdoor";
  return "gym";
}

function normalizeSex(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "female" || normalized === "mujer") return "female";
  if (normalized === "male" || normalized === "hombre") return "male";
  return null;
}

function normalizeActivityLevel(value: string) {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed)) return Math.min(1.9, Math.max(1.2, parsed));

  const normalized = value.toLowerCase();
  if (normalized.includes("sed")) return 1.2;
  if (normalized.includes("lig")) return 1.375;
  if (normalized.includes("alta") || normalized.includes("active")) return 1.725;
  if (normalized.includes("atleta") || normalized.includes("athlete")) return 1.9;
  return 1.55;
}

function goalMatches(goal: string, template: ManagedDietTemplate) {
  const source = `${template.name} ${template.goal} ${template.tags.join(" ")}`.toLowerCase();
  const normalized = goal.toLowerCase();
  if (normalized.includes("volumen") || normalized.includes("masa")) {
    return source.includes("volumen") || source.includes("gain") || source.includes("masa");
  }
  if (normalized.includes("recom")) {
    return source.includes("recom") || source.includes("manten");
  }
  if (normalized.includes("salud") || normalized.includes("rendimiento")) {
    return source.includes("manten") || source.includes("performance") || source.includes("salud");
  }
  return source.includes("defin") || source.includes("perdida") || source.includes("loss") || source.includes("grasa");
}

function findRecommendedDietTemplate(templates: ManagedDietTemplate[], goal: string) {
  return templates.find((item) => goalMatches(goal, item)) ?? templates[0] ?? null;
}

async function buildOnboardingRecommendation(input: {
  workspaceId: string;
  goal: string;
  daysPerWeek: number;
  sessionMinutes: number;
  mealsPerDay: number;
  trainingLocation: string;
  injuries: string[];
  healthConditions: string[];
  allergies: string[];
  hideMacros: boolean;
}) {
  const [workoutTemplates, dietTemplates] = await Promise.all([
    listManagedWorkoutTemplates(input.workspaceId),
    listManagedDietTemplates(input.workspaceId),
  ]);
  const workoutTemplate = findQuarterlyTemplate(workoutTemplates, input.daysPerWeek);
  const dietTemplate = findRecommendedDietTemplate(dietTemplates, input.goal);
  const blockers = [
    !workoutTemplate ? `Falta modulo de ${input.daysPerWeek} dias/semana` : null,
    !dietTemplate ? "Falta plantilla nutricional compatible" : null,
    input.healthConditions.length ? `Revisar condiciones de salud: ${input.healthConditions.join(", ")}` : null,
    input.injuries.length ? "Revisar molestias antes de publicar entreno" : null,
    input.allergies.length ? "Revisar alergias antes de publicar comida" : null,
  ].filter(Boolean);

  return {
    status: "coach_approval_required",
    generatedAt: new Date().toISOString(),
    training: {
      daysPerWeek: input.daysPerWeek,
      sessionMinutes: input.sessionMinutes,
      location: normalizeLocation(input.trainingLocation),
      templateId: workoutTemplate?.id ?? null,
      templateName: workoutTemplate?.name ?? "",
      reasons: [
        `${input.daysPerWeek} dias disponibles`,
        `${input.sessionMinutes} min por sesion`,
        input.injuries.length ? "Tiene molestias declaradas" : "Sin molestias declaradas",
      ],
    },
    nutrition: {
      mealsPerDay: input.mealsPerDay,
      templateId: dietTemplate?.id ?? null,
      templateName: dietTemplate?.name ?? "",
      hideMacros: input.hideMacros,
      reasons: [
        input.goal ? `Objetivo: ${input.goal}` : "Objetivo pendiente",
        `${input.mealsPerDay} comidas al dia`,
        input.allergies.length ? "Tiene restricciones declaradas" : "Sin restricciones declaradas",
      ],
    },
    blockers,
  };
}

/**
 * Diet sibling of matchQuarterlyTemplate: builds DietQuizAnswers from the saved diet
 * preferences + the same canonical goal as the chosen program, scores the tagged diet
 * templates (brand + base-library matrix), and returns the matched id. Style/allergies
 * are hard exclusions. Returns null → caller falls back to the legacy lookup.
 */
async function matchDietTemplate(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  memberProfileId: string,
  goal: string,
): Promise<string | null> {
  try {
    const sb = supabase as unknown as { from: (table: string) => any };
    const [prefs, tpls] = await Promise.all([
      sb.from("member_diet_preferences").select("diet_style,allergies,meals_per_day").eq("member_profile_id", memberProfileId).maybeSingle(),
      sb.from("diet_templates").select("id,status,goal_tag,diet_style,meals_per_day,tags").or(`workspace_id.eq.${workspaceId},is_base_library.eq.true`),
    ]);
    const p = prefs?.data ?? null;
    const rows = (tpls?.data ?? []) as any[];
    if (!rows.length) return null;
    // diet_style is the quiz's comma-joined multi-select (e.g. "Pescetariana, Sin gluten,
    // Keto"). The protein-source style comes from the most-restrictive token; halal/keto
    // are orthogonal flags read from the same string. See docs/diet-types.md.
    const dietStyleRaw = String(p?.diet_style ?? "");
    const quiz: DietQuizAnswers = {
      goal: normalizeDietGoal(goal),
      dietStyle: normalizeDietStyle(dietStyleRaw),
      mealsPerDay: bucketMeals(p?.meals_per_day),
      allergies: Array.isArray(p?.allergies) ? p.allergies : [],
      halal: isHalalLabel(dietStyleRaw),
      keto: isKetoLabel(dietStyleRaw),
    };
    const matchTemplates: DietMatchTemplate[] = rows.map((t) => ({
      id: t.id,
      status: t.status,
      goalTag: t.goal_tag ?? null,
      dietStyle: t.diet_style ?? null,
      mealsPerDay: t.meals_per_day ?? null,
      tags: Array.isArray(t.tags) ? t.tags : [],
    }));
    return selectDietTemplate(quiz, matchTemplates).templateId ?? null;
  } catch (error) {
    console.error("Diet match failed, falling back to legacy lookup", error);
    return null;
  }
}

async function assignRecommendedDietPlan(input: {
  workspaceId: string;
  memberProfileId: string;
  goal: string;
  mealsPerDay: number;
  hideMacros: boolean;
  dietTemplateId?: string;
  assignedBy?: string | null;
}) {
  const supabase = createServiceSupabaseClient();
  let templateId: string | null = null;
  if (input.dietTemplateId) {
    templateId = input.dietTemplateId;
  } else {
    templateId = await matchDietTemplate(supabase, input.workspaceId, input.memberProfileId, input.goal);
    if (!templateId) {
      const templates = await listManagedDietTemplates(input.workspaceId);
      templateId = findRecommendedDietTemplate(templates, input.goal)?.id ?? null;
    }
  }

  if (!templateId) {
    return { dietTemplateId: null, mealAssignmentCreated: false };
  }

  const assignment = await assignDietTemplateToMember({
    workspaceId: input.workspaceId,
    memberProfileId: input.memberProfileId,
    dietTemplateId: templateId,
    mealsPerDay: String(input.mealsPerDay),
    hideMacros: input.hideMacros,
    assignedBy: input.assignedBy,
  });

  return {
    dietTemplateId: templateId,
    mealAssignmentCreated: Boolean(assignment?.assignedMealPlanId),
  };
}

function daysBetween(fromIso?: string | null, toIso = new Date().toISOString().slice(0, 10)) {
  if (!fromIso) return 0;
  const from = new Date(`${fromIso}T00:00:00.000Z`).getTime();
  const to = new Date(`${toIso}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

async function getDefaultMemberProfile(workspaceId: string) {
  // Resolve from the verified member session (production) or the demo member
  // (open mode) — never "the first profile in the workspace". The workspace
  // guard closes cross-tenant access when a client-supplied workspaceId differs
  // from the authenticated member's own workspace.
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return { id: context.memberProfileId, full_name: context.fullName };
}

/**
 * Bootstraps a default client profile (auth user + member_profiles row) when a
 * workspace has none yet, so the admin/founder can complete onboarding without
 * creating a member by hand. Only used as a fallback when no member exists.
 */
async function ensureDefaultMemberProfile(workspaceId: string, fullName: string, email?: string) {
  const supabase = createServiceSupabaseClient();
  const name = fullName.trim() || "Cliente";
  const cleanEmail = email && email.includes("@")
    ? email.trim().toLowerCase()
    : `cliente+${workspaceId.slice(0, 8)}-${Date.now().toString(36)}@performlabs.app`;

  const userResult = await supabase.auth.admin.createUser({
    email: cleanEmail,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (userResult.error || !userResult.data.user) {
    throw new Error(`No se pudo crear el cliente: ${userResult.error?.message ?? "sin usuario"}`);
  }

  const insert = await supabase
    .from("member_profiles")
    .insert({
      workspace_id: workspaceId,
      user_id: userResult.data.user.id,
      full_name: name,
      onboarding_status: "plan_brief_submitted",
      timezone: "Europe/Madrid",
    })
    .select("id,full_name")
    .maybeSingle();

  if (insert.error || !insert.data) {
    await supabase.auth.admin.deleteUser(userResult.data.user.id);
    throw new Error(`No se pudo crear el perfil de cliente: ${insert.error?.message ?? "sin perfil"}`);
  }
  return insert.data;
}

function findQuarterlyTemplate(templates: ManagedWorkoutTemplate[], daysPerWeek: number) {
  const expectedName = `Modulo 3 meses · ${daysPerWeek} dias/semana`;
  return templates.find((template) => template.name === expectedName)
    ?? templates.find((template) => template.daysPerWeek === daysPerWeek && template.days.length >= daysPerWeek * 8)
    ?? templates.find((template) => template.daysPerWeek === daysPerWeek)
    ?? null;
}

/**
 * Pick the member's program with the matching engine (lib/domain/program-matcher):
 * builds QuizAnswers from the saved onboarding prefs, scores the tagged templates,
 * and falls back to the legacy days-based lookup when nothing matches (or on any
 * error), so behaviour is unchanged until the tagged matrix is populated.
 */
async function matchQuarterlyTemplate(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  memberProfileId: string,
  daysPerWeek: number,
): Promise<{ id: string; goal: string } | null> {
  try {
    const sb = supabase as unknown as { from: (table: string) => any };
    const [prefs, profile, tpls] = await Promise.all([
      sb.from("member_fitness_preferences").select("location,available_equipment,session_minutes,experience_level,training_goal,days_per_week").eq("member_profile_id", memberProfileId).maybeSingle(),
      sb.from("member_profiles").select("sex,goal").eq("id", memberProfileId).maybeSingle(),
      // The brand's own templates + the platform base-library matrix.
      sb.from("workout_templates").select("id,goal,level,status,days_per_week,goal_tag,target_sex,location,session_minutes,required_equipment").or(`workspace_id.eq.${workspaceId},is_base_library.eq.true`),
    ]);
    const p = prefs?.data ?? null;
    const pr = profile?.data ?? null;
    const rows = (tpls?.data ?? []) as any[];
    if (!rows.length) return null;
    const quiz: QuizAnswers = {
      sex: toProgramSex(pr?.sex),
      goal: normalizeGoal(p?.training_goal ?? pr?.goal),
      place: normalizePlace(p?.location),
      daysPerWeek: Number(p?.days_per_week) || daysPerWeek,
      sessionMinutes: bucketMinutes(p?.session_minutes),
      experience: normalizeLevel(p?.experience_level),
      equipment: Array.isArray(p?.available_equipment) ? p.available_equipment : [],
    };
    const matchTemplates: MatchTemplate[] = rows.map((t) => ({
      id: t.id,
      status: t.status,
      daysPerWeek: t.days_per_week,
      level: t.level,
      goalTag: t.goal_tag ?? null,
      targetSex: t.target_sex ?? null,
      location: t.location ?? null,
      sessionMinutes: t.session_minutes ?? null,
      requiredEquipment: t.required_equipment ?? null,
    }));
    const match = selectProgram(quiz, matchTemplates);
    if (match.templateId) {
      const chosen = rows.find((t) => t.id === match.templateId);
      if (chosen) return { id: chosen.id, goal: chosen.goal ?? "" };
    }
  } catch (error) {
    console.error("Program match failed, falling back to days-based lookup", error);
  }
  return null;
}

export async function assignQuarterlyWorkoutModule(input: {
  workspaceId: string;
  memberProfileId: string;
  daysPerWeek: number;
  workoutTemplateId?: string;
  assignmentGoal?: string;
  assignmentNotes?: string;
  assignedBy?: string | null;
}) {
  const supabase = createServiceSupabaseClient();
  let selected: { id: string; goal: string } | null = null;
  if (input.workoutTemplateId) {
    const templates = await listManagedWorkoutTemplates(input.workspaceId);
    const t = templates.find((item) => item.id === input.workoutTemplateId);
    selected = t ? { id: t.id, goal: t.goal } : { id: input.workoutTemplateId, goal: "" };
  } else {
    // Engine match against brand + base-library matrix; fall back to the legacy
    // days-based lookup over the brand's own templates.
    selected = await matchQuarterlyTemplate(supabase, input.workspaceId, input.memberProfileId, input.daysPerWeek);
    if (!selected) {
      const templates = await listManagedWorkoutTemplates(input.workspaceId);
      const t = findQuarterlyTemplate(templates, input.daysPerWeek);
      selected = t ? { id: t.id, goal: t.goal } : null;
    }
  }

  if (!selected) {
    throw new Error(`No existe todavia el modulo de ${input.daysPerWeek} dias/semana. Crealo desde Programas antes de asignarlo.`);
  }

  const latest = await supabase
    .from("assigned_workout_plans")
    .select("version,source_template_id,status")
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error) {
    throw new Error(`No se pudo revisar la asignacion actual: ${latest.error.message}`);
  }

  if (latest.data?.source_template_id === selected.id && latest.data.status === "active") {
    return { templateId: selected.id, assignmentCreated: false };
  }

  const assignment = await assignWorkoutTemplateToMember({
    workspaceId: input.workspaceId,
    memberProfileId: input.memberProfileId,
    workoutTemplateId: selected.id,
    assignmentGoal: input.assignmentGoal || selected.goal,
    assignmentNotes: input.assignmentNotes,
    currentMonth: "1",
    currentWeek: "1",
    assignedBy: input.assignedBy,
  });

  return { templateId: selected.id, assignmentCreated: Boolean(assignment?.assignmentId) };
}

export async function saveMemberOnboarding(input: MemberOnboardingInput) {
  if (!input.workspaceId) {
    throw new Error("Falta la marca para guardar el onboarding.");
  }

  let member = await getDefaultMemberProfile(input.workspaceId);
  if (!member) {
    // Only an authenticated workspace admin/owner may bootstrap a client profile.
    // Public visitors without a provisioned (paid) profile cannot self-enroll.
    if (!input.allowProvision) {
      throw new Error("Tu acceso aún no está activo. Tu entrenador debe darte de alta para empezar.");
    }
    member = await ensureDefaultMemberProfile(input.workspaceId, input.fullName, input.email);
  }

  const supabase = createServiceSupabaseClient();
  const daysPerWeek = parseInteger(input.daysPerWeek, 4, 3, 7);
  const sessionMinutes = parseInteger(input.sessionMinutes, 60, 30, 150);
  const mealsPerDay = parseInteger(input.mealsPerDay, 4, 3, 6);
  const activityLevel = normalizeActivityLevel(input.activityLevel);
  const sleepHours = parseNumber(input.sleepHours);
  const stepsTarget = parseInteger(input.stepsTarget, 8000, 2000, 30000);
  const fullName = input.fullName.trim() || member.full_name;
  const injuries = splitList(input.injuries);
  const healthConditions = splitList(input.healthConditions);
  const availableEquipment = splitList(input.availableEquipment);
  const preferredTrainingDays = splitList(input.preferredTrainingDays);
  const allergies = splitList(input.allergies);
  const preferredFoods = splitList(input.preferredFoods);
  const dislikedFoods = splitList(input.dislikedFoods);
  const recommendation = await buildOnboardingRecommendation({
    workspaceId: input.workspaceId,
    goal: input.goal,
    daysPerWeek,
    sessionMinutes,
    mealsPerDay,
    trainingLocation: input.trainingLocation,
    injuries,
    healthConditions,
    allergies,
    hideMacros: input.hideMacros,
  });

  const profileUpdate = await supabase
    .from("member_profiles")
    .update({
      full_name: fullName,
      goal: input.goal.trim() || null,
      height_cm: parseNumber(input.heightCm),
      starting_weight_kg: parseNumber(input.weightKg),
      birth_date: input.birthDate || null,
      sex: normalizeSex(input.sex),
      activity_level: activityLevel,
      timezone: input.timezone.trim() || "Europe/Madrid",
      onboarding_status: "plan_brief_submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("workspace_id", input.workspaceId);

  if (profileUpdate.error) {
    throw new Error(`No se pudo guardar el perfil: ${profileUpdate.error.message}`);
  }

  const preferences = await supabase
    .from("member_fitness_preferences")
    .upsert({
      member_profile_id: member.id,
      location: normalizeLocation(input.trainingLocation),
      available_equipment: availableEquipment,
      injuries,
      days_per_week: daysPerWeek,
      session_minutes: sessionMinutes,
      experience_level: input.experienceLevel.trim() || null,
      training_goal: input.goal.trim() || null,
      preferred_training_days: preferredTrainingDays,
      cardio_preference: input.cardioPreference.trim() || null,
      daily_steps_target: stepsTarget,
      sleep_hours: sleepHours,
      updated_at: new Date().toISOString(),
    }, { onConflict: "member_profile_id" });

  if (preferences.error) {
    throw new Error(`No se pudieron guardar las preferencias: ${preferences.error.message}`);
  }

  const dietPreferences = await supabase
    .from("member_diet_preferences")
    .upsert({
      member_profile_id: member.id,
      allergies,
      hide_macros: input.hideMacros,
      diet_style: input.dietStyle.trim() || null,
      meals_per_day: mealsPerDay,
      preferred_foods: preferredFoods,
      disliked_foods: dislikedFoods,
      cooking_time_minutes: parseInteger(input.cookingTimeMinutes, 20, 5, 180),
      budget_level: input.budgetLevel.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "member_profile_id" });

  if (dietPreferences.error) {
    throw new Error(`No se pudieron guardar las preferencias de nutricion: ${dietPreferences.error.message}`);
  }

  const onboardingPayload = {
    profile: {
      fullName,
      goal: input.goal,
      heightCm: parseNumber(input.heightCm),
      weightKg: parseNumber(input.weightKg),
      birthDate: input.birthDate || null,
      sex: normalizeSex(input.sex),
      timezone: input.timezone.trim() || "Europe/Madrid",
      healthConditions,
    },
    health: { conditions: healthConditions },
    training: {
      daysPerWeek,
      sessionMinutes,
      location: normalizeLocation(input.trainingLocation),
      experienceLevel: input.experienceLevel,
      availableEquipment,
      preferredTrainingDays,
      injuries,
      cardioPreference: input.cardioPreference,
      activityLevel,
      sleepHours,
      stepsTarget,
    },
    nutrition: {
      mealsPerDay,
      dietStyle: input.dietStyle,
      allergies,
      preferredFoods,
      dislikedFoods,
      cookingTimeMinutes: parseInteger(input.cookingTimeMinutes, 20, 5, 180),
      budgetLevel: input.budgetLevel,
      hideMacros: input.hideMacros,
    },
    notes: input.notes.trim(),
    recommendation,
  };

  const response = await supabase
    .from("member_onboarding_responses")
    .upsert({
      workspace_id: input.workspaceId,
      member_profile_id: member.id,
      goal: input.goal.trim() || null,
      training_days_per_week: daysPerWeek,
      training_location: normalizeLocation(input.trainingLocation),
      session_minutes: sessionMinutes,
      meals_per_day: mealsPerDay,
      activity_level: activityLevel,
      status: "submitted",
      onboarding_payload: onboardingPayload,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "member_profile_id" })
    .select("id")
    .maybeSingle();

  if (response.error) {
    throw new Error(`No se pudo guardar el briefing inicial: ${response.error.message}`);
  }

  await supabase.from("member_activity_events").insert({
    workspace_id: input.workspaceId,
    member_profile_id: member.id,
    event_type: "onboarding_submitted",
    source: "member_app",
    metadata: {
      daysPerWeek,
      mealsPerDay,
      goal: input.goal,
      recommendationStatus: recommendation.status,
      workoutTemplateId: recommendation.training.templateId,
      dietTemplateId: recommendation.nutrition.templateId,
    },
  });

  return {
    memberProfileId: member.id,
    responseId: (response.data?.id as string | undefined) ?? null,
    daysPerWeek,
    mealsPerDay,
    workoutTemplateId: recommendation.training.templateId,
    dietTemplateId: recommendation.nutrition.templateId,
  };
}

function toRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function optionalInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function reviewFromInput(input: CoachBriefingReviewInput, payload: Record<string, any>, current: {
  goal: string | null;
  daysPerWeek: number | null;
  mealsPerDay: number | null;
}) {
  const existingReview = toRecord(payload.coachReview);
  const training = toRecord(payload.training);
  const nutrition = toRecord(payload.nutrition);
  const fallbackDays = current.daysPerWeek ?? (Number(training.daysPerWeek) || 4);
  const fallbackMeals = current.mealsPerDay ?? (Number(nutrition.mealsPerDay) || 4);

  return {
    goal: input.goal.trim() || optionalString(existingReview.goal) || current.goal || "",
    daysPerWeek: optionalInteger(input.daysPerWeek, fallbackDays, 1, 7),
    workoutTemplateId: input.workoutTemplateId.trim() || optionalString(existingReview.workoutTemplateId),
    dietTemplateId: input.dietTemplateId.trim() || optionalString(existingReview.dietTemplateId),
    mealsPerDay: optionalInteger(input.mealsPerDay, fallbackMeals, 1, 8),
    hideMacros: input.hideMacros,
    coachNotes: input.coachNotes.trim(),
    injuries: splitList(input.injuries),
    allergies: splitList(input.allergies),
    restrictions: splitList(input.restrictions),
    reviewedBy: input.reviewedBy ?? null,
    reviewedAt: new Date().toISOString(),
  };
}

export async function saveOnboardingBriefingReview(input: CoachBriefingReviewInput) {
  if (!input.workspaceId || !input.responseId) {
    throw new Error("Falta el briefing que quieres revisar.");
  }

  const supabase = createServiceSupabaseClient();
  const response = await supabase
    .from("member_onboarding_responses")
    .select("id,member_profile_id,goal,training_days_per_week,meals_per_day,onboarding_payload")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.responseId)
    .maybeSingle();

  if (response.error) {
    throw new Error(`No se pudo leer el briefing: ${response.error.message}`);
  }

  if (!response.data?.id) {
    throw new Error("No se encontro el briefing en esta marca.");
  }

  const payload = toRecord(response.data.onboarding_payload);
  const review = reviewFromInput(input, payload, {
    goal: response.data.goal,
    daysPerWeek: response.data.training_days_per_week,
    mealsPerDay: response.data.meals_per_day,
  });
  const updatedPayload = {
    ...payload,
    coachReview: review,
  };
  const now = new Date().toISOString();

  const update = await supabase
    .from("member_onboarding_responses")
    .update({
      goal: review.goal || null,
      training_days_per_week: review.daysPerWeek,
      meals_per_day: review.mealsPerDay,
      status: "reviewed",
      reviewed_at: now,
      updated_at: now,
      onboarding_payload: updatedPayload,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.responseId);

  if (update.error) {
    throw new Error(`No se pudo guardar la revision: ${update.error.message}`);
  }

  const profileUpdate = await supabase
    .from("member_profiles")
    .update({
      goal: review.goal || null,
      onboarding_status: "coach_reviewed",
      updated_at: now,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", response.data.member_profile_id);

  if (profileUpdate.error) {
    throw new Error(`No se pudo actualizar el estado del miembro: ${profileUpdate.error.message}`);
  }

  return { memberProfileId: response.data.member_profile_id, review };
}

export async function applyOnboardingPlanRecommendation(input: ApplyCoachBriefingInput) {
  if (!input.workspaceId || !input.responseId) {
    throw new Error("Falta el briefing que quieres aplicar.");
  }

  const supabase = createServiceSupabaseClient();
  const response = await supabase
    .from("member_onboarding_responses")
    .select("id,member_profile_id,goal,training_days_per_week,meals_per_day,onboarding_payload")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.responseId)
    .maybeSingle();

  if (response.error) {
    throw new Error(`No se pudo leer el briefing: ${response.error.message}`);
  }

  if (!response.data?.id) {
    throw new Error("No se encontro el briefing en esta marca.");
  }

  const payload = toRecord(response.data.onboarding_payload);
  const nutrition = toRecord(payload.nutrition);
  const currentReview = toRecord(payload.coachReview);
  const recommendedDays = Number(payload.recommendation?.training?.daysPerWeek);
  const recommendedMeals = Number(nutrition.mealsPerDay);
  const fallbackDays = response.data.training_days_per_week ?? (Number.isFinite(recommendedDays) ? recommendedDays : 4);
  const fallbackMeals = response.data.meals_per_day ?? (Number.isFinite(recommendedMeals) ? recommendedMeals : 4);
  const daysPerWeek = optionalInteger(input.daysPerWeek ?? currentReview.daysPerWeek, fallbackDays, 1, 7);
  const mealsPerDay = optionalInteger(input.mealsPerDay ?? currentReview.mealsPerDay, fallbackMeals, 1, 8);
  const hideMacros = typeof input.hideMacros === "boolean"
    ? input.hideMacros
    : typeof currentReview.hideMacros === "boolean"
      ? currentReview.hideMacros
      : typeof nutrition.hideMacros === "boolean" ? nutrition.hideMacros : false;
  const goal = optionalString(input.goal)
    || optionalString(currentReview.goal)
    || response.data.goal
    || (typeof payload.profile?.goal === "string" ? payload.profile.goal : "");
  const workoutTemplateId = optionalString(input.workoutTemplateId) || optionalString(currentReview.workoutTemplateId);
  const dietTemplateId = optionalString(input.dietTemplateId) || optionalString(currentReview.dietTemplateId);
  const coachNotes = optionalString(input.coachNotes) || optionalString(currentReview.coachNotes);

  const workoutAssignment = await assignQuarterlyWorkoutModule({
    workspaceId: input.workspaceId,
    memberProfileId: response.data.member_profile_id,
    daysPerWeek,
    workoutTemplateId,
    assignmentGoal: goal,
    assignmentNotes: coachNotes,
    assignedBy: input.approvedBy ?? null,
  });
  const mealAssignment = await assignRecommendedDietPlan({
    workspaceId: input.workspaceId,
    memberProfileId: response.data.member_profile_id,
    goal,
    mealsPerDay,
    hideMacros,
    dietTemplateId,
    assignedBy: input.approvedBy ?? null,
  });

  // Recovery: seed the suggested habits (sleep/steps/water…) so the quiz yields a
  // ready recovery plan. Best-effort — never blocks plan application.
  try {
    await seedSuggestedHabitsForMember(input.workspaceId, response.data.member_profile_id);
  } catch (error) {
    console.error("Unable to seed recovery habits during onboarding", error);
  }

  const now = new Date().toISOString();
  const coachReview = {
    ...currentReview,
    goal,
    daysPerWeek,
    workoutTemplateId,
    dietTemplateId,
    mealsPerDay,
    hideMacros,
    coachNotes,
    injuries: splitList(input.injuries ?? "").length ? splitList(input.injuries ?? "") : textList(currentReview.injuries),
    allergies: splitList(input.allergies ?? "").length ? splitList(input.allergies ?? "") : textList(currentReview.allergies),
    restrictions: splitList(input.restrictions ?? "").length ? splitList(input.restrictions ?? "") : textList(currentReview.restrictions),
    reviewedBy: input.approvedBy ?? currentReview.reviewedBy ?? null,
    reviewedAt: now,
  };
  const updatedPayload = {
    ...payload,
    coachReview,
    coachApproval: {
      appliedAt: now,
      approvedBy: input.approvedBy ?? null,
      workoutTemplateId: workoutAssignment.templateId,
      dietTemplateId: mealAssignment.dietTemplateId,
      workoutAssignmentCreated: workoutAssignment.assignmentCreated,
      mealAssignmentCreated: mealAssignment.mealAssignmentCreated,
    },
  };

  const update = await supabase
    .from("member_onboarding_responses")
    .update({
      goal: goal || null,
      training_days_per_week: daysPerWeek,
      meals_per_day: mealsPerDay,
      status: "applied",
      reviewed_at: now,
      updated_at: now,
      onboarding_payload: updatedPayload,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.responseId);

  if (update.error) {
    throw new Error(`No se pudo aplicar el briefing: ${update.error.message}`);
  }

  const profileUpdate = await supabase
    .from("member_profiles")
    .update({
      goal: goal || null,
      onboarding_status: "plans_applied",
      updated_at: now,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", response.data.member_profile_id);

  if (profileUpdate.error) {
    throw new Error(`No se pudo actualizar el estado del miembro: ${profileUpdate.error.message}`);
  }

  await supabase.from("member_activity_events").insert({
    workspace_id: input.workspaceId,
    member_profile_id: response.data.member_profile_id,
    event_type: "onboarding_plan_applied",
    source: "coach_console",
    metadata: {
      responseId: input.responseId,
      workoutTemplateId: workoutAssignment.templateId,
      dietTemplateId: mealAssignment.dietTemplateId,
      daysPerWeek,
      mealsPerDay,
      hideMacros,
    },
  });

  return { ...workoutAssignment, ...mealAssignment };
}

/**
 * Best recent set (by reps × weight) per exercise from the member's set logs in
 * the prior 14 days. Powers the "vs. last week" progression hint on the plan.
 */
async function getRecentBestSetByExercise(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  input: { workspaceId: string; memberProfileId: string; exerciseIds: string[] },
): Promise<Map<string, MemberExerciseProgression>> {
  const result = new Map<string, MemberExerciseProgression>();
  if (!input.exerciseIds.length) return result;

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 14);

  const sessions = await supabase
    .from("workout_session_logs")
    .select("id,session_date")
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .gte("session_date", fromDate.toISOString().slice(0, 10))
    .order("session_date", { ascending: false })
    .limit(40);

  const sessionRows: Array<{ id: string; session_date: string }> = sessions.data ?? [];
  if (sessions.error || !sessionRows.length) return result;

  const dateBySession = new Map(sessionRows.map((row) => [row.id, row.session_date]));
  const sets = await supabase
    .from("workout_set_logs")
    .select("session_log_id,exercise_id,actual_reps,weight_kg")
    .in("session_log_id", sessionRows.map((row) => row.id))
    .in("exercise_id", input.exerciseIds);

  if (sets.error) return result;

  for (const set of sets.data ?? []) {
    const exerciseId: string | null = set.exercise_id;
    if (!exerciseId) continue;
    const reps = typeof set.actual_reps === "number" ? set.actual_reps : Number(set.actual_reps);
    const weight = Number(set.weight_kg);
    if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps <= 0 || weight <= 0) continue;

    const current = result.get(exerciseId);
    const score = reps * weight;
    const currentScore = current ? (current.lastReps ?? 0) * (current.lastWeightKg ?? 0) : -1;
    if (score > currentScore) {
      result.set(exerciseId, {
        lastWeightKg: weight,
        lastReps: reps,
        lastLoggedOn: dateBySession.get(set.session_log_id) ?? null,
      });
    }
  }

  return result;
}

function normalizeCardioModality(preference: string): "hiit" | "liss" | null {
  const value = preference.toLowerCase();
  if (/hiit|intervalo|interval|sprint|tabata/.test(value)) return "hiit";
  if (/liss|caminar|walk|paseo|suave|steady|bici|eliptica|elíptica|low/.test(value)) return "liss";
  return null;
}

function cardioSessionsForGoal(goal: string): number {
  const value = goal.toLowerCase();
  if (/defin|perdida|pérdida|loss|grasa|fat/.test(value)) return 4;
  if (/volumen|masa|gain/.test(value)) return 2;
  return 3;
}

/**
 * Cardio context for the member's /app/cardio view: their declared preference,
 * steps target and a goal-derived weekly cadence. Read-only, member-scoped.
 */
export async function getMemberCardioContext(workspaceId?: string): Promise<MemberCardioContext> {
  const empty: MemberCardioContext = {
    hasProfile: false,
    preference: "",
    preferredModality: null,
    dailyStepsTarget: null,
    goal: "",
    weeklySessions: 3,
  };

  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return empty;

  const member = await getDefaultMemberProfile(workspaceId);
  if (!member) return empty;

  const supabase = createServiceSupabaseClient();
  const [preferences, profile] = await Promise.all([
    supabase
      .from("member_fitness_preferences")
      .select("cardio_preference,daily_steps_target,training_goal")
      .eq("member_profile_id", member.id)
      .maybeSingle(),
    supabase
      .from("member_profiles")
      .select("goal")
      .eq("id", member.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);

  const preference = (preferences.data?.cardio_preference ?? "").trim();
  const goal = (preferences.data?.training_goal || profile.data?.goal || "").trim();

  return {
    hasProfile: true,
    preference,
    preferredModality: normalizeCardioModality(preference),
    dailyStepsTarget: preferences.data?.daily_steps_target ?? null,
    goal,
    weeklySessions: cardioSessionsForGoal(goal),
  };
}

export async function getMemberTrainingContext(workspaceId?: string): Promise<MemberTrainingContext> {
  const empty: MemberTrainingContext = {
    memberProfileId: null,
    preferredDaysPerWeek: null,
    activeAssignment: null,
    activeTemplate: null,
    assignedDays: [],
    activeAssignedDay: null,
  };

  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return empty;

  const member = await getDefaultMemberProfile(workspaceId);
  if (!member) return empty;

  const supabase = createServiceSupabaseClient();
  const [preferences, assignment, templates] = await Promise.all([
    supabase
      .from("member_fitness_preferences")
      .select("days_per_week")
      .eq("member_profile_id", member.id)
      .maybeSingle(),
    supabase
      .from("assigned_workout_plans")
      .select("id,name,source_template_id,starts_on,ends_on,version,current_week,current_month,days_per_week,assignment_goal,assignment_notes,next_review_on")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", member.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    listManagedWorkoutTemplates(workspaceId),
  ]);

  const preferredDaysPerWeek = preferences.data?.days_per_week ?? null;
  const assignedTemplateId = assignment.data?.source_template_id ?? null;
  const activeTemplate = assignedTemplateId
    ? templates.find((template) => template.id === assignedTemplateId) ?? null
    : findQuarterlyTemplate(templates, preferredDaysPerWeek ?? 4) ?? templates[0] ?? null;
  let assignedDays: MemberAssignedWorkoutDay[] = [];

  if (assignment.data?.id) {
    const daysResult = await supabase
      .from("assigned_workout_days")
      .select("id,assigned_workout_plan_id,source_template_day_id,week_number,month_number,day_number,scheduled_on,title,focus,instructions,estimated_minutes,status")
      .eq("workspace_id", workspaceId)
      .eq("assigned_workout_plan_id", assignment.data.id)
      .order("week_number", { ascending: true })
      .order("day_number", { ascending: true });

    if (daysResult.error) {
      console.error("Unable to load assigned workout days", daysResult.error.message);
    }

    const dayRows = daysResult.data ?? [];
    const dayIds = dayRows.map((day) => day.id);
    const exercisesResult = dayIds.length
      ? await supabase
          .from("assigned_workout_exercises")
          .select("id,assigned_workout_day_id,source_template_exercise_id,exercise_id,title,video_url,sets,reps,tempo,rest_seconds,target_rir,notes,sort_order")
          .in("assigned_workout_day_id", dayIds)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

    if (exercisesResult.error) {
      console.error("Unable to load assigned workout exercises", exercisesResult.error.message);
    }

    // Base library metadata (e.g. Free Exercise DB) for assigned exercises:
    // a real photo + muscle groups, equipment, difficulty and a technique cue —
    // so the member's published plan shows a rich exercise detail. Images are
    // served optimized through Cloudinary, mirroring the template path.
    type BaseExerciseDetail = {
      thumbnailUrl: string;
      imageUrl: string;
      frames: string[];
      muscleGroups: string[];
      equipment: string[];
      difficulty: string;
      instructions: string;
    };
    const baseDetailByExercise = new Map<string, BaseExerciseDetail>();
    const baseExerciseIds = [...new Set((exercisesResult.data ?? [])
      .map((exercise) => exercise.exercise_id)
      .filter((value): value is string => Boolean(value)))];
    if (baseExerciseIds.length) {
      const baseImagesResult = await supabase
        .from("exercises")
        .select("id,image_urls,muscle_groups,equipment,difficulty,instructions")
        .in("id", baseExerciseIds);
      if (baseImagesResult.error) {
        console.error("Unable to load assigned exercise detail", baseImagesResult.error.message);
      }
      for (const row of baseImagesResult.data ?? []) {
        const urls = Array.isArray(row.image_urls)
          ? row.image_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
          : [];
        baseDetailByExercise.set(row.id, {
          thumbnailUrl: exerciseCardImage(urls),
          imageUrl: urls[0] ? cloudinaryFetch(urls[0], { width: 960, height: 640 }) : "",
          frames: urls.slice(0, 4).map((url) => cloudinaryFetch(url, { width: 960, height: 640 })),
          muscleGroups: Array.isArray(row.muscle_groups) ? row.muscle_groups.filter(Boolean) : [],
          equipment: Array.isArray(row.equipment) ? row.equipment.filter(Boolean) : [],
          difficulty: typeof row.difficulty === "string" ? row.difficulty : "",
          instructions: typeof row.instructions === "string" ? row.instructions : "",
        });
      }
    }

    // Progression: the member's best recent set per exercise (prior 14 days), so
    // the plan can show "last week you did Xkg × Y" next to today's prescription.
    const progressionByExercise = await getRecentBestSetByExercise(supabase, {
      workspaceId,
      memberProfileId: member.id,
      exerciseIds: baseExerciseIds,
    });

    const exercisesByDay = new Map<string, MemberAssignedWorkoutExercise[]>();
    for (const exercise of exercisesResult.data ?? []) {
      const list = exercisesByDay.get(exercise.assigned_workout_day_id) ?? [];
      const detail = baseDetailByExercise.get(exercise.exercise_id ?? "");
      list.push({
        id: exercise.id,
        sourceTemplateExerciseId: exercise.source_template_exercise_id,
        exerciseId: exercise.exercise_id ?? "",
        exerciseName: exercise.title,
        videoUrl: exercise.video_url ?? "",
        thumbnailUrl: detail?.thumbnailUrl ?? "",
        imageUrl: detail?.imageUrl ?? "",
        frames: detail?.frames ?? [],
        muscleGroups: detail?.muscleGroups ?? [],
        equipment: detail?.equipment ?? [],
        difficulty: detail?.difficulty ?? "",
        instructions: detail?.instructions ?? "",
        sets: exercise.sets,
        reps: exercise.reps ?? "",
        tempo: exercise.tempo ?? "",
        restSeconds: exercise.rest_seconds,
        targetRir: exercise.target_rir ?? "",
        notes: exercise.notes ?? "",
        sortOrder: exercise.sort_order,
        progression: progressionByExercise.get(exercise.exercise_id ?? "") ?? null,
      });
      exercisesByDay.set(exercise.assigned_workout_day_id, list);
    }

    assignedDays = dayRows.map((day) => ({
      id: day.id,
      sourceTemplateDayId: day.source_template_day_id,
      assignedPlanId: day.assigned_workout_plan_id,
      title: day.title,
      weekNumber: day.week_number,
      monthNumber: day.month_number,
      dayNumber: day.day_number,
      scheduledOn: day.scheduled_on ?? "",
      status: day.status,
      focus: day.focus ?? "",
      notes: day.instructions ?? "",
      estimatedMinutes: day.estimated_minutes,
      exercises: exercisesByDay.get(day.id) ?? [],
    }));
  }

  const activeAssignedDay = assignedDays.find((day) => day.status !== "completed" && day.weekNumber === (assignment.data?.current_week ?? 1))
    ?? assignedDays.find((day) => day.status !== "completed" && daysBetween(assignment.data?.starts_on) <= (day.weekNumber - 1) * 7 + Math.max(0, day.dayNumber - 1))
    ?? assignedDays.find((day) => day.status !== "completed")
    ?? assignedDays[0]
    ?? null;

  return {
    memberProfileId: member.id,
    preferredDaysPerWeek,
    activeAssignment: assignment.data
        ? {
            id: assignment.data.id,
            name: assignment.data.name,
            sourceTemplateId: assignment.data.source_template_id,
            startsOn: assignment.data.starts_on ?? "",
            endsOn: assignment.data.ends_on ?? "",
            version: assignment.data.version,
            currentWeek: assignment.data.current_week,
            currentMonth: assignment.data.current_month,
            daysPerWeek: assignment.data.days_per_week,
            goal: assignment.data.assignment_goal ?? "",
            notes: assignment.data.assignment_notes ?? "",
            nextReviewOn: assignment.data.next_review_on ?? "",
          }
        : null,
    activeTemplate,
    assignedDays,
    activeAssignedDay,
  };
}
