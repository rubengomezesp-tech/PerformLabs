import { dietTemplateCategories, meals } from "@/lib/data";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type ManagedDietCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  templates: number;
};

export type ManagedDietTemplate = {
  id: string;
  name: string;
  goal: string;
  caloriesMin: number | null;
  caloriesMax: number | null;
  proteinRatio: number | null;
  carbsRatio: number | null;
  fatRatio: number | null;
  tags: string[];
  status: string;
};

export type ManagedIngredient = {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  allergens: string[];
  tags: string[];
  isBase?: boolean;
};

export type ManagedRecipe = {
  id: string;
  name: string;
  mealSlot: string;
  instructions: string;
  tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Array<{
    name: string;
    grams: number;
  }>;
  isBase?: boolean;
};

export type DietCategoryInput = {
  workspaceId: string;
  name: string;
  description: string;
};

export type DietTemplateInput = {
  workspaceId: string;
  categoryId: string;
  name: string;
  goal: string;
  caloriesMin: string;
  caloriesMax: string;
  proteinRatio: string;
  carbsRatio: string;
  fatRatio: string;
  tags: string;
};

export type IngredientInput = {
  workspaceId: string;
  name: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
  allergens: string;
  tags: string;
};

export type RecipeInput = {
  workspaceId: string;
  categoryId: string;
  name: string;
  mealSlot: string;
  instructions: string;
  tags: string;
};

export type RecipeIngredientInput = {
  recipeId: string;
  ingredientId: string;
  grams: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFloatValue(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseRatio(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 1 ? parsed / 100 : parsed;
}

function isUuid(value?: string): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function fallbackCategories(): ManagedDietCategory[] {
  return dietTemplateCategories.map((category) => ({
    id: category.name,
    name: category.name,
    slug: slugify(category.name),
    description: category.description,
    templates: category.templates,
  }));
}

function fallbackTemplates(): ManagedDietTemplate[] {
  return meals.map((meal) => ({
    id: meal.name,
    name: meal.meal,
    goal: meal.name,
    caloriesMin: meal.kcal - 80,
    caloriesMax: meal.kcal + 80,
    proteinRatio: null,
    carbsRatio: null,
    fatRatio: null,
    tags: ["demo"],
    status: "draft",
  }));
}

export async function listManagedDietCategories(workspaceId?: string): Promise<ManagedDietCategory[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return fallbackCategories();
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("diet_categories")
    .select("id,name,slug,description,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load diet categories", error.message);
    return fallbackCategories();
  }

  if (!data?.length) {
    return [];
  }

  const categoryIds = data.map((category) => category.id);
  const templatesResult = await supabase
    .from("diet_templates")
    .select("category_id")
    .in("category_id", categoryIds);

  const templateCountByCategory = new Map<string, number>();
  for (const template of templatesResult.data ?? []) {
    if (!template.category_id) continue;
    templateCountByCategory.set(template.category_id, (templateCountByCategory.get(template.category_id) ?? 0) + 1);
  }

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    templates: templateCountByCategory.get(category.id) ?? 0,
  }));
}

export async function listManagedDietTemplates(workspaceId?: string): Promise<ManagedDietTemplate[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return fallbackTemplates();
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("diet_templates")
    .select("id,name,goal,calories_min,calories_max,protein_ratio,carbs_ratio,fat_ratio,tags,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load diet templates", error.message);
    return fallbackTemplates();
  }

  return (data ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    goal: template.goal ?? "",
    caloriesMin: template.calories_min,
    caloriesMax: template.calories_max,
    proteinRatio: template.protein_ratio,
    carbsRatio: template.carbs_ratio,
    fatRatio: template.fat_ratio,
    tags: template.tags,
    status: template.status,
  }));
}

export async function createManagedDietCategory(input: DietCategoryInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de crear categorias.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre de la categoria es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("diet_categories").insert({
    workspace_id: input.workspaceId,
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    description: input.description.trim() || null,
  });

  if (error) {
    throw new Error(`No se pudo crear la categoria: ${error.message}`);
  }
}

export async function createManagedDietTemplate(input: DietTemplateInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de crear plantillas.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre de la plantilla es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("diet_templates").insert({
    workspace_id: input.workspaceId,
    category_id: input.categoryId || null,
    name,
    goal: input.goal.trim() || null,
    calories_min: parseInteger(input.caloriesMin),
    calories_max: parseInteger(input.caloriesMax),
    protein_ratio: parseRatio(input.proteinRatio),
    carbs_ratio: parseRatio(input.carbsRatio),
    fat_ratio: parseRatio(input.fatRatio),
    tags: splitList(input.tags),
    status: "draft",
  });

  if (error) {
    throw new Error(`No se pudo crear la plantilla: ${error.message}`);
  }
}

export async function listManagedIngredients(workspaceId?: string): Promise<ManagedIngredient[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("id,name,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,allergens,tags,is_base_library,created_at")
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error("Unable to load ingredients", error.message);
    return [];
  }

  return (data ?? []).map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    caloriesPer100g: ingredient.calories_per_100g,
    proteinPer100g: ingredient.protein_per_100g,
    carbsPer100g: ingredient.carbs_per_100g,
    fatPer100g: ingredient.fat_per_100g,
    allergens: ingredient.allergens,
    tags: ingredient.tags,
    isBase: ingredient.is_base_library ?? false,
  }));
}

export async function listManagedRecipes(
  workspaceId?: string,
  options: { includeBase?: boolean } = {},
): Promise<ManagedRecipe[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];

  const supabase = createServiceSupabaseClient();
  const baseQuery = supabase
    .from("recipes")
    .select("id,name,meal_slot,instructions,tags,is_base_library,created_at");
  const { data, error } = await (options.includeBase
    ? baseQuery.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    : baseQuery.eq("workspace_id", workspaceId)
  ).order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load recipes", error.message);
    return [];
  }

  const recipeIds = (data ?? []).map((recipe) => recipe.id);
  const recipeIngredients = recipeIds.length
    ? await supabase
        .from("recipe_ingredients")
        .select("recipe_id,grams,ingredients(name,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g)")
        .in("recipe_id", recipeIds)
    : { data: [], error: null };

  const ingredientsByRecipe = new Map<string, ManagedRecipe["ingredients"]>();
  const macrosByRecipe = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();

  for (const item of recipeIngredients.data ?? []) {
    const ingredient = item.ingredients as {
      name?: string;
      calories_per_100g?: number;
      protein_per_100g?: number;
      carbs_per_100g?: number;
      fat_per_100g?: number;
    } | null;
    const grams = Number(item.grams);
    const currentIngredients = ingredientsByRecipe.get(item.recipe_id) ?? [];
    currentIngredients.push({ name: ingredient?.name ?? "Ingrediente", grams });
    ingredientsByRecipe.set(item.recipe_id, currentIngredients);

    const currentMacros = macrosByRecipe.get(item.recipe_id) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const ratio = grams / 100;
    currentMacros.calories += (ingredient?.calories_per_100g ?? 0) * ratio;
    currentMacros.protein += (ingredient?.protein_per_100g ?? 0) * ratio;
    currentMacros.carbs += (ingredient?.carbs_per_100g ?? 0) * ratio;
    currentMacros.fat += (ingredient?.fat_per_100g ?? 0) * ratio;
    macrosByRecipe.set(item.recipe_id, currentMacros);
  }

  return (data ?? []).map((recipe) => {
    const macros = macrosByRecipe.get(recipe.id) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      id: recipe.id,
      name: recipe.name,
      mealSlot: recipe.meal_slot,
      instructions: recipe.instructions ?? "",
      tags: recipe.tags,
      calories: Math.round(macros.calories),
      protein: Math.round(macros.protein),
      carbs: Math.round(macros.carbs),
      fat: Math.round(macros.fat),
      ingredients: ingredientsByRecipe.get(recipe.id) ?? [],
      isBase: recipe.is_base_library ?? false,
    };
  });
}

export async function createManagedIngredient(input: IngredientInput) {
  if (!input.workspaceId) throw new Error("Selecciona una marca antes de crear ingredientes.");
  const name = input.name.trim();
  if (!name) throw new Error("El nombre del ingrediente es obligatorio.");

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("ingredients").insert({
    workspace_id: input.workspaceId,
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    calories_per_100g: parseFloatValue(input.caloriesPer100g),
    protein_per_100g: parseFloatValue(input.proteinPer100g),
    carbs_per_100g: parseFloatValue(input.carbsPer100g),
    fat_per_100g: parseFloatValue(input.fatPer100g),
    allergens: splitList(input.allergens),
    tags: splitList(input.tags),
  });

  if (error) throw new Error(`No se pudo crear el ingrediente: ${error.message}`);
}

export async function createManagedRecipe(input: RecipeInput) {
  if (!input.workspaceId) throw new Error("Selecciona una marca antes de crear recetas.");
  const name = input.name.trim();
  if (!name) throw new Error("El nombre de la receta es obligatorio.");

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("recipes").insert({
    workspace_id: input.workspaceId,
    category_id: input.categoryId || null,
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    meal_slot: input.mealSlot.trim() || "comida",
    instructions: input.instructions.trim() || null,
    tags: splitList(input.tags),
  });

  if (error) throw new Error(`No se pudo crear la receta: ${error.message}`);
}

export async function addIngredientToRecipe(input: RecipeIngredientInput) {
  if (!input.recipeId || !input.ingredientId) throw new Error("Falta receta o ingrediente.");
  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("recipe_ingredients")
    .select("id")
    .eq("recipe_id", input.recipeId);

  const { error } = await supabase.from("recipe_ingredients").insert({
    recipe_id: input.recipeId,
    ingredient_id: input.ingredientId,
    grams: parseFloatValue(input.grams, 100),
    sort_order: (existing.data?.length ?? 0) + 1,
  });

  if (error) throw new Error(`No se pudo añadir el ingrediente: ${error.message}`);
}
