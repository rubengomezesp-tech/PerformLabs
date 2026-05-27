"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { createManagedPricingPlan, createManagedProduct } from "@/lib/repositories/billing-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createProductAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedProduct({
    workspaceId,
    name: readText(formData, "name"),
    description: readText(formData, "description"),
    includedModules: readText(formData, "includedModules"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "product.created",
    entityType: "product_catalog_item",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/console/billing");
  revalidatePath("/app");
}

export async function createPricingPlanAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedPricingPlan({
    workspaceId,
    productId: readText(formData, "productId"),
    name: readText(formData, "name"),
    price: readText(formData, "price"),
    currency: readText(formData, "currency"),
    billingInterval: readText(formData, "billingInterval"),
    trialDays: readText(formData, "trialDays"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "pricing_plan.created",
    entityType: "pricing_plan",
    metadata: { name: readText(formData, "name"), price: readText(formData, "price") },
  });

  revalidatePath("/console/billing");
}
