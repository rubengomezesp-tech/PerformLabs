"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import {
  deleteCycleLog,
  upsertCycleLog,
  type CycleEntryType,
  type CycleFlow,
} from "@/lib/repositories/cycle-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveCycleLogAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const entryTypeRaw = readText(formData, "entryType");
  const entryType: CycleEntryType =
    entryTypeRaw === "spotting" || entryTypeRaw === "symptom" ? entryTypeRaw : "period_start";
  const flowRaw = readText(formData, "flow");
  const flow: CycleFlow | null =
    flowRaw === "light" || flowRaw === "medium" || flowRaw === "heavy" ? flowRaw : null;
  const symptoms = formData.getAll("symptoms").map((value) => String(value).trim()).filter(Boolean);

  try {
    await upsertCycleLog({
      workspaceId,
      date: readText(formData, "date") || undefined,
      entryType,
      flow,
      symptoms,
      notes: readText(formData, "notes"),
    });
  } catch (error) {
    console.error("saveCycleLogAction failed", (error as Error).message);
    redirect("/app/cycle?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }

  revalidatePath("/app/cycle");
}

export async function deleteCycleLogAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await deleteCycleLog(workspaceId, readText(formData, "entryId"));
  } catch (error) {
    console.error("deleteCycleLogAction failed", (error as Error).message);
    redirect("/app/cycle?error=" + encodeURIComponent("No se pudo borrar. Inténtalo de nuevo."));
  }
  revalidatePath("/app/cycle");
}
