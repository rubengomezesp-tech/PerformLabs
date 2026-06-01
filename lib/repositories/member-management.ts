import { calculateNutritionTargets, type ActivityLevel, type NutritionGoal } from "@/lib/domain/nutrition-engine";
import { members } from "@/lib/data";
import { fireMemberEventNotification } from "@/lib/notifications/events";
import { clampMemberStatus } from "@/lib/repositories/member-subscriptions";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * Guard: confirm `memberProfileId` belongs to `workspaceId` before a coach/console
 * action writes plan rows onto it. The data layer uses the service-role client
 * (RLS bypassed), so this app-level check is the real cross-tenant control.
 */
async function assertMemberInWorkspace(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  memberProfileId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("id", memberProfileId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error || !data) throw new Error("Ese cliente no pertenece a tu marca.");
}

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

function ageFromBirthDate(value?: string | null) {
  if (!value) return 35;
  const birthDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) return 35;
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return Math.max(12, Math.min(90, age));
}

function normalizeNutritionGoal(value?: string | null): NutritionGoal {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("volumen") || normalized.includes("gain")) return "lean_gain";
  if (normalized.includes("mantenimiento") || normalized.includes("maintenance")) return "maintenance";
  if (normalized.includes("masa") || normalized.includes("bulk")) return "gain";
  return "fat_loss";
}

function normalizeActivityLevel(value?: number | null): ActivityLevel {
  if (!value) return "moderate";
  if (value < 1.3) return "sedentary";
  if (value < 1.5) return "light";
  if (value < 1.7) return "moderate";
  if (value < 1.85) return "active";
  return "athlete";
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function materializeWorkoutAssignment(input: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  workspaceId: string;
  memberProfileId: string;
  assignmentId: string;
  templateId: string;
  startsOn: string;
}) {
  const { supabase, workspaceId, memberProfileId, assignmentId, templateId, startsOn } = input;
  const daysResult = await supabase
    .from("workout_template_days")
    .select("id,week_number,month_number,day_number,title,notes,focus,phase_title,estimated_minutes")
    .eq("template_id", templateId)
    .order("week_number", { ascending: true })
    .order("day_number", { ascending: true });

  if (daysResult.error) {
    throw new Error(`No se pudieron leer los dias del programa: ${daysResult.error.message}`);
  }

  const templateDays = daysResult.data ?? [];
  if (!templateDays.length) return { daysCreated: 0, exercisesCreated: 0 };

  await supabase
    .from("assigned_workout_days")
    .delete()
    .eq("assigned_workout_plan_id", assignmentId);

  const assignedDayPayload = templateDays.map((day) => ({
    workspace_id: workspaceId,
    assigned_workout_plan_id: assignmentId,
    member_profile_id: memberProfileId,
    source_template_day_id: day.id,
    week_number: day.week_number,
    month_number: day.month_number ?? Math.floor((day.week_number - 1) / 4) + 1,
    day_number: day.day_number,
    scheduled_on: addDays(new Date(`${startsOn}T00:00:00.000Z`), (day.week_number - 1) * 7 + Math.max(0, day.day_number - 1)),
    title: day.title,
    focus: day.focus ?? day.phase_title ?? null,
    instructions: day.notes ?? null,
    estimated_minutes: day.estimated_minutes ?? null,
    status: "scheduled",
  }));

  const assignedDaysResult = await supabase
    .from("assigned_workout_days")
    .insert(assignedDayPayload)
    .select("id,source_template_day_id");

  if (assignedDaysResult.error || !assignedDaysResult.data) {
    throw new Error(`No se pudieron preparar las sesiones del cliente: ${assignedDaysResult.error?.message ?? "sin respuesta"}`);
  }

  const dayIdByTemplateDay = new Map(
    assignedDaysResult.data
      .filter((day) => day.source_template_day_id)
      .map((day) => [day.source_template_day_id as string, day.id]),
  );

  const templateDayIds = templateDays.map((day) => day.id);
  const exercisesResult = await supabase
    .from("workout_template_exercises")
    .select("id,day_id,exercise_id,block_type,sets,reps,tempo,rest_seconds,notes,target_rir,load_guidance,swap_rules,sort_order,exercises(name,default_video_url)")
    .in("day_id", templateDayIds)
    .order("sort_order", { ascending: true });

  if (exercisesResult.error) {
    throw new Error(`No se pudieron leer los ejercicios del programa: ${exercisesResult.error.message}`);
  }

  const exerciseIds = [...new Set((exercisesResult.data ?? []).map((item) => item.exercise_id).filter(Boolean))] as string[];
  const videosResult = exerciseIds.length
    ? await supabase
        .from("exercise_videos")
        .select("exercise_id,video_url,thumbnail_url,is_default,created_at")
        .eq("workspace_id", workspaceId)
        .in("exercise_id", exerciseIds)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (videosResult.error) {
    console.error("Unable to load videos for assignment", videosResult.error.message);
  }

  const videoByExercise = new Map<string, string>();
  for (const video of videosResult.data ?? []) {
    if (!videoByExercise.has(video.exercise_id)) {
      videoByExercise.set(video.exercise_id, video.video_url);
    }
  }

  const exercisePayload = (exercisesResult.data ?? []).flatMap((item) => {
    const assignedWorkoutDayId = dayIdByTemplateDay.get(item.day_id);
    if (!assignedWorkoutDayId) return [];
    const exercise = relationOne(item.exercises as { name?: string; default_video_url?: string | null } | null);
    const swapRules = item.swap_rules && typeof item.swap_rules === "object" ? item.swap_rules as Record<string, unknown> : {};
    return [{
      workspace_id: workspaceId,
      assigned_workout_day_id: assignedWorkoutDayId,
      member_profile_id: memberProfileId,
      exercise_id: item.exercise_id,
      source_template_exercise_id: item.id,
      block_type: item.block_type ?? "main",
      title: exercise?.name ?? "Ejercicio",
      sort_order: item.sort_order,
      sets: item.sets,
      reps: item.reps,
      tempo: item.tempo,
      rest_seconds: item.rest_seconds,
      target_rir: item.target_rir ?? (typeof swapRules.targetRir === "string" ? swapRules.targetRir : null),
      load_guidance: item.load_guidance,
      notes: item.notes,
      video_url: videoByExercise.get(item.exercise_id) ?? exercise?.default_video_url ?? null,
      swap_options: [],
    }];
  });

  if (!exercisePayload.length) {
    return { daysCreated: assignedDayPayload.length, exercisesCreated: 0 };
  }

  const exercisesInsert = await supabase
    .from("assigned_workout_exercises")
    .insert(exercisePayload);

  if (exercisesInsert.error) {
    throw new Error(`Se crearon los dias, pero no los ejercicios asignados: ${exercisesInsert.error.message}`);
  }

  return { daysCreated: assignedDayPayload.length, exercisesCreated: exercisePayload.length };
}

export async function assignWorkoutTemplateToMember(input: {
  workspaceId: string;
  memberProfileId: string;
  workoutTemplateId: string;
  assignmentGoal?: string;
  assignmentNotes?: string;
  currentMonth?: string;
  currentWeek?: string;
  nextReviewOn?: string;
  assignedBy?: string | null;
}) {
  if (!input.workoutTemplateId) return null;

  const supabase = createServiceSupabaseClient();
  await assertMemberInWorkspace(supabase, input.workspaceId, input.memberProfileId);
  const nowDate = new Date();
  const now = nowDate.toISOString().slice(0, 10);
  const workout = await supabase
    .from("workout_templates")
    .select("id,name,days_per_week,duration_weeks,goal,level")
    .or(`workspace_id.eq.${input.workspaceId},is_base_library.eq.true`)
    .eq("id", input.workoutTemplateId)
    .maybeSingle();

  if (workout.error || !workout.data) {
    throw new Error(`No se pudo leer el entrenamiento: ${workout.error?.message ?? "no existe"}`);
  }

  const archive = await supabase
    .from("assigned_workout_plans")
    .update({ status: "archived", review_status: "completed", updated_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .eq("status", "active");

  if (archive.error) throw new Error(`No se pudo cerrar el entrenamiento anterior: ${archive.error.message}`);

  const durationDays = Math.max(28, Math.min(180, (workout.data.duration_weeks ?? 12) * 7));
  const currentWeek = parseInteger(input.currentWeek, 1, 1, Math.max(1, workout.data.duration_weeks ?? 12));
  const currentMonth = parseInteger(input.currentMonth, Math.floor((currentWeek - 1) / 4) + 1, 1, 6);
  const assignmentResult = await supabase.from("assigned_workout_plans").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    source_template_id: input.workoutTemplateId,
    name: workout.data.name,
    days_per_week: workout.data.days_per_week,
    current_month: currentMonth,
    current_week: currentWeek,
    assignment_goal: input.assignmentGoal?.trim() || workout.data.goal || null,
    assignment_notes: input.assignmentNotes?.trim() || null,
    starts_on: now,
    ends_on: addDays(nowDate, durationDays),
    next_review_on: input.nextReviewOn || addDays(nowDate, 7),
    review_status: "pending",
    assigned_by: input.assignedBy ?? null,
    generation_status: "published",
    algorithm_snapshot: {
      source: "coach_assignment",
      templateId: input.workoutTemplateId,
      templateLevel: workout.data.level,
      assignedAt: new Date().toISOString(),
    },
    status: "active",
  }).select("id").single();

  if (assignmentResult.error || !assignmentResult.data) {
    throw new Error(`No se pudo asignar entrenamiento: ${assignmentResult.error?.message ?? "sin respuesta"}`);
  }

  const materialized = await materializeWorkoutAssignment({
    supabase,
    workspaceId: input.workspaceId,
    memberProfileId: input.memberProfileId,
    assignmentId: assignmentResult.data.id,
    templateId: input.workoutTemplateId,
    startsOn: now,
  });

  await supabase.from("member_activity_events").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    event_type: "workout_plan_assigned",
    source: "coach_console",
    metadata: {
      assignmentId: assignmentResult.data.id,
      templateId: input.workoutTemplateId,
      daysCreated: materialized.daysCreated,
      exercisesCreated: materialized.exercisesCreated,
    },
  });

  return { assignmentId: assignmentResult.data.id, ...materialized };
}

async function recipeMacroMap(supabase: ReturnType<typeof createServiceSupabaseClient>, recipeIds: string[]) {
  if (!recipeIds.length) return new Map<string, { calories: number; protein: number; carbs: number; fat: number; ingredients: number }>();
  const result = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,grams,ingredients(calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g)")
    .in("recipe_id", recipeIds);

  if (result.error) {
    console.error("Unable to calculate recipe macros", result.error.message);
    return new Map();
  }

  const byRecipe = new Map<string, { calories: number; protein: number; carbs: number; fat: number; ingredients: number }>();
  for (const item of result.data ?? []) {
    const ingredient = relationOne(item.ingredients as {
      calories_per_100g?: number;
      protein_per_100g?: number;
      carbs_per_100g?: number;
      fat_per_100g?: number;
    } | null);
    const current = byRecipe.get(item.recipe_id) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: 0 };
    const ratio = Number(item.grams ?? 0) / 100;
    current.calories += (ingredient?.calories_per_100g ?? 0) * ratio;
    current.protein += (ingredient?.protein_per_100g ?? 0) * ratio;
    current.carbs += (ingredient?.carbs_per_100g ?? 0) * ratio;
    current.fat += (ingredient?.fat_per_100g ?? 0) * ratio;
    current.ingredients += 1;
    byRecipe.set(item.recipe_id, current);
  }

  return byRecipe;
}

async function materializeMealPlan(input: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  workspaceId: string;
  memberProfileId: string;
  assignedMealPlanId: string;
  dietTemplateId: string;
  targetMeals: Array<{ name: string; calories: number; proteinG: number; carbsG: number; fatG: number }>;
}) {
  const { supabase, workspaceId, memberProfileId, assignedMealPlanId, dietTemplateId, targetMeals } = input;
  await supabase.from("assigned_meal_plan_days").delete().eq("assigned_meal_plan_id", assignedMealPlanId);

  const templateMeals = await supabase
    .from("diet_template_meals")
    .select("day_number,meal_slot,recipe_id,serving_multiplier,sort_order,recipes(name,instructions)")
    .eq("diet_template_id", dietTemplateId)
    .order("day_number", { ascending: true })
    .order("sort_order", { ascending: true });

  if (templateMeals.error) {
    throw new Error(`No se pudieron leer las comidas de la plantilla: ${templateMeals.error.message}`);
  }

  let mealRows = templateMeals.data ?? [];
  if (!mealRows.length) {
    const fallbackRecipes = await supabase
      .from("recipes")
      .select("id,name,meal_slot,instructions")
      .eq("workspace_id", workspaceId)
      .limit(8);

    if (fallbackRecipes.error) {
      console.error("Unable to load fallback recipes", fallbackRecipes.error.message);
    }

    mealRows = (fallbackRecipes.data ?? []).map((recipe, index) => ({
      day_number: 1,
      meal_slot: recipe.meal_slot,
      recipe_id: recipe.id,
      serving_multiplier: 1,
      sort_order: index + 1,
      recipes: { name: recipe.name, instructions: recipe.instructions },
    }));
  }

  const dayNumbers = [...new Set(mealRows.map((meal) => meal.day_number || 1))].sort((left, right) => left - right);
  const normalizedDayNumbers = dayNumbers.length ? dayNumbers : [1];
  const targetTotals = targetMeals.length
    ? {
        calories: targetMeals.reduce((total, meal) => total + meal.calories, 0),
        proteinG: targetMeals.reduce((total, meal) => total + meal.proteinG, 0),
        carbsG: targetMeals.reduce((total, meal) => total + meal.carbsG, 0),
        fatG: targetMeals.reduce((total, meal) => total + meal.fatG, 0),
      }
    : null;
  const dayPayload = normalizedDayNumbers.map((dayNumber) => ({
    workspace_id: workspaceId,
    assigned_meal_plan_id: assignedMealPlanId,
    member_profile_id: memberProfileId,
    day_number: dayNumber,
    title: `Dia ${dayNumber}`,
    target_calories: targetTotals?.calories ?? null,
    target_protein_g: targetTotals?.proteinG ?? null,
    target_carbs_g: targetTotals?.carbsG ?? null,
    target_fat_g: targetTotals?.fatG ?? null,
    notes: "Plan preparado por el coach.",
  }));

  const daysResult = await supabase
    .from("assigned_meal_plan_days")
    .insert(dayPayload)
    .select("id,day_number");

  if (daysResult.error || !daysResult.data) {
    throw new Error(`No se pudieron preparar los dias de comida: ${daysResult.error?.message ?? "sin respuesta"}`);
  }

  const dayIdByNumber = new Map(daysResult.data.map((day) => [day.day_number, day.id]));
  const recipeIds = [...new Set(mealRows.map((meal) => meal.recipe_id).filter(Boolean))] as string[];
  const macrosByRecipe = await recipeMacroMap(supabase, recipeIds);
  const itemPayload = mealRows.flatMap((meal, index) => {
    const dayId = dayIdByNumber.get(meal.day_number || 1);
    if (!dayId) return [];
    const recipe = relationOne(meal.recipes as { name?: string; instructions?: string | null } | null);
    const macros = macrosByRecipe.get(meal.recipe_id);
    const multiplier = Number(meal.serving_multiplier ?? 1);
    return [{
      workspace_id: workspaceId,
      assigned_meal_plan_day_id: dayId,
      member_profile_id: memberProfileId,
      recipe_id: meal.recipe_id,
      meal_slot: meal.meal_slot,
      title: recipe?.name ?? meal.meal_slot,
      serving_multiplier: multiplier,
      calories: macros ? Math.round(macros.calories * multiplier) : null,
      protein_g: macros ? Math.round(macros.protein * multiplier) : null,
      carbs_g: macros ? Math.round(macros.carbs * multiplier) : null,
      fat_g: macros ? Math.round(macros.fat * multiplier) : null,
      instructions: recipe?.instructions ?? null,
      swap_options: [],
      sort_order: meal.sort_order ?? index + 1,
    }];
  });

  if (itemPayload.length) {
    const itemResult = await supabase.from("assigned_meal_plan_items").insert(itemPayload);
    if (itemResult.error) {
      throw new Error(`Se preparo el plan, pero no sus comidas: ${itemResult.error.message}`);
    }
  }

  return { daysCreated: dayPayload.length, mealsCreated: itemPayload.length };
}

export async function assignDietTemplateToMember(input: {
  workspaceId: string;
  memberProfileId: string;
  dietTemplateId: string;
  mealsPerDay?: string;
  hideMacros?: boolean;
  assignedBy?: string | null;
}) {
  if (!input.dietTemplateId) return null;

  const supabase = createServiceSupabaseClient();
  await assertMemberInWorkspace(supabase, input.workspaceId, input.memberProfileId);
  const member = await supabase
    .from("member_profiles")
    .select("sex,height_cm,starting_weight_kg,birth_date,activity_level,goal")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.memberProfileId)
    .maybeSingle();
  const diet = await supabase
    .from("diet_templates")
    .select("id,name,goal,protein_ratio,fat_ratio")
    .or(`workspace_id.eq.${input.workspaceId},is_base_library.eq.true`)
    .eq("id", input.dietTemplateId)
    .maybeSingle();

  if (diet.error || !diet.data) {
    throw new Error(`No se pudo leer la plantilla nutricional: ${diet.error?.message ?? "no existe"}`);
  }

  const preferences = await supabase
    .from("member_fitness_preferences")
    .select("days_per_week")
    .eq("member_profile_id", input.memberProfileId)
    .maybeSingle();
  const mealsPerDay = parseInteger(input.mealsPerDay, 4, 3, 6);

  const target = member.data?.height_cm && member.data.starting_weight_kg
    ? calculateNutritionTargets({
        gender: member.data.sex === "female" ? "female" : "male",
        age: ageFromBirthDate(member.data.birth_date),
        heightCm: Number(member.data.height_cm),
        weightKg: Number(member.data.starting_weight_kg),
        activityLevel: normalizeActivityLevel(Number(member.data.activity_level)),
        goal: normalizeNutritionGoal(diet.data.goal ?? member.data.goal),
        proteinPerKg: diet.data.protein_ratio ? Math.max(1.2, Math.min(3, Number(diet.data.protein_ratio) * 10)) : undefined,
        fatRatio: diet.data.fat_ratio ? Math.max(0.15, Math.min(0.8, Number(diet.data.fat_ratio))) : undefined,
        mealsPerDay,
        trainingDaysPerWeek: preferences.data?.days_per_week ?? 4,
      })
    : null;

  const archive = await supabase
    .from("assigned_meal_plans")
    .update({ status: "archived", review_status: "completed", updated_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .eq("status", "active");

  if (archive.error) {
    throw new Error(`No se pudo cerrar la nutricion anterior: ${archive.error.message}`);
  }

  const nowDate = new Date();
  const now = nowDate.toISOString().slice(0, 10);
  const planResult = await supabase.from("assigned_meal_plans").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    source_template_id: input.dietTemplateId,
    name: diet.data.name,
    starts_on: now,
    ends_on: addDays(nowDate, 28),
    formula_snapshot: target?.formulaSnapshot ?? {},
    target_calories: target?.targetCalories ?? null,
    target_protein_g: target?.proteinG ?? null,
    target_carbs_g: target?.carbsG ?? null,
    target_fat_g: target?.fatG ?? null,
    water_target_ml: target?.waterMl ?? null,
    fiber_target_g: target?.fiberG ?? null,
    meals_per_day: target?.meals.length ?? mealsPerDay,
    hide_macros: Boolean(input.hideMacros),
    generation_status: "published",
    status: "active",
  }).select("id").single();

  if (planResult.error || !planResult.data) {
    throw new Error(`No se pudo asignar nutricion: ${planResult.error?.message ?? "sin respuesta"}`);
  }

  if (target) {
    await supabase.from("nutrition_calculation_runs").insert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      assigned_meal_plan_id: planResult.data.id,
      goal: normalizeNutritionGoal(diet.data.goal).toString(),
      input_snapshot: {
        source: "coach_assignment",
        templateId: input.dietTemplateId,
        heightCm: member.data?.height_cm,
        weightKg: member.data?.starting_weight_kg,
        mealsPerDay,
        trainingDaysPerWeek: preferences.data?.days_per_week ?? 4,
      },
      output_snapshot: target,
      target_calories: target.targetCalories,
      target_protein_g: target.proteinG,
      target_carbs_g: target.carbsG,
      target_fat_g: target.fatG,
      confidence_score: member.data?.height_cm && member.data.starting_weight_kg ? 0.86 : 0.45,
      status: "published",
      created_by: input.assignedBy ?? null,
    });
  }

  const materialized = await materializeMealPlan({
    supabase,
    workspaceId: input.workspaceId,
    memberProfileId: input.memberProfileId,
    assignedMealPlanId: planResult.data.id,
    dietTemplateId: input.dietTemplateId,
    targetMeals: target?.meals ?? [],
  });

  await supabase.from("member_activity_events").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    event_type: "meal_plan_assigned",
    source: "coach_console",
    metadata: {
      assignedMealPlanId: planResult.data.id,
        dietTemplateId: input.dietTemplateId,
        targetCalories: target?.targetCalories ?? null,
        mealsPerDay,
        daysCreated: materialized.daysCreated,
        mealsCreated: materialized.mealsCreated,
      },
  });

  return { assignedMealPlanId: planResult.data.id, ...materialized };
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

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  email: string,
): Promise<string | null> {
  // Pre-launch scale: scan the first pages of users for a case-insensitive match.
  // TODO: replace with a by-email index/RPC once the user base grows.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((user) => (user.email || "").toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * Find-or-create an active member from a CONFIRMED payment (Fase 2 self-serve
 * funnel). Called by the Stripe webhook after `checkout.session.completed`, so an
 * account only ever exists for a paying member — there is still no open signup.
 * Idempotent on (workspace_id, user_id): a repeat purchase or a coach-precreated
 * member is reused, not duplicated. Returns the member_profiles id (or null).
 */
export async function provisionPaidMember(input: {
  workspaceId: string;
  email: string;
  fullName?: string | null;
  status?: string;
}): Promise<string | null> {
  if (!getSupabaseServiceEnv().ok) return null;
  const email = input.email.trim().toLowerCase();
  if (!input.workspaceId || !email.includes("@")) return null;

  const supabase = createServiceSupabaseClient();
  const fullName = (input.fullName?.trim() || email.split("@")[0] || "Cliente").slice(0, 120);

  let userId: string | null = null;
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created.data?.user) {
    userId = created.data.user.id;
  } else {
    // Email already registered (coach pre-created, or a repeat purchase): reuse it.
    userId = await findAuthUserIdByEmail(supabase, email);
  }
  if (!userId) return null;

  const profile = await supabase
    .from("member_profiles")
    .upsert(
      {
        workspace_id: input.workspaceId,
        user_id: userId,
        full_name: fullName,
        subscription_status: clampMemberStatus(input.status),
        onboarding_status: "invited",
        timezone: "Europe/Madrid",
      },
      { onConflict: "workspace_id,user_id" },
    )
    .select("id")
    .maybeSingle();
  return profile.data?.id ?? null;
}

export async function assignPlansToMember(input: MemberAssignmentInput) {
  if (!input.workspaceId || !input.memberProfileId) throw new Error("Falta marca o cliente.");

  const workoutAssignment = input.workoutTemplateId
    ? await assignWorkoutTemplateToMember({
        workspaceId: input.workspaceId,
        memberProfileId: input.memberProfileId,
        workoutTemplateId: input.workoutTemplateId,
        assignmentGoal: input.assignmentGoal,
        assignmentNotes: input.assignmentNotes,
        currentMonth: input.currentMonth,
        currentWeek: input.currentWeek,
        nextReviewOn: input.nextReviewOn,
        assignedBy: input.assignedBy,
      })
    : null;

  const mealAssignment = input.dietTemplateId
    ? await assignDietTemplateToMember({
        workspaceId: input.workspaceId,
        memberProfileId: input.memberProfileId,
        dietTemplateId: input.dietTemplateId,
        assignedBy: input.assignedBy,
      })
    : null;

  if (mealAssignment) {
    // Notify the member their coach activated a new plan (best-effort push).
    await fireMemberEventNotification({
      workspaceId: input.workspaceId,
      memberProfileId: input.memberProfileId,
      eventKey: "nutrition.plan_activated",
    });
  }

  return { workoutAssignment, mealAssignment };
}

/**
 * Advances a member's active workout plan after a coach check-in review:
 * moves the current week/month forward (capped at the 12-week block) and
 * reschedules the next review. current_week drives what the member sees in
 * /app/workouts, so this is a real change to their training, not a label.
 */
export async function advanceMemberWorkoutPlan(input: {
  workspaceId: string;
  memberProfileId: string;
  advanceWeeks?: number;
  nextReviewInDays?: number;
}): Promise<{ updated: boolean; currentWeek: number; currentMonth: number }> {
  if (!input.workspaceId || !input.memberProfileId) {
    return { updated: false, currentWeek: 0, currentMonth: 0 };
  }

  const supabase = createServiceSupabaseClient();
  await assertMemberInWorkspace(supabase, input.workspaceId, input.memberProfileId);
  const { data: plan } = await supabase
    .from("assigned_workout_plans")
    .select("id,current_week,current_month")
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return { updated: false, currentWeek: 0, currentMonth: 0 };

  const step = Number.isFinite(input.advanceWeeks) ? Math.trunc(input.advanceWeeks as number) : 1;
  const currentWeek = Math.min(12, Math.max(1, (plan.current_week ?? 1) + step));
  const currentMonth = currentWeek <= 4 ? 1 : currentWeek <= 8 ? 2 : 3;
  const reviewDays = Math.min(60, Math.max(1, input.nextReviewInDays ?? 7));

  const { error } = await supabase
    .from("assigned_workout_plans")
    .update({
      current_week: currentWeek,
      current_month: currentMonth,
      next_review_on: addDays(new Date(), reviewDays),
      review_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", plan.id);

  if (error) throw new Error(`No se pudo avanzar el plan: ${error.message}`);
  return { updated: true, currentWeek, currentMonth };
}
