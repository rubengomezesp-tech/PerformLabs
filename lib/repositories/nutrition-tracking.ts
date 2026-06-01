import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

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

/**
 * A single alternative the member can pick for a meal. Either references a real
 * brand recipe (recipeId set, so picking it actually swaps the plan item) or is a
 * derived suggestion (recipeId null — informational, "ask your coach"). Macros are
 * always carried so the UI can show the trade-off and respect hide-macros.
 */
export type MealSwapOption = {
  recipeId: string | null;
  title: string;
  note: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  /** true when this swap is the one currently assigned to the meal. */
  selected: boolean;
};

export type MemberMealPlanItem = {
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
  swapOptions: MealSwapOption[];
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
  items: MemberMealPlanItem[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

/**
 * The member's REAL scope, resolved from their verified session. Tolerant of a
 * bad/zero-UUID workspace hint — the brand can transiently resolve to the
 * synthetic fallback brand, but the member still owns exactly one workspace, so
 * we trust getMemberContext. Queries MUST use the returned workspaceId (never the
 * raw hint) so a flaky brand lookup can't hide the member's own data.
 */
async function resolveMemberScope(
  workspaceIdHint?: string,
): Promise<{ workspaceId: string; memberProfileId: string } | null> {
  const context = await getMemberContext(workspaceIdHint ?? "");
  if (!context) return null;
  return { workspaceId: context.workspaceId, memberProfileId: context.memberProfileId };
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
  if (!env.ok) return { hideMacros: false };

  const supabase = createServiceSupabaseClient();
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) return { hideMacros: false };

  const { data } = await supabase
    .from("member_diet_preferences")
    .select("hide_macros")
    .eq("member_profile_id", scope.memberProfileId)
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

  const { error } = await supabase
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

export type ConsumedMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Single source of truth for "what has the member actually eaten today".
 *
 * Sums the macros of (a) plan items whose meal slot is marked done and
 * (b) free-form food diary entries (Smart Add / photo / manual). Kept as a pure
 * function so the meals page, the diary and any future surface all agree to the
 * gram — feed it the day's plan items, the set of done slots, and the diary rows.
 *
 * @param planItems  The day's assigned meal items (with per-meal macros).
 * @param doneSlots  Meal slots the member has completed today (e.g. from meal logs).
 * @param diaryEntries  Free-form diary entries logged outside the plan.
 */
export function sumConsumedMacros(
  planItems: Array<{
    mealSlot: string;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  }>,
  doneSlots: Iterable<string>,
  diaryEntries: Array<Pick<FoodDiaryEntry, "calories" | "protein" | "carbs" | "fat">>,
): ConsumedMacros {
  const done = doneSlots instanceof Set ? doneSlots : new Set(doneSlots);
  const totals: ConsumedMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const item of planItems) {
    if (!done.has(item.mealSlot)) continue;
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

/** Free-form food diary entries (Smart Add / manual) for a given day. */
export async function listFoodDiaryEntries(workspaceId?: string, dateInput?: string): Promise<FoodDiaryEntry[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const date = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : todayIso();
  const supabase = createServiceSupabaseClient();
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) return [];

  const { data, error } = await supabase
    .from("food_diary_entries")
    .select("id,name,source,protein_g,fat_g,carbs_g,calories")
    .eq("member_profile_id", scope.memberProfileId)
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
  const { error } = await supabase.from("food_diary_entries").insert({
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

  const { error } = await supabase
    .from("food_diary_entries")
    .delete()
    .eq("id", entryId)
    .eq("member_profile_id", memberProfileId);

  if (error) {
    throw new Error(`No se pudo eliminar la comida: ${error.message}`);
  }
}

type RecipeLite = {
  id: string;
  name: string;
  mealSlot: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

/** Normalises a stored swap_options jsonb entry (coach-authored) into a MealSwapOption shape. */
function normaliseStoredSwap(raw: any): MealSwapOption | null {
  if (!raw || typeof raw !== "object") return null;
  const title = String(raw.title ?? raw.name ?? "").trim();
  if (!title) return null;
  const num = (value: unknown) =>
    value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
  return {
    recipeId: typeof raw.recipeId === "string" ? raw.recipeId : typeof raw.recipe_id === "string" ? raw.recipe_id : null,
    title,
    note: typeof raw.note === "string" && raw.note.trim() ? raw.note.trim() : typeof raw.reason === "string" && raw.reason.trim() ? raw.reason.trim() : null,
    calories: num(raw.calories),
    proteinG: num(raw.proteinG ?? raw.protein_g),
    carbsG: num(raw.carbsG ?? raw.carbs_g),
    fatG: num(raw.fatG ?? raw.fat_g),
    selected: false,
  };
}

/**
 * Derives up to `limit` sensible alternatives for a meal when the coach hasn't
 * authored explicit swap_options. Picks brand recipes that share the meal slot and
 * sit closest in calories to the assigned meal (so macros stay comparable). Excludes
 * the meal's own recipe. Pure & deterministic so the same meal always offers the
 * same alternatives within a render.
 */
function deriveSwapOptions(
  item: { recipeId: string | null; mealSlot: string; calories: number | null },
  recipes: RecipeLite[],
  limit = 3,
): MealSwapOption[] {
  const slot = (item.mealSlot ?? "").trim().toLowerCase();
  const target = item.calories ?? null;
  const candidates = recipes
    .filter((recipe) => recipe.id !== item.recipeId)
    .filter((recipe) => !slot || (recipe.mealSlot ?? "").trim().toLowerCase() === slot);

  candidates.sort((a, b) => {
    if (target !== null && a.calories !== null && b.calories !== null) {
      const diff = Math.abs(a.calories - target) - Math.abs(b.calories - target);
      if (diff !== 0) return diff;
    }
    return a.name.localeCompare(b.name);
  });

  return candidates.slice(0, limit).map((recipe) => ({
    recipeId: recipe.id,
    title: recipe.name,
    note: target !== null && recipe.calories !== null
      ? recipe.calories === target
        ? "Mismas calorías"
        : `${recipe.calories > target ? "+" : "−"}${Math.abs(recipe.calories - target)} kcal`
      : "Misma franja",
    calories: recipe.calories,
    proteinG: recipe.proteinG,
    carbsG: recipe.carbsG,
    fatG: recipe.fatG,
    selected: false,
  }));
}

/**
 * Builds the member-facing swap options for an assigned meal item:
 *  1. Coach-authored stored options (swap_options jsonb) take priority.
 *  2. Otherwise derive 2–3 alternatives from brand recipes in the same slot.
 * Marks the option matching the item's current recipe as `selected`. Honours
 * hide-macros by nulling per-option macros.
 */
export function buildMealSwapOptions(
  item: { recipeId: string | null; mealSlot: string; calories: number | null },
  storedRaw: unknown,
  recipes: RecipeLite[],
  hideMacros: boolean,
): MealSwapOption[] {
  const stored = Array.isArray(storedRaw)
    ? storedRaw.map(normaliseStoredSwap).filter((option): option is MealSwapOption => option !== null)
    : [];
  const options = stored.length ? stored : deriveSwapOptions(item, recipes);
  return options.map((option) => ({
    ...option,
    selected: !!option.recipeId && option.recipeId === item.recipeId,
    calories: hideMacros ? null : option.calories,
    proteinG: hideMacros ? null : option.proteinG,
    carbsG: hideMacros ? null : option.carbsG,
    fatG: hideMacros ? null : option.fatG,
  }));
}

export async function getMemberMealPlanForToday(workspaceId?: string): Promise<MemberMealPlanForToday | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return null;

  const supabase = createServiceSupabaseClient();
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) return null;
  const { workspaceId: ws, memberProfileId } = scope;

  const plan = await supabase
    .from("assigned_meal_plans")
    .select("id,name,starts_on,target_calories,target_protein_g,target_carbs_g,target_fat_g,water_target_ml,hide_macros")
    .eq("workspace_id", ws)
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
    .eq("workspace_id", ws)
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
    .select("id,recipe_id,meal_slot,title,instructions,calories,protein_g,carbs_g,fat_g,swap_options,sort_order")
    .eq("workspace_id", ws)
    .eq("assigned_meal_plan_day_id", activeDay.id)
    .order("sort_order", { ascending: true });

  if (items.error) {
    console.error("Unable to load assigned meal items", items.error.message);
  }

  const recipeOptions = await loadRecipeSwapPool(supabase, ws);

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
      swapOptions: buildMealSwapOptions(
        { recipeId: item.recipe_id, mealSlot: item.meal_slot, calories: item.calories },
        (item as any).swap_options,
        recipeOptions,
        activePlan.hide_macros,
      ),
    })),
  };
}

/**
 * Loads a small pool of brand + base recipes (with computed macros) used to derive
 * meal swap suggestions when a meal has no coach-authored swap_options. Mirrors the
 * macro aggregation in listManagedRecipes but stays light (only the fields the swap
 * picker needs) so the meals page server render isn't slowed down.
 */
async function loadRecipeSwapPool(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
): Promise<RecipeLite[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("id,name,meal_slot")
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error || !data?.length) {
    if (error) console.error("Unable to load recipe swap pool", error.message);
    return [];
  }

  const ids = data.map((recipe) => recipe.id);
  const links = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,grams,ingredients(calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g)")
    .in("recipe_id", ids);

  const macros = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
  for (const link of links.data ?? []) {
    const ingredient = (link as any).ingredients as {
      calories_per_100g?: number;
      protein_per_100g?: number;
      carbs_per_100g?: number;
      fat_per_100g?: number;
    } | null;
    const ratio = Number((link as any).grams) / 100;
    const current = macros.get((link as any).recipe_id) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    current.calories += (ingredient?.calories_per_100g ?? 0) * ratio;
    current.protein += (ingredient?.protein_per_100g ?? 0) * ratio;
    current.carbs += (ingredient?.carbs_per_100g ?? 0) * ratio;
    current.fat += (ingredient?.fat_per_100g ?? 0) * ratio;
    macros.set((link as any).recipe_id, current);
  }

  return data.map((recipe) => {
    const m = macros.get(recipe.id);
    return {
      id: recipe.id,
      name: recipe.name,
      mealSlot: recipe.meal_slot,
      calories: m ? Math.round(m.calories) : null,
      proteinG: m ? Math.round(m.protein) : null,
      carbsG: m ? Math.round(m.carbs) : null,
      fatG: m ? Math.round(m.fat) : null,
    };
  });
}

export type MemberMealPlanDay = {
  dayId: string;
  dayNumber: number;
  dayTitle: string;
  isToday: boolean;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
  items: Array<{
    id: string;
    mealSlot: string;
    title: string;
    instructions: string;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  }>;
};

export type MemberMealPlanWeek = {
  planId: string;
  planName: string;
  waterTargetMl: number | null;
  hideMacros: boolean;
  days: MemberMealPlanDay[];
};

/**
 * The member's full active plan (every day, in order) for the printable / PDF
 * export. Marks the day that is "today" in the rotation so the print view can
 * highlight it. Honours hide-macros (nulls every macro). Uses resolveMemberScope so
 * a flaky brand hint can't hide the member's own plan.
 */
export async function getMemberMealPlanWeek(workspaceId?: string): Promise<MemberMealPlanWeek | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return null;

  const supabase = createServiceSupabaseClient();
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) return null;
  const { workspaceId: ws, memberProfileId } = scope;

  const plan = await supabase
    .from("assigned_meal_plans")
    .select("id,name,starts_on,water_target_ml,hide_macros")
    .eq("workspace_id", ws)
    .eq("member_profile_id", memberProfileId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (plan.error || !plan.data) return null;
  const activePlan = plan.data;

  const days = await supabase
    .from("assigned_meal_plan_days")
    .select("id,day_number,title,target_calories,target_protein_g,target_carbs_g,target_fat_g")
    .eq("workspace_id", ws)
    .eq("assigned_meal_plan_id", activePlan.id)
    .order("day_number", { ascending: true });

  if (days.error || !days.data?.length) return null;

  const todayIndex = daysBetween(activePlan.starts_on) % days.data.length;
  const todayId = days.data[todayIndex]?.id ?? days.data[0].id;
  const dayIds = days.data.map((day) => day.id);

  const items = await supabase
    .from("assigned_meal_plan_items")
    .select("id,assigned_meal_plan_day_id,meal_slot,title,instructions,calories,protein_g,carbs_g,fat_g,sort_order")
    .eq("workspace_id", ws)
    .in("assigned_meal_plan_day_id", dayIds)
    .order("sort_order", { ascending: true });

  if (items.error) console.error("Unable to load plan week items", items.error.message);

  const hide = Boolean(activePlan.hide_macros);
  const itemsByDay = new Map<string, MemberMealPlanDay["items"]>();
  for (const item of items.data ?? []) {
    const current = itemsByDay.get(item.assigned_meal_plan_day_id) ?? [];
    current.push({
      id: item.id,
      mealSlot: item.meal_slot,
      title: item.title,
      instructions: item.instructions ?? "",
      calories: hide ? null : item.calories,
      proteinG: hide ? null : item.protein_g,
      carbsG: hide ? null : item.carbs_g,
      fatG: hide ? null : item.fat_g,
    });
    itemsByDay.set(item.assigned_meal_plan_day_id, current);
  }

  return {
    planId: activePlan.id,
    planName: activePlan.name,
    waterTargetMl: activePlan.water_target_ml,
    hideMacros: hide,
    days: days.data.map((day) => ({
      dayId: day.id,
      dayNumber: day.day_number,
      dayTitle: day.title ?? `Día ${day.day_number}`,
      isToday: day.id === todayId,
      targetCalories: hide ? null : day.target_calories,
      targetProteinG: hide ? null : day.target_protein_g,
      targetCarbsG: hide ? null : day.target_carbs_g,
      targetFatG: hide ? null : day.target_fat_g,
      items: itemsByDay.get(day.id) ?? [],
    })),
  };
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
  if (!env.ok) return empty;

  const supabase = createServiceSupabaseClient();
  const scope = await resolveMemberScope(workspaceId);
  const memberProfileId = scope?.memberProfileId ?? null;
  const ws = scope?.workspaceId ?? workspaceId;
  if (!ws) return empty;
  const date = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : todayIso();

  let mealQuery = supabase
    .from("member_meal_logs")
    .select("meal_slot,status,satisfaction,notes")
    .eq("workspace_id", ws)
    .eq("logged_on", date);

  let dailyQuery = supabase
    .from("member_nutrition_daily_logs")
    .select("water_glasses,hunger_level,energy_level,notes")
    .eq("workspace_id", ws)
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

  const { error } = await supabase
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

/**
 * Quick-log a single glass of water for today against the member's daily
 * nutrition log. Reads the current count and upserts +1 (clamped 0..20), without
 * touching hunger/energy/notes. Mirrors the consumed-water store used by the
 * meals water ring and the daily summary.
 */
export async function logWaterGlass(workspaceId: string, delta = 1) {
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) {
    throw new Error("Todavía no hay perfil de cliente.");
  }
  const { workspaceId: ws, memberProfileId } = scope;

  const supabase = createServiceSupabaseClient();
  const date = todayIso();
  const { data: existing } = await supabase
    .from("member_nutrition_daily_logs")
    .select("water_glasses")
    .eq("workspace_id", ws)
    .eq("member_profile_id", memberProfileId)
    .eq("logged_on", date)
    .maybeSingle();

  const current = typeof existing?.water_glasses === "number" ? existing.water_glasses : 0;
  const next = clampInteger(current + delta, 0, 20) ?? 0;

  const { error } = await supabase
    .from("member_nutrition_daily_logs")
    .upsert(
      {
        workspace_id: ws,
        member_profile_id: memberProfileId,
        logged_on: date,
        water_glasses: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,member_profile_id,logged_on" },
    );

  if (error) {
    throw new Error(`No se pudo registrar el agua: ${error.message}`);
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

  const { error } = await supabase
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
