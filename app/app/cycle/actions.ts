"use server";

import { revalidatePath } from "next/cache";
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
  const entryTypeRaw = readText(formData, "entryType");
  const entryType: CycleEntryType =
    entryTypeRaw === "spotting" || entryTypeRaw === "symptom" ? entryTypeRaw : "period_start";
  const flowRaw = readText(formData, "flow");
  const flow: CycleFlow | null =
    flowRaw === "light" || flowRaw === "medium" || flowRaw === "heavy" ? flowRaw : null;
  const symptoms = formData.getAll("symptoms").map((value) => String(value).trim()).filter(Boolean);

  await upsertCycleLog({
    workspaceId: readText(formData, "workspaceId"),
    date: readText(formData, "date") || undefined,
    entryType,
    flow,
    symptoms,
    notes: readText(formData, "notes"),
  });

  revalidatePath("/app/cycle");
}

export async function deleteCycleLogAction(formData: FormData) {
  await deleteCycleLog(readText(formData, "workspaceId"), readText(formData, "entryId"));
  revalidatePath("/app/cycle");
}
