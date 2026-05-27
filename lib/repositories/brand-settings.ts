import type { Json } from "@/lib/supabase/database.types";
import { appSettingDefinitions } from "@/lib/domain/platform-logic";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type BrandSettingValue = string | boolean | number | Record<string, unknown>;

export type BrandSettingsState = {
  source: "database" | "defaults";
  values: Record<string, BrandSettingValue>;
};

function toSettingValue(value: Json | undefined, fallback: BrandSettingValue): BrandSettingValue {
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (value && !Array.isArray(value) && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return fallback;
}

function fallbackValues() {
  return Object.fromEntries(
    appSettingDefinitions.map((setting) => [setting.key, setting.defaultValue]),
  ) as Record<string, BrandSettingValue>;
}

export async function getBrandSettings(workspaceId: string): Promise<BrandSettingsState> {
  const defaults = fallbackValues();
  const env = getSupabaseServiceEnv();

  if (!env.ok || !workspaceId) {
    return { source: "defaults", values: defaults };
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key,value")
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Unable to load brand settings", error.message);
    return { source: "defaults", values: defaults };
  }

  const stored = new Map(data.map((setting) => [setting.key, setting.value]));

  return {
    source: "database",
    values: Object.fromEntries(
      appSettingDefinitions.map((setting) => [
        setting.key,
        toSettingValue(stored.get(setting.key), setting.defaultValue),
      ]),
    ) as Record<string, BrandSettingValue>,
  };
}

export async function saveBrandSettings(
  workspaceId: string,
  values: Record<string, BrandSettingValue>,
) {
  if (!workspaceId) {
    throw new Error("Selecciona una marca antes de guardar.");
  }

  const supabase = createServiceSupabaseClient();
  const payload = appSettingDefinitions.map((setting) => ({
    workspace_id: workspaceId,
    key: setting.key,
    value: values[setting.key] as Json,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("app_settings")
    .upsert(payload, { onConflict: "workspace_id,key" });

  if (error) {
    throw new Error(`No se pudo guardar la configuración: ${error.message}`);
  }
}
