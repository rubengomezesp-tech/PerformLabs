import type { AiRecipeDraft } from "@/lib/ai/nutrition-agent";
import { getMemberContext } from "@/lib/auth/member-access";
import { dietTemplateCategories, meals } from "@/lib/data";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type ManagedDietCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  templates: number;
};

export type ManagedDietTemplateMeal = {
  id: string;
  dayNumber: number;
  mealSlot: string;
  recipeId: string;
  recipeName: string;
  servingMultiplier: number;
  sortOrder: number;
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
  meals: ManagedDietTemplateMeal[];
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
  imageUrl: string;
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
  imageUrl?: string;
  tags: string;
};

export type RecipeIngredientInput = {
  recipeId: string;
  ingredientId: string;
  grams: string;
  /** When provided, the recipe is verified to belong to this workspace before mutating. */
  workspaceId?: string;
};

export type DietTemplateMealInput = {
  workspaceId: string;
  dietTemplateId: string;
  recipeId: string;
  dayNumber: string;
  mealSlot: string;
  servingMultiplier: string;
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

/**
 * Macro ratios are entered and stored as percentages (0–100): the UI inputs use a
 * "35" placeholder / numeric min–max, the targets flow computes integers like
 * 30/45/25 and the template view renders `ratio * 100 %`. Read the value as an
 * explicit percentage instead of guessing magnitude from `> 1` — the old heuristic
 * mis-read "1" as 100% (not 1%) and any sub-1 percentage as a fraction. Non-numeric
 * or out-of-range (0–100) input → null, and the caller skips it.
 */
export function parseRatio(value: string): number | null {
  const percent = Number.parseFloat(value);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  return percent / 100;
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
    meals: [],
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

export async function listManagedDietTemplates(
  workspaceId?: string,
  options: { withMeals?: boolean } = {},
): Promise<ManagedDietTemplate[]> {
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

  const mealsByTemplate = options.withMeals
    ? await loadDietTemplateMeals(supabase, (data ?? []).map((template) => template.id))
    : new Map<string, ManagedDietTemplateMeal[]>();

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
    meals: mealsByTemplate.get(template.id) ?? [],
  }));
}

async function loadDietTemplateMeals(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  templateIds: string[],
): Promise<Map<string, ManagedDietTemplateMeal[]>> {
  const byTemplate = new Map<string, ManagedDietTemplateMeal[]>();
  if (!templateIds.length) return byTemplate;

  const { data, error } = await supabase
    .from("diet_template_meals")
    .select("id,diet_template_id,day_number,meal_slot,recipe_id,serving_multiplier,sort_order,recipes(name)")
    .in("diet_template_id", templateIds)
    .order("day_number", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Unable to load diet template meals", error.message);
    return byTemplate;
  }

  for (const meal of data ?? []) {
    const recipe = meal.recipes as { name?: string } | null;
    const current = byTemplate.get(meal.diet_template_id) ?? [];
    current.push({
      id: meal.id,
      dayNumber: meal.day_number,
      mealSlot: meal.meal_slot,
      recipeId: meal.recipe_id,
      recipeName: recipe?.name ?? "Receta",
      servingMultiplier: Number(meal.serving_multiplier ?? 1),
      sortOrder: meal.sort_order,
    });
    byTemplate.set(meal.diet_template_id, current);
  }

  return byTemplate;
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
    .select("id,name,meal_slot,instructions,tags,image_url,is_base_library,created_at");
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
      imageUrl: recipe.image_url ?? "",
      calories: Math.round(macros.calories),
      protein: Math.round(macros.protein),
      carbs: Math.round(macros.carbs),
      fat: Math.round(macros.fat),
      ingredients: ingredientsByRecipe.get(recipe.id) ?? [],
      isBase: recipe.is_base_library ?? false,
    };
  });
}

/**
 * Member self-service: swap an assigned meal for another brand recipe.
 * Updates the member's assigned_meal_plan_items row (recipe + macros) in place.
 */
export async function swapAssignedMealItem(input: { workspaceId: string; itemId: string; recipeId: string }) {
  if (!isUuid(input.workspaceId) || !isUuid(input.itemId) || !isUuid(input.recipeId)) {
    throw new Error("Cambio de comida no válido.");
  }

  const recipes = await listManagedRecipes(input.workspaceId, { includeBase: true });
  const recipe = recipes.find((item) => item.id === input.recipeId);
  if (!recipe) {
    throw new Error("Esa receta no existe.");
  }

  // Scope the swap to the caller's own assigned item: without the member_profile_id
  // filter a member could rewrite another client's meal via a forged itemId, since
  // every client in a coach's workspace shares the same workspace_id.
  const member = await getMemberContext(input.workspaceId);
  if (!member) throw new Error("No se pudo identificar la app del cliente.");

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("assigned_meal_plan_items")
    .update({
      recipe_id: recipe.id,
      title: recipe.name,
      calories: recipe.calories,
      protein_g: recipe.protein,
      carbs_g: recipe.carbs,
      fat_g: recipe.fat,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.itemId)
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", member.memberProfileId)
    .select("id");

  if (error) {
    throw new Error(`No se pudo cambiar la comida: ${error.message}`);
  }
  if (!data?.length) {
    throw new Error("No se encontró la comida a cambiar.");
  }
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
    image_url: input.imageUrl?.trim() || null,
    tags: splitList(input.tags),
  });

  if (error) throw new Error(`No se pudo crear la receta: ${error.message}`);
}

export async function addIngredientToRecipe(input: RecipeIngredientInput) {
  if (!input.recipeId || !input.ingredientId) throw new Error("Falta receta o ingrediente.");
  const supabase = createServiceSupabaseClient();

  if (input.workspaceId) {
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", input.recipeId)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();
    if (!recipe) throw new Error("La receta no pertenece a tu marca.");
  }

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

/** Attaches a recipe to a diet template as a scheduled meal (the template -> meals bridge). */
export async function addMealToDietTemplate(input: DietTemplateMealInput) {
  if (!isUuid(input.workspaceId)) throw new Error("Selecciona una marca antes de montar el plan.");
  if (!isUuid(input.dietTemplateId)) throw new Error("Plantilla no válida.");
  if (!isUuid(input.recipeId)) throw new Error("Selecciona una receta válida.");

  const supabase = createServiceSupabaseClient();

  const { data: template } = await supabase
    .from("diet_templates")
    .select("id")
    .eq("id", input.dietTemplateId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (!template) throw new Error("La plantilla no pertenece a tu marca.");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id,workspace_id,is_base_library")
    .eq("id", input.recipeId)
    .maybeSingle();
  const recipeUsable = recipe && (recipe.workspace_id === input.workspaceId || recipe.workspace_id === null || recipe.is_base_library);
  if (!recipeUsable) throw new Error("La receta no está disponible en tu marca.");

  const dayNumber = Math.max(1, parseInteger(input.dayNumber) ?? 1);
  const mealSlot = input.mealSlot.trim() || "comida";
  const servingMultiplier = parseFloatValue(input.servingMultiplier, 1) || 1;

  const existing = await supabase
    .from("diet_template_meals")
    .select("id")
    .eq("diet_template_id", input.dietTemplateId)
    .eq("day_number", dayNumber);

  const { error } = await supabase.from("diet_template_meals").insert({
    diet_template_id: input.dietTemplateId,
    recipe_id: input.recipeId,
    day_number: dayNumber,
    meal_slot: mealSlot,
    serving_multiplier: servingMultiplier,
    sort_order: (existing.data?.length ?? 0) + 1,
  });

  if (error) throw new Error(`No se pudo añadir la comida a la plantilla: ${error.message}`);
}

/** Removes a scheduled meal from a diet template, verifying workspace ownership. */
export async function removeMealFromDietTemplate(input: { workspaceId: string; mealId: string }) {
  if (!isUuid(input.workspaceId)) throw new Error("Selecciona una marca.");
  if (!isUuid(input.mealId)) throw new Error("Comida no válida.");

  const supabase = createServiceSupabaseClient();
  const { data: meal } = await supabase
    .from("diet_template_meals")
    .select("id,diet_templates(workspace_id)")
    .eq("id", input.mealId)
    .maybeSingle();

  const template = meal?.diet_templates as { workspace_id?: string } | null;
  if (!meal || template?.workspace_id !== input.workspaceId) {
    throw new Error("La comida no pertenece a tu marca.");
  }

  const { error } = await supabase.from("diet_template_meals").delete().eq("id", input.mealId);
  if (error) throw new Error(`No se pudo eliminar la comida: ${error.message}`);
}

/** Persists an AI-generated recipe (ingredients + recipe + links) as coach-custom content. */
export async function saveAiRecipe(workspaceId: string, recipe: AiRecipeDraft) {
  if (!isUuid(workspaceId)) throw new Error("Selecciona una marca antes de guardar.");
  if (!recipe.ingredients.length) throw new Error("La receta no tiene ingredientes.");

  const supabase = createServiceSupabaseClient();
  const stamp = Date.now().toString(36);
  const ingredientIds: string[] = [];

  for (const [index, ingredient] of recipe.ingredients.entries()) {
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        workspace_id: workspaceId,
        name: ingredient.name,
        slug: `${slugify(ingredient.name)}-${stamp}-${index}`,
        calories_per_100g: ingredient.caloriesPer100g,
        protein_per_100g: ingredient.proteinPer100g,
        carbs_per_100g: ingredient.carbsPer100g,
        fat_per_100g: ingredient.fatPer100g,
        tags: ["ai"],
        is_base_library: false,
      })
      .select("id")
      .single();
    if (error) throw new Error(`No se pudo guardar el ingrediente: ${error.message}`);
    ingredientIds.push(data.id);
  }

  const { data: created, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      workspace_id: workspaceId,
      name: recipe.name,
      slug: `${slugify(recipe.name)}-${stamp}`,
      meal_slot: recipe.mealSlot,
      instructions: recipe.instructions,
      tags: [...new Set([...recipe.tags, "ai"])],
      is_base_library: false,
    })
    .select("id")
    .single();
  if (recipeError) throw new Error(`No se pudo guardar la receta: ${recipeError.message}`);

  const links = recipe.ingredients.map((ingredient, index) => ({
    recipe_id: created.id,
    ingredient_id: ingredientIds[index],
    grams: ingredient.grams,
    sort_order: index,
  }));
  const { error: linkError } = await supabase.from("recipe_ingredients").insert(links);
  if (linkError) throw new Error(`No se pudieron vincular los ingredientes: ${linkError.message}`);

  return { id: created.id as string };
}

/** Clones a recipe (base or custom) into a workspace as editable coach-custom content. */
export async function cloneRecipeToWorkspace(recipeId: string, workspaceId: string) {
  if (!isUuid(workspaceId)) throw new Error("Selecciona una marca destino.");
  if (!isUuid(recipeId)) throw new Error("Receta no válida.");

  const supabase = createServiceSupabaseClient();
  const { data: source, error } = await supabase
    .from("recipes")
    .select("name,meal_slot,instructions,tags")
    .eq("id", recipeId)
    .maybeSingle();
  if (error || !source) throw new Error("No se encontró la receta de origen.");

  const stamp = Date.now().toString(36);
  const { data: created, error: createError } = await supabase
    .from("recipes")
    .insert({
      workspace_id: workspaceId,
      name: `${source.name} (copia)`,
      slug: `${slugify(source.name)}-copia-${stamp}`,
      meal_slot: source.meal_slot,
      instructions: source.instructions,
      tags: source.tags,
      is_base_library: false,
    })
    .select("id")
    .single();
  if (createError) throw new Error(`No se pudo clonar la receta: ${createError.message}`);

  const { data: links } = await supabase
    .from("recipe_ingredients")
    .select("ingredient_id,grams,sort_order")
    .eq("recipe_id", recipeId);
  if (links?.length) {
    const rows = links.map((link) => ({
      recipe_id: created.id,
      ingredient_id: link.ingredient_id,
      grams: link.grams,
      sort_order: link.sort_order,
    }));
    const { error: linkError } = await supabase.from("recipe_ingredients").insert(rows);
    if (linkError) throw new Error(`No se pudieron copiar los ingredientes: ${linkError.message}`);
  }

  return { id: created.id as string };
}
