"use server";

import { revalidatePath } from "next/cache";
import { updateWorkspaceBranding } from "@/lib/repositories/workspaces";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateBrandingAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");

  await updateWorkspaceBranding(workspaceId, {
    accentColor: readText(formData, "accentColor"),
    backgroundColor: readText(formData, "backgroundColor"),
    logoUrl: readText(formData, "logoUrl"),
    heroHeadline: readText(formData, "heroHeadline"),
    heroSubtext: readText(formData, "heroSubtext"),
    heroImageUrl: readText(formData, "heroImageUrl"),
    welcomeMessage: readText(formData, "welcomeMessage"),
  });

  revalidatePath("/coach/brand");
  revalidatePath("/app");
  revalidatePath("/m");
}
