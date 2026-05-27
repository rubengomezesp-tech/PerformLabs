"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { appSettingDefinitions } from "@/lib/domain/platform-logic";
import { saveBrandSettings, type BrandSettingValue } from "@/lib/repositories/brand-settings";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseSettingValue(formData: FormData, key: string): BrandSettingValue {
  const definition = appSettingDefinitions.find((setting) => setting.key === key);

  if (!definition) {
    return "";
  }

  if (definition.valueType === "boolean") {
    return formData.get(`setting:${key}`) === "true";
  }

  if (definition.valueType === "number") {
    const value = Number(readText(formData, `setting:${key}`));
    return Number.isFinite(value) ? value : Number(definition.defaultValue);
  }

  return readText(formData, `setting:${key}`);
}

export async function saveBrandSettingsAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const values = Object.fromEntries(
    appSettingDefinitions.map((setting) => [
      setting.key,
      parseSettingValue(formData, setting.key),
    ]),
  );

  await saveBrandSettings(workspaceId, values);
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "brand_settings.updated",
    entityType: "app_settings",
    metadata: { settingCount: appSettingDefinitions.length },
  });
  revalidatePath("/console/brand");
}
