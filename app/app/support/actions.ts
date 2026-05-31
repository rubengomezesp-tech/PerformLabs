"use server";

import { revalidatePath } from "next/cache";
import { createSupportConversation, sendMemberSupportMessage } from "@/lib/repositories/support-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createSupportConversationAction(formData: FormData) {
  await createSupportConversation({
    workspaceId: readText(formData, "workspaceId"),
    subject: readText(formData, "subject"),
    category: readText(formData, "category"),
    priority: readText(formData, "priority"),
    message: readText(formData, "message"),
  });

  revalidatePath("/app/support");
  revalidatePath("/coach/content");
  revalidatePath("/coach/messages");
}

export async function sendMemberSupportMessageAction(formData: FormData) {
  const body = readText(formData, "body");
  if (!body) return;

  await sendMemberSupportMessage({
    workspaceId: readText(formData, "workspaceId"),
    body,
  });

  revalidatePath("/app/support");
  revalidatePath("/coach/messages");
}
