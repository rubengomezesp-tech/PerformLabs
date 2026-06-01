"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { createSupportConversation, sendMemberSupportMessage } from "@/lib/repositories/support-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createSupportConversationAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await createSupportConversation({
      workspaceId,
      subject: readText(formData, "subject"),
      category: readText(formData, "category"),
      priority: readText(formData, "priority"),
      message: readText(formData, "message"),
    });
  } catch (error) {
    console.error("createSupportConversationAction failed", (error as Error).message);
    redirect("/app/support?error=" + encodeURIComponent("No se pudo abrir la conversación. Inténtalo de nuevo."));
  }

  revalidatePath("/app/support");
  revalidatePath("/coach/content");
  revalidatePath("/coach/messages");
}

export async function sendMemberSupportMessageAction(formData: FormData) {
  const body = readText(formData, "body");
  if (!body) return;
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);

  try {
    await sendMemberSupportMessage({ workspaceId, body });
  } catch (error) {
    console.error("sendMemberSupportMessageAction failed", (error as Error).message);
    redirect("/app/support?error=" + encodeURIComponent("No se pudo enviar el mensaje. Inténtalo de nuevo."));
  }

  revalidatePath("/app/support");
  revalidatePath("/coach/messages");
}
