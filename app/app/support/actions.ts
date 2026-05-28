"use server";

import { revalidatePath } from "next/cache";
import { createSupportConversation } from "@/lib/repositories/support-management";

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
}
