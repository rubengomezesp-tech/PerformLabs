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
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function getNutritionDailySummary(workspaceId?: string): Promise<NutritionDailySummary> {
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
  const date = todayIso();

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
  const date = todayIso();
  const payload = {
    workspace_id: input.workspaceId,
    member_profile_id: memberProfileId,
    recipe_id: isUuid(input.recipeId) ? input.recipeId : null,
    logged_on: date,
    meal_slot: mealSlot,
    meal_title: mealTitle,
    status: input.status,
    satisfaction: clampInteger(input.satisfaction, 1, 5),
    notes: input.notes.trim() || null,
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
}
