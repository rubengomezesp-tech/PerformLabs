import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type MealLogStatus = "done" | "skipped" | "swap_requested";

export type MealLogInput = {
  workspaceId: string;
  recipeId: string | null;
  mealSlot: string;
  mealTitle: string;
  status: MealLogStatus;
  satisfaction: number | null;
  requestReason?: string;
  notes: string;
};

export type DailyNutritionInput = {
  workspaceId: string;
  waterGlasses: number;
  hungerLevel: number | null;
  energyLevel: number | null;
  notes: string;
};

export type NutritionDailySummary = {
  completedMeals: number;
  swapRequests: number;
  waterGlasses: number;
  hungerLevel: number | null;
  energyLevel: number | null;
  mealLogs: Array<{
    mealSlot: string;
    status: MealLogStatus;
    satisfaction: number | null;
    notes: string;
  }>;
};

export type MemberMealPlanForToday = {
  planId: string;
  planName: string;
  dayId: string;
  dayTitle: string;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
  waterTargetMl: number | null;
  hideMacros: boolean;
  items: Array<{
    id: string;
    recipeId: string | null;
    mealSlot: string;
    title: string;
    instructions: string;
    ingredients: number;
    tags: string[];
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  }>;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function clampInteger(value: number | null, min: number, max: number) {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

async function getDefaultMemberProfileId(workspaceId: string) {
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return context.memberProfileId;
}

function daysBetween(fromIso?: string | null, toIso = todayIso()) {
  if (!fromIso) return 0;
  const from = new Date(`${fromIso}T00:00:00.000Z`).getTime();
  const to = new Date(`${toIso}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

async function getActiveMealPlanId(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  memberProfileId: string | null,
) {
  if (!memberProfileId) return null;
  const result = await supabase
    .from("assigned_meal_plans")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    console.error("Unable to load active meal plan", result.error.message);
  }

  return result.data?.id ?? null;
}

/**
 * Effective "hide calories & macros" setting for the member's area. Reads the
 * member's own dietary preference; used by recipe pages and any nutrition view
 * that isn't tied to a specific assigned plan. Defaults to visible.
 */
export async function getMemberNutritionVisibility(workspaceId?: string): Promise<{ hideMacros: boolean }> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return { hideMacros: false };

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) return { hideMacros: false };

  const { data } = await supabase
    .from("member_diet_preferences")
    .select("hide_macros")
    .eq("member_profile_id", memberProfileId)
    .maybeSingle();

  return { hideMacros: Boolean(data?.hide_macros) };
}

/** Sets the member's own "hide calories & macros" preference. */
export async function setMemberHideMacros(workspaceId: string, hide: boolean) {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) {
    throw new Error("No se pudo identificar la app del cliente.");
  }

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) {
    throw new Error("Todavía no hay perfil de cliente para guardar la preferencia.");
  }

  const { error } = await (supabase as any)
    .from("member_diet_preferences")
    .upsert(
      { member_profile_id: memberProfileId, hide_macros: hide, updated_at: new Date().toISOString() },
      { onConflict: "member_profile_id" },
    );

  if (error) {
    throw new Error(`No se pudo guardar la preferencia de macros: ${error.message}`);
  }
}

export type FoodDiaryEntry = {
  id: string;
  name: string;
  source: string;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  calories: number | null;
};

/** Free-form food diary entries (Smart Add / manual) for a given day. */
export async function listFoodDiaryEntries(workspaceId?: string, dateInput?: string): Promise<FoodDiaryEntry[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];

  const date = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : todayIso();
  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) return [];

  const { data, error } = await (supabase as any)
    .from("food_diary_entries")
    .select("id,name,source,protein_g,fat_g,carbs_g,calories")
    .eq("member_profile_id", memberProfileId)
    .eq("logged_on", date)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    source: row.source ?? "manual",
    protein: row.protein_g === null || row.protein_g === undefined ? null : Number(row.protein_g),
    fat: row.fat_g === null || row.fat_g === undefined ? null : Number(row.fat_g),
    carbs: row.carbs_g === null || row.carbs_g === undefined ? null : Number(row.carbs_g),
    calories: row.calories === null || row.calories === undefined ? null : Number(row.calories),
  }));
}

export async function addFoodDiaryEntry(input: {
  workspaceId: string;
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  source?: string;
  date?: string;
}) {
  if (!isUuid(input.workspaceId)) {
    throw new Error("No se pudo identificar la app del cliente.");
  }
  const name = input.name.trim();
  if (!name) {
    throw new Error("Falta el nombre de la comida.");
  }

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  if (!memberProfileId) {
    throw new Error("Todavía no hay perfil de cliente.");
  }

  const date = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : todayIso();
  const { error } = await (supabase as any).from("food_diary_entries").insert({
    workspace_id: input.workspaceId,
    member_profile_id: memberProfileId,
    logged_on: date,
    name,
    source: input.source ?? "manual",
    protein_g: input.protein,
    fat_g: input.fat,
    carbs_g: input.carbs,
    calories: input.calories,
  });

  if (error) {
    throw new Error(`No se pudo guardar la comida: ${error.message}`);
  }
}

export async function deleteFoodDiaryEntry(workspaceId: string, entryId: string) {
  if (!isUuid(workspaceId) || !isUuid(entryId)) {
    throw new Error("Entrada no válida.");
  }

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) {
    throw new Error("Todavía no hay perfil de cliente.");
  }

  const { error } = await (supabase as any)
    .from("food_diary_entries")
    .delete()
    .eq("id", entryId)
    .eq("member_profile_id", memberProfileId);

  if (error) {
    throw new Error(`No se pudo eliminar la comida: ${error.message}`);
  }
}

export async function getMemberMealPlanForToday(workspaceId?: string): Promise<MemberMealPlanForToday | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return null;

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) return null;

  const plan = await supabase
    .from("assigned_meal_plans")
    .select("id,name,starts_on,target_calories,target_protein_g,target_carbs_g,target_fat_g,water_target_ml,hide_macros")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (plan.error || !plan.data) {
    if (plan.error && plan.error.code !== "PGRST116") {
      console.error("Unable to load assigned meal plan", plan.error.message);
    }
    return null;
  }

  const activePlan = plan.data;
  const days = await supabase
    .from("assigned_meal_plan_days")
    .select("id,day_number,title,target_calories,target_protein_g,target_carbs_g,target_fat_g")
    .eq("workspace_id", workspaceId)
    .eq("assigned_meal_plan_id", activePlan.id)
    .order("day_number", { ascending: true });

  if (days.error || !days.data?.length) {
    if (days.error) console.error("Unable to load assigned meal days", days.error.message);
    return null;
  }

  const dayIndex = daysBetween(activePlan.starts_on) % days.data.length;
  const activeDay = days.data[dayIndex] ?? days.data[0];
  const items = await supabase
    .from("assigned_meal_plan_items")
    .select("id,recipe_id,meal_slot,title,instructions,calories,protein_g,carbs_g,fat_g,sort_order")
    .eq("workspace_id", workspaceId)
    .eq("assigned_meal_plan_day_id", activeDay.id)
    .order("sort_order", { ascending: true });

  if (items.error) {
    console.error("Unable to load assigned meal items", items.error.message);
  }

  return {
    planId: activePlan.id,
    planName: activePlan.name,
    dayId: activeDay.id,
    dayTitle: activeDay.title ?? `Dia ${activeDay.day_number}`,
    targetCalories: activePlan.hide_macros ? null : activeDay.target_calories ?? activePlan.target_calories,
    targetProteinG: activePlan.hide_macros ? null : activeDay.target_protein_g ?? activePlan.target_protein_g,
    targetCarbsG: activePlan.hide_macros ? null : activeDay.target_carbs_g ?? activePlan.target_carbs_g,
    targetFatG: activePlan.hide_macros ? null : activeDay.target_fat_g ?? activePlan.target_fat_g,
    waterTargetMl: activePlan.water_target_ml,
    hideMacros: activePlan.hide_macros,
    items: (items.data ?? []).map((item) => ({
      id: item.id,
      recipeId: item.recipe_id,
      mealSlot: item.meal_slot,
      title: item.title,
      instructions: item.instructions ?? "Sigue la comida indicada y avisa a tu coach si hay una causa concreta.",
      ingredients: 0,
      tags: ["plan"],
      calories: activePlan.hide_macros ? null : item.calories,
      proteinG: activePlan.hide_macros ? null : item.protein_g,
      carbsG: activePlan.hide_macros ? null : item.carbs_g,
      fatG: activePlan.hide_macros ? null : item.fat_g,
    })),
  };
}

export type ConsumedMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Sum of macros consumed on a given day: the plan meals marked "done" plus any
 * free-form / library diary entries. Pure helper so the meals plan view and the
 * diary can both show consumed-vs-target without duplicating the math.
 */
export function sumConsumedMacros(
  planItems: Array<{ mealSlot: string; calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null }>,
  doneSlots: Set<string>,
  diaryEntries: FoodDiaryEntry[],
): ConsumedMacros {
  const totals: ConsumedMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const item of planItems) {
    if (!doneSlots.has(item.mealSlot)) continue;
    totals.calories += item.calories ?? 0;
    totals.protein += item.proteinG ?? 0;
    totals.carbs += item.carbsG ?? 0;
    totals.fat += item.fatG ?? 0;
  }
  for (const entry of diaryEntries) {
    totals.calories += entry.calories ?? 0;
    totals.protein += entry.protein ?? 0;
    totals.carbs += entry.carbs ?? 0;
    totals.fat += entry.fat ?? 0;
  }
  return totals;
}

export async function getNutritionDailySummary(workspaceId?: string, dateInput?: string): Promise<NutritionDailySummary> {
  const empty: NutritionDailySummary = {
    completedMeals: 0,
    swapRequests: 0,
    waterGlasses: 0,
    hungerLevel: null,
    energyLevel: null,
    mealLogs: [],
  };
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return empty;

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  const date = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : todayIso();

  let mealQuery = (supabase as any)
    .from("member_meal_logs")
    .select("meal_slot,status,satisfaction,notes")
    .eq("workspace_id", workspaceId)
    .eq("logged_on", date);

  let dailyQuery = (supabase as any)
    .from("member_nutrition_daily_logs")
    .select("water_glasses,hunger_level,energy_level,notes")
    .eq("workspace_id", workspaceId)
    .eq("logged_on", date);

  if (memberProfileId) {
    mealQuery = mealQuery.eq("member_profile_id", memberProfileId);
    dailyQuery = dailyQuery.eq("member_profile_id", memberProfileId);
  }

  const [mealsResult, dailyResult] = await Promise.all([
    mealQuery,
    dailyQuery.maybeSingle(),
  ]);

  if (mealsResult.error) {
    console.error("Unable to load meal logs", mealsResult.error.message);
  }

  if (dailyResult.error && dailyResult.error.code !== "PGRST116") {
    console.error("Unable to load nutrition daily log", dailyResult.error.message);
  }

  const mealLogs = (mealsResult.data ?? []).map((log: any) => ({
    mealSlot: String(log.meal_slot ?? ""),
    status: (log.status ?? "done") as MealLogStatus,
    satisfaction: typeof log.satisfaction === "number" ? log.satisfaction : null,
    notes: log.notes ?? "",
  }));

  return {
    completedMeals: mealLogs.filter((log: NutritionDailySummary["mealLogs"][number]) => log.status === "done").length,
    swapRequests: mealLogs.filter((log: NutritionDailySummary["mealLogs"][number]) => log.status === "swap_requested").length,
    waterGlasses: dailyResult.data?.water_glasses ?? 0,
    hungerLevel: dailyResult.data?.hunger_level ?? null,
    energyLevel: dailyResult.data?.energy_level ?? null,
    mealLogs,
  };
}

export async function upsertMealLog(input: MealLogInput) {
  if (!isUuid(input.workspaceId)) {
    throw new Error("No se pudo identificar la app del cliente.");
  }
  const mealSlot = input.mealSlot.trim();
  const mealTitle = input.mealTitle.trim();
  if (!mealSlot || !mealTitle) {
    throw new Error("Falta la comida que quieres registrar.");
  }

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  const activeMealPlanId = await getActiveMealPlanId(supabase, input.workspaceId, memberProfileId);
  const date = todayIso();
  const requestReason = input.requestReason?.trim() ?? "";
  const noteText = input.notes.trim();
  const notes = input.status === "swap_requested"
    ? [requestReason ? `Motivo: ${requestReason}` : "", noteText].filter(Boolean).join(" · ")
    : noteText;
  const payload = {
    workspace_id: input.workspaceId,
    member_profile_id: memberProfileId,
    assigned_meal_plan_id: activeMealPlanId,
    recipe_id: isUuid(input.recipeId) ? input.recipeId : null,
    logged_on: date,
    meal_slot: mealSlot,
    meal_title: mealTitle,
    status: input.status,
    satisfaction: clampInteger(input.satisfaction, 1, 5),
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabase as any)
    .from("member_meal_logs")
    .upsert(payload, {
      onConflict: "workspace_id,member_profile_id,logged_on,meal_slot",
    });

  if (error) {
    throw new Error(`No se pudo guardar la comida: ${error.message}`);
  }

  if (memberProfileId) {
    const event = await supabase.from("member_activity_events").insert({
      workspace_id: input.workspaceId,
      member_profile_id: memberProfileId,
      event_type: "meal_logged",
      source: "member_app",
      metadata: {
        mealSlot,
        mealTitle,
        status: input.status,
        requestReason: requestReason || null,
        notes: notes || null,
        assignedMealPlanId: activeMealPlanId,
      },
    });

    if (event.error) {
      console.error("Unable to log meal activity", event.error.message);
    }
  }
}

export async function upsertDailyNutritionLog(input: DailyNutritionInput) {
  if (!isUuid(input.workspaceId)) {
    throw new Error("No se pudo identificar la app del cliente.");
  }

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  const payload = {
    workspace_id: input.workspaceId,
    member_profile_id: memberProfileId,
    logged_on: todayIso(),
    water_glasses: clampInteger(input.waterGlasses, 0, 20) ?? 0,
    hunger_level: clampInteger(input.hungerLevel, 1, 5),
    energy_level: clampInteger(input.energyLevel, 1, 5),
    notes: input.notes.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabase as any)
    .from("member_nutrition_daily_logs")
    .upsert(payload, {
      onConflict: "workspace_id,member_profile_id,logged_on",
    });

  if (error) {
    throw new Error(`No se pudo guardar el seguimiento: ${error.message}`);
  }

  if (memberProfileId) {
    const event = await supabase.from("member_activity_events").insert({
      workspace_id: input.workspaceId,
      member_profile_id: memberProfileId,
      event_type: "nutrition_day_logged",
      source: "member_app",
      metadata: {
        waterGlasses: payload.water_glasses,
        hungerLevel: payload.hunger_level,
        energyLevel: payload.energy_level,
      },
    });

    if (event.error) {
      console.error("Unable to log nutrition activity", event.error.message);
    }
  }
}
