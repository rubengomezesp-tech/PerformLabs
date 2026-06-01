"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { clearAuthCookies } from "@/lib/auth/session";
import { deleteMemberAccount } from "@/lib/repositories/member-account";
import { setMemberHideMacros } from "@/lib/repositories/nutrition-tracking";
import { NOTIFICATION_KEYS, setMemberNotificationPreference, type NotificationKey } from "@/lib/repositories/notification-preferences";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function setMemberMacroVisibilityAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const hide = readText(formData, "hideMacros") === "on";
  try {
    await setMemberHideMacros(workspaceId, hide);
  } catch (error) {
    console.error("setMemberMacroVisibilityAction failed", (error as Error).message);
    redirect("/app/profile?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }
  revalidatePath("/app/profile");
  revalidatePath("/app/meals");
  revalidatePath("/app/recipes");
  revalidatePath("/app/diary");
}

export async function setMemberNotificationAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const key = readText(formData, "key") as NotificationKey;
  const value = readText(formData, "value") === "on";
  if (!NOTIFICATION_KEYS.includes(key)) return;

  try {
    await setMemberNotificationPreference(workspaceId, key, value);
  } catch (error) {
    console.error("setMemberNotificationAction failed", (error as Error).message);
    redirect("/app/profile?error=" + encodeURIComponent("No se pudo guardar la preferencia. Inténtalo de nuevo."));
  }
  revalidatePath("/app/profile");
}

/** GDPR account deletion: irreversible, requires typing the confirmation word. */
export async function deleteMemberAccountAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const confirm = readText(formData, "confirm");

  if (confirm.toUpperCase() !== "ELIMINAR") {
    redirect("/app/profile?error=" + encodeURIComponent("Escribe ELIMINAR para confirmar la baja de tu cuenta."));
  }

  const result = await deleteMemberAccount(workspaceId);
  if (!result.ok) {
    const message =
      result.reason === "admin-blocked"
        ? "Tu cuenta de administrador no puede eliminarse desde la app del cliente."
        : result.reason === "no-session"
          ? "Vuelve a iniciar sesión e inténtalo de nuevo."
          : "No se pudo completar la baja. Inténtalo de nuevo o contacta con soporte.";
    redirect("/app/profile?error=" + encodeURIComponent(message));
  }

  await clearAuthCookies();
  redirect("/acceso?success=" + encodeURIComponent("Tu cuenta y tus datos se han eliminado. Gracias por haber estado aquí."));
}
