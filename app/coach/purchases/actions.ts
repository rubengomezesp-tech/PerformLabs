"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { assignRevenueCatPurchase } from "@/lib/repositories/revenuecat-purchases";
import { fireMemberEventNotification } from "@/lib/notifications/events";
import { isUuid } from "@/lib/utils/uuid";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function assignRevenueCatPurchaseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const eventId = readText(formData, "eventId");
  const memberProfileId = readText(formData, "memberProfileId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  if (!isUuid(workspaceId) || !eventId || !isUuid(memberProfileId)) {
    redirect("/coach/purchases?status=invalid");
  }

  let status = "assigned";
  try {
    await assignRevenueCatPurchase({
      workspaceId,
      eventId,
      memberProfileId,
      actorUserId: session.mode === "authenticated" ? session.user.id : null,
    });
    await fireMemberEventNotification({ workspaceId, memberProfileId, eventKey: "payment.succeeded" });
    revalidatePath("/coach/purchases");
    revalidatePath(`/coach/members/${memberProfileId}`);
    revalidatePath("/app");
    revalidatePath("/app/profile");
  } catch (error) {
    console.error("Unable to assign RevenueCat purchase", error);
    status = "error";
  }
  redirect(`/coach/purchases?status=${status}`);
}
