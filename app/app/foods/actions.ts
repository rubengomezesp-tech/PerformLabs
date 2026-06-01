"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { quickAddFood, toggleFoodFavorite } from "@/lib/repositories/food-library";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function quickAddFoodAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const foodId = readText(formData, "foodId");
  const quantity = Number(formData.get("quantity"));
  const date = readText(formData, "date") || undefined;
  try {
    await quickAddFood(workspaceId, foodId, quantity, date);
  } catch (error) {
    console.error("quickAddFoodAction failed", (error as Error).message);
    redirect("/app/foods?error=" + encodeURIComponent("No se pudo añadir. Inténtalo de nuevo."));
  }
  revalidatePath("/app/foods");
  revalidatePath("/app/diary");
  revalidatePath("/app");
}

export async function toggleFoodFavoriteAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await toggleFoodFavorite(workspaceId, readText(formData, "foodId"));
  } catch (error) {
    console.error("toggleFoodFavoriteAction failed", (error as Error).message);
    redirect("/app/foods?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }
  revalidatePath("/app/foods");
}
