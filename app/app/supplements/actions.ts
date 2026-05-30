"use server";

import { revalidatePath } from "next/cache";
import { toggleSupplementLog } from "@/lib/repositories/supplements";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function toggleSupplementAction(formData: FormData) {
  await toggleSupplementLog(readText(formData, "workspaceId"), readText(formData, "supplementId"));
  revalidatePath("/app/supplements");
  revalidatePath("/app");
}
