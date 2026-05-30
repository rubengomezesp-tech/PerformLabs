import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { addFoodDiaryEntry } from "@/lib/repositories/nutrition-tracking";

export type FoodCategory =
  | "protein"
  | "carb"
  | "fat"
  | "dairy"
  | "veg"
  | "fruit"
  | "snack"
  | "drink"
  | "other";

export type FoodItem = {
  id: string;
  name: string;
  brand: string;
  servingLabel: string;
  category: FoodCategory;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  /** True when the row is a built-in starter food (not yet a real DB row). */
  isStarter: boolean;
};

export type MemberFoodItem = FoodItem & { favorite: boolean };

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  protein: "Proteína",
  carb: "Carbohidrato",
  fat: "Grasas",
  dairy: "Lácteos",
  veg: "Verduras",
  fruit: "Fruta",
  snack: "Snack",
  drink: "Bebida",
  other: "Otros",
};

export const CATEGORY_ORDER: FoodCategory[] = [
  "protein",
  "carb",
  "fat",
  "dairy",
  "veg",
  "fruit",
  "snack",
  "drink",
  "other",
];

type StarterFood = Omit<FoodItem, "id" | "isStarter">;

// A clean, common starter database (per the labeled serving). White-label
// workspaces ship with this so members can log from day one; the coach can
// load it as editable rows ("Cargar alimentos base") and tweak from there.
const STARTER_FOODS: StarterFood[] = [
  { name: "Pechuga de pollo a la plancha", brand: "", servingLabel: "100 g", category: "protein", protein: 31, fat: 3.6, carbs: 0, calories: 165 },
  { name: "Pechuga de pavo", brand: "", servingLabel: "100 g", category: "protein", protein: 29, fat: 1, carbs: 0, calories: 135 },
  { name: "Huevo entero", brand: "", servingLabel: "1 huevo (55 g)", category: "protein", protein: 6.3, fat: 5, carbs: 0.4, calories: 72 },
  { name: "Claras de huevo", brand: "", servingLabel: "100 g", category: "protein", protein: 11, fat: 0.2, carbs: 0.7, calories: 52 },
  { name: "Atún al natural", brand: "", servingLabel: "100 g", category: "protein", protein: 26, fat: 1, carbs: 0, calories: 116 },
  { name: "Salmón", brand: "", servingLabel: "100 g", category: "protein", protein: 20, fat: 13, carbs: 0, calories: 208 },
  { name: "Merluza", brand: "", servingLabel: "100 g", category: "protein", protein: 17, fat: 2, carbs: 0, calories: 90 },
  { name: "Ternera magra", brand: "", servingLabel: "100 g", category: "protein", protein: 26, fat: 10, carbs: 0, calories: 187 },
  { name: "Gambas", brand: "", servingLabel: "100 g", category: "protein", protein: 24, fat: 0.3, carbs: 0.2, calories: 99 },
  { name: "Tofu firme", brand: "", servingLabel: "100 g", category: "protein", protein: 8, fat: 4.8, carbs: 1.9, calories: 76 },
  { name: "Proteína whey", brand: "", servingLabel: "1 scoop (30 g)", category: "protein", protein: 24, fat: 1.5, carbs: 2, calories: 120 },
  { name: "Arroz blanco cocido", brand: "", servingLabel: "100 g", category: "carb", protein: 2.7, fat: 0.3, carbs: 28, calories: 130 },
  { name: "Arroz integral cocido", brand: "", servingLabel: "100 g", category: "carb", protein: 2.6, fat: 0.9, carbs: 23, calories: 112 },
  { name: "Pasta cocida", brand: "", servingLabel: "100 g", category: "carb", protein: 5, fat: 1.1, carbs: 25, calories: 131 },
  { name: "Patata cocida", brand: "", servingLabel: "100 g", category: "carb", protein: 2, fat: 0.1, carbs: 17, calories: 77 },
  { name: "Boniato", brand: "", servingLabel: "100 g", category: "carb", protein: 1.6, fat: 0.1, carbs: 20, calories: 86 },
  { name: "Pan integral", brand: "", servingLabel: "1 rebanada (30 g)", category: "carb", protein: 3.6, fat: 1, carbs: 13, calories: 75 },
  { name: "Avena", brand: "", servingLabel: "40 g", category: "carb", protein: 5.2, fat: 2.8, carbs: 26, calories: 150 },
  { name: "Quinoa cocida", brand: "", servingLabel: "100 g", category: "carb", protein: 4.4, fat: 1.9, carbs: 21, calories: 120 },
  { name: "Lentejas cocidas", brand: "", servingLabel: "100 g", category: "carb", protein: 9, fat: 0.4, carbs: 20, calories: 116 },
  { name: "Garbanzos cocidos", brand: "", servingLabel: "100 g", category: "carb", protein: 8.9, fat: 2.6, carbs: 27, calories: 164 },
  { name: "Aceite de oliva virgen extra", brand: "", servingLabel: "1 cucharada (10 g)", category: "fat", protein: 0, fat: 10, carbs: 0, calories: 90 },
  { name: "Aguacate", brand: "", servingLabel: "1/2 (75 g)", category: "fat", protein: 1.5, fat: 11, carbs: 6, calories: 120 },
  { name: "Almendras", brand: "", servingLabel: "30 g", category: "fat", protein: 6.4, fat: 15.5, carbs: 6.5, calories: 174 },
  { name: "Nueces", brand: "", servingLabel: "30 g", category: "fat", protein: 4.6, fat: 19.6, carbs: 4.1, calories: 196 },
  { name: "Mantequilla de cacahuete", brand: "", servingLabel: "1 cucharada (16 g)", category: "fat", protein: 4, fat: 8, carbs: 3, calories: 96 },
  { name: "Leche desnatada", brand: "", servingLabel: "200 ml", category: "dairy", protein: 7, fat: 0.2, carbs: 10, calories: 70 },
  { name: "Yogur griego natural", brand: "", servingLabel: "100 g", category: "dairy", protein: 9, fat: 5, carbs: 4, calories: 97 },
  { name: "Queso batido 0%", brand: "", servingLabel: "100 g", category: "dairy", protein: 8, fat: 0, carbs: 4, calories: 48 },
  { name: "Requesón", brand: "", servingLabel: "100 g", category: "dairy", protein: 11, fat: 4.3, carbs: 3.4, calories: 98 },
  { name: "Brócoli", brand: "", servingLabel: "100 g", category: "veg", protein: 2.8, fat: 0.4, carbs: 7, calories: 34 },
  { name: "Espinacas", brand: "", servingLabel: "100 g", category: "veg", protein: 2.9, fat: 0.4, carbs: 3.6, calories: 23 },
  { name: "Tomate", brand: "", servingLabel: "100 g", category: "veg", protein: 0.9, fat: 0.2, carbs: 3.9, calories: 18 },
  { name: "Plátano", brand: "", servingLabel: "1 (120 g)", category: "fruit", protein: 1.3, fat: 0.4, carbs: 27, calories: 105 },
  { name: "Manzana", brand: "", servingLabel: "1 (180 g)", category: "fruit", protein: 0.5, fat: 0.3, carbs: 25, calories: 95 },
  { name: "Chocolate negro 85%", brand: "", servingLabel: "20 g", category: "snack", protein: 2, fat: 9, carbs: 6, calories: 119 },
];

function starterId(index: number) {
  return `starter-${index}`;
}

function starterItems(): FoodItem[] {
  return STARTER_FOODS.map((food, index) => ({ ...food, id: starterId(index), isStarter: true }));
}

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCategory(value: unknown): FoodCategory {
  return CATEGORY_ORDER.includes(value as FoodCategory) ? (value as FoodCategory) : "other";
}

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0;
}

function matchesQuery(food: { name: string; brand: string }, query: string): boolean {
  if (!query) return true;
  const haystack = `${food.name} ${food.brand}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

async function getDefaultMemberId(workspaceId: string): Promise<string | null> {
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return context.memberProfileId;
}

function mapRow(row: any): FoodItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? "",
    servingLabel: row.serving_label ?? "100 g",
    category: normalizeCategory(row.category),
    protein: Number(row.protein_g ?? 0),
    fat: Number(row.fat_g ?? 0),
    carbs: Number(row.carbs_g ?? 0),
    calories: Number(row.calories ?? 0),
    isStarter: false,
  };
}

/**
 * The effective food library: the workspace's own rows, or the built-in starter
 * database when the workspace hasn't created any yet (so members always have
 * something to log). Optional `query` filters by name/brand.
 */
export async function listFoodLibrary(workspaceId?: string, query = ""): Promise<FoodItem[]> {
  const trimmed = query.trim();
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) {
    return starterItems().filter((food) => matchesQuery(food, trimmed));
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("food_library_items")
    .select("id,name,brand,serving_label,category,protein_g,fat_g,carbs_g,calories,sort_order")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(400);

  if (error || !data?.length) {
    if (error) console.error("Unable to load food library", error.message);
    return starterItems().filter((food) => matchesQuery(food, trimmed));
  }

  return data.map(mapRow).filter((food: FoodItem) => matchesQuery(food, trimmed));
}

/** Member view: the library split into favorites + the rest, with a favorite flag. */
export async function listMemberFoodLibrary(
  workspaceId?: string,
  query = "",
): Promise<{ favorites: MemberFoodItem[]; items: MemberFoodItem[]; isFallback: boolean }> {
  const items = await listFoodLibrary(workspaceId, query);
  const isFallback = items.length > 0 && items.every((food) => food.isStarter);

  let favoriteIds = new Set<string>();
  if (isUuid(workspaceId) && !isFallback) {
    const memberId = await getDefaultMemberId(workspaceId);
    if (memberId) {
      const supabase = createServiceSupabaseClient();
      const { data } = await (supabase as any)
        .from("member_food_favorites")
        .select("food_item_id")
        .eq("member_profile_id", memberId);
      favoriteIds = new Set<string>((data ?? []).map((row: { food_item_id: string }) => row.food_item_id));
    }
  }

  const marked: MemberFoodItem[] = items.map((food) => ({ ...food, favorite: favoriteIds.has(food.id) }));
  return {
    favorites: marked.filter((food) => food.favorite),
    items: marked.filter((food) => !food.favorite),
    isFallback,
  };
}

export async function createFoodItem(input: {
  workspaceId: string;
  name: string;
  brand: string;
  servingLabel: string;
  category: FoodCategory;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}): Promise<void> {
  if (!isUuid(input.workspaceId)) throw new Error("No se pudo identificar la marca.");
  if (!input.name.trim()) throw new Error("El alimento necesita un nombre.");

  const protein = nonNegative(input.protein);
  const fat = nonNegative(input.fat);
  const carbs = nonNegative(input.carbs);
  // If calories aren't given, estimate from macros (4/4/9) so the row is usable.
  const calories = input.calories > 0 ? nonNegative(input.calories) : Math.round(protein * 4 + carbs * 4 + fat * 9);

  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any).from("food_library_items").insert({
    workspace_id: input.workspaceId,
    name: input.name.trim().slice(0, 120),
    brand: input.brand.trim().slice(0, 80) || null,
    serving_label: (input.servingLabel.trim() || "100 g").slice(0, 40),
    category: normalizeCategory(input.category),
    protein_g: protein,
    fat_g: fat,
    carbs_g: carbs,
    calories,
  });
  if (error) throw new Error(`No se pudo crear el alimento: ${error.message}`);
}

export async function deleteFoodItem(workspaceId: string, foodId: string): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(foodId)) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any).from("food_library_items").delete().eq("workspace_id", workspaceId).eq("id", foodId);
}

/** Loads the built-in starter foods as editable rows. No-op if the library already has rows. */
export async function seedStarterFoods(workspaceId: string): Promise<number> {
  if (!isUuid(workspaceId)) return 0;
  const supabase = createServiceSupabaseClient();
  const existing = await (supabase as any)
    .from("food_library_items")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1);
  if (existing.data?.length) return 0;

  const rows = STARTER_FOODS.map((food, index) => ({
    workspace_id: workspaceId,
    name: food.name,
    brand: food.brand || null,
    serving_label: food.servingLabel,
    category: food.category,
    protein_g: food.protein,
    fat_g: food.fat,
    carbs_g: food.carbs,
    calories: food.calories,
    sort_order: index,
  }));

  const { error } = await (supabase as any).from("food_library_items").insert(rows);
  if (error) throw new Error(`No se pudieron cargar los alimentos base: ${error.message}`);
  return rows.length;
}

export async function toggleFoodFavorite(workspaceId: string, foodId: string): Promise<void> {
  // Favorites are only for real library rows; starter foods aren't favoritable.
  if (!isUuid(workspaceId) || !isUuid(foodId)) return;
  const memberId = await getDefaultMemberId(workspaceId);
  if (!memberId) return;
  const supabase = createServiceSupabaseClient();

  const existing = await (supabase as any)
    .from("member_food_favorites")
    .select("id")
    .eq("member_profile_id", memberId)
    .eq("food_item_id", foodId)
    .maybeSingle();

  if (existing.data?.id) {
    await (supabase as any).from("member_food_favorites").delete().eq("id", existing.data.id);
    return;
  }
  await (supabase as any).from("member_food_favorites").insert({
    workspace_id: workspaceId,
    member_profile_id: memberId,
    food_item_id: foodId,
  });
}

async function resolveFood(workspaceId: string, foodId: string): Promise<FoodItem | null> {
  if (foodId.startsWith("starter-")) {
    const index = Number(foodId.slice("starter-".length));
    const food = STARTER_FOODS[index];
    return food ? { ...food, id: foodId, isStarter: true } : null;
  }
  if (!isUuid(foodId)) return null;
  const supabase = createServiceSupabaseClient();
  const { data } = await (supabase as any)
    .from("food_library_items")
    .select("id,name,brand,serving_label,category,protein_g,fat_g,carbs_g,calories")
    .eq("workspace_id", workspaceId)
    .eq("id", foodId)
    .maybeSingle();
  return data ? mapRow(data) : null;
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 100) / 100);
}

/** Logs a library food into the diary, scaling macros by quantity (servings). */
export async function quickAddFood(
  workspaceId: string,
  foodId: string,
  quantityInput: number,
  date?: string,
): Promise<void> {
  if (!isUuid(workspaceId)) throw new Error("No se pudo identificar la app del cliente.");
  const quantity = Number.isFinite(quantityInput) && quantityInput > 0 ? Math.min(20, quantityInput) : 1;
  const food = await resolveFood(workspaceId, foodId);
  if (!food) throw new Error("Alimento no encontrado.");

  const round1 = (value: number) => Math.round(value * quantity * 10) / 10;
  const name =
    quantity === 1
      ? `${food.name} (${food.servingLabel})`
      : `${food.name} · ${formatQuantity(quantity)}× ${food.servingLabel}`;

  await addFoodDiaryEntry({
    workspaceId,
    name,
    protein: round1(food.protein),
    fat: round1(food.fat),
    carbs: round1(food.carbs),
    calories: Math.round(food.calories * quantity),
    source: "library",
    date,
  });
}
