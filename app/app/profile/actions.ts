"use server";

import { revalidatePath } from "next/cache";
import { setMemberHideMacros } from "@/lib/repositories/nutrition-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function setMemberMacroVisibilityAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const hide = readText(formData, "hideMacros") === "on";

  await setMemberHideMacros(workspaceId, hide);

  revalidatePath("/app/profile");
  revalidatePath("/app/meals");
  revalidatePath("/app/recipes");
  revalidatePath("/app/diary");
}
