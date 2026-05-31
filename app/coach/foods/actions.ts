"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import {
  createFoodItem,
  deleteFoodItem,
  seedStarterFoods,
  type FoodCategory,
} from "@/lib/repositories/food-library";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

export async function createFoodItemAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createFoodItem({
    workspaceId,
    name: readText(formData, "name"),
    brand: readText(formData, "brand"),
    servingLabel: readText(formData, "servingLabel"),
    category: (readText(formData, "category") || "other") as FoodCategory,
    protein: readNumber(formData, "protein"),
    fat: readNumber(formData, "fat"),
    carbs: readNumber(formData, "carbs"),
    calories: readNumber(formData, "calories"),
    imageUrl: readText(formData, "imageUrl"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.food.created",
    entityType: "food_library_item",
  });

  revalidatePath("/coach/foods");
  revalidatePath("/app/foods");
}

export async function deleteFoodItemAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  await requireWorkspaceMutationAccess(workspaceId);
  await deleteFoodItem(workspaceId, readText(formData, "foodId"));
  revalidatePath("/coach/foods");
  revalidatePath("/app/foods");
}

export async function seedStarterFoodsAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const count = await seedStarterFoods(workspaceId);

  if (count > 0) {
    await recordSecurityAuditEvent({
      workspaceId,
      actorUserId: session.mode === "authenticated" ? session.user.id : null,
      action: "coach.food.seeded",
      entityType: "food_library_item",
      metadata: { count },
    });
  }

  revalidatePath("/coach/foods");
  revalidatePath("/app/foods");
}
