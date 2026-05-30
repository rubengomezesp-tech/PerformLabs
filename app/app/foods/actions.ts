"use server";

import { revalidatePath } from "next/cache";
import { quickAddFood, toggleFoodFavorite } from "@/lib/repositories/food-library";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function quickAddFoodAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const foodId = readText(formData, "foodId");
  const quantity = Number(formData.get("quantity"));
  const date = readText(formData, "date") || undefined;

  await quickAddFood(workspaceId, foodId, quantity, date);

  revalidatePath("/app/foods");
  revalidatePath("/app/diary");
  revalidatePath("/app");
}

export async function toggleFoodFavoriteAction(formData: FormData) {
  await toggleFoodFavorite(readText(formData, "workspaceId"), readText(formData, "foodId"));
  revalidatePath("/app/foods");
}
