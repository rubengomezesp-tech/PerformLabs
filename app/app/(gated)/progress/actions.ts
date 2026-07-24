"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { notifyCoachOfCheckin } from "@/lib/notifications/checkin-notify";
import { CHECKIN_PHOTO_ANGLES, createMemberCheckin, type LabeledCheckinPhoto } from "@/lib/repositories/checkin-management";
import { markMemberNotificationRead } from "@/lib/repositories/member-notifications";
import { respondPhotoConsent } from "@/lib/repositories/photo-consents";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readLabeledPhotos(formData: FormData): LabeledCheckinPhoto[] {
  const photos: LabeledCheckinPhoto[] = [];
  for (const angle of CHECKIN_PHOTO_ANGLES) {
    const value = formData.get(`photo_${angle}`);
    if (value instanceof File && value.size > 0) photos.push({ file: value, angle });
  }
  return photos;
}

export async function createMemberCheckinAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const photos = readLabeledPhotos(formData);
  let created: { id: string; memberProfileId: string };
  try {
    created = await createMemberCheckin({
      workspaceId,
      photos,
      weightKg: readText(formData, "weightKg"),
      bodyFatPercent: readText(formData, "bodyFatPercent"),
      waistCm: readText(formData, "waistCm"),
      chestCm: readText(formData, "chestCm"),
      hipCm: readText(formData, "hipCm"),
      energy: readText(formData, "energy"),
      sleepQuality: readText(formData, "sleepQuality"),
      digestion: readText(formData, "digestion"),
      trainingAdherence: readText(formData, "trainingAdherence"),
      nutritionAdherence: readText(formData, "nutritionAdherence"),
      notes: readText(formData, "notes"),
      photosAvailable: formData.get("photosAvailable") === "on",
    });
  } catch (error) {
    console.error("createMemberCheckinAction failed", (error as Error).message);
    redirect("/app/progress?tab=medidas&error=" + encodeURIComponent("No se pudo enviar el check-in. Inténtalo de nuevo."));
  }

  // El email al coach nunca bloquea ni rompe el guardado: after() lo ejecuta
  // tras enviar la respuesta, y notifyCoachOfCheckin deja cada intento en su
  // ledger (coach_checkin_email_deliveries) — nada de promesas sueltas.
  after(() => notifyCoachOfCheckin({
    workspaceId,
    memberProfileId: created.memberProfileId,
    checkinId: created.id,
  }));

  revalidatePath("/app/progress");
  revalidatePath("/coach/checkins");
  redirect("/app/progress?tab=medidas&enviado=1");
}

export async function dismissMemberNotificationAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const notificationId = readText(formData, "notificationId");
  if (notificationId) await markMemberNotificationRead(workspaceId, notificationId);
  revalidatePath("/app");
}


export async function respondMemberPhotoConsentAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const consentId = readText(formData, "consentId");
  const decision = readText(formData, "decision");
  if (consentId && (decision === "granted" || decision === "denied" || decision === "revoked")) {
    await respondPhotoConsent(workspaceId, consentId, decision);
  }
  revalidatePath("/app/progress");
}
