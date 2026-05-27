"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import {
  addIngredientToRecipe,
  createManagedDietCategory,
  createManagedDietTemplate,
  createManagedIngredient,
  createManagedRecipe,
} from "@/lib/repositories/nutrition-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createDietCategoryAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedDietCategory({
    workspaceId,
    name: readText(formData, "name"),
    description: readText(formData, "description"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "diet_category.created",
    entityType: "diet_category",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/console/diet-templates");
}

export async function createDietTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedDietTemplate({
    workspaceId,
    categoryId: readText(formData, "categoryId"),
    name: readText(formData, "name"),
    goal: readText(formData, "goal"),
    caloriesMin: readText(formData, "caloriesMin"),
    caloriesMax: readText(formData, "caloriesMax"),
    proteinRatio: readText(formData, "proteinRatio"),
    carbsRatio: readText(formData, "carbsRatio"),
    fatRatio: readText(formData, "fatRatio"),
    tags: readText(formData, "tags"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "diet_template.created",
    entityType: "diet_template",
    metadata: { name: readText(formData, "name"), goal: readText(formData, "goal") },
  });

  revalidatePath("/console/diet-templates");
  revalidatePath("/console/nutrition");
}

export async function createIngredientAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedIngredient({
    workspaceId,
    name: readText(formData, "name"),
    caloriesPer100g: readText(formData, "caloriesPer100g"),
    proteinPer100g: readText(formData, "proteinPer100g"),
    carbsPer100g: readText(formData, "carbsPer100g"),
    fatPer100g: readText(formData, "fatPer100g"),
    allergens: readText(formData, "allergens"),
    tags: readText(formData, "tags"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "ingredient.created",
    entityType: "ingredient",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/console/diet-templates");
}

export async function createRecipeAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedRecipe({
    workspaceId,
    categoryId: readText(formData, "categoryId"),
    name: readText(formData, "name"),
    mealSlot: readText(formData, "mealSlot"),
    instructions: readText(formData, "instructions"),
    tags: readText(formData, "tags"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "recipe.created",
    entityType: "recipe",
    metadata: { name: readText(formData, "name"), mealSlot: readText(formData, "mealSlot") },
  });

  revalidatePath("/console/diet-templates");
  revalidatePath("/console/nutrition");
}

export async function addRecipeIngredientAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await addIngredientToRecipe({
    recipeId: readText(formData, "recipeId"),
    ingredientId: readText(formData, "ingredientId"),
    grams: readText(formData, "grams"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "recipe_ingredient.added",
    entityType: "recipe",
    entityId: readText(formData, "recipeId") || null,
    metadata: { ingredientId: readText(formData, "ingredientId"), grams: readText(formData, "grams") },
  });

  revalidatePath("/console/diet-templates");
  revalidatePath("/console/nutrition");
}
