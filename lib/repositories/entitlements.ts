import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type EntitlementStatus = Database["public"]["Enums"]["entitlement_status"];

export type EntitlementModule =
  | "member_app"
  | "coach_console"
  | "training"
  | "nutrition"
  | "checkins"
  | "content"
  | "notifications"
  | "billing";

export type WorkspaceEntitlement = {
  workspaceId: string;
  status: EntitlementStatus;
  modules: Record<EntitlementModule, boolean>;
  contractRef: string;
  reason: string;
  enforcedAt: string;
  updatedAt: string;
};

export type EntitlementUpdateInput = {
  workspaceId: string;
  status: EntitlementStatus;
  reason: string;
  contractRef: string;
  modules?: Record<EntitlementModule, boolean>;
  updatedBy?: string | null;
};

export const entitlementModules = [
  "member_app",
  "coach_console",
  "training",
  "nutrition",
  "checkins",
  "content",
  "notifications",
  "billing",
] as const satisfies EntitlementModule[];

export const entitlementModuleLabels: Record<EntitlementModule, string> = {
  member_app: "App cliente",
  coach_console: "Consola entrenador",
  training: "Entrenamientos",
  nutrition: "Nutricion",
  checkins: "Check-ins",
  content: "Contenido",
  notifications: "Notificaciones",
  billing: "Billing",
};

export const entitlementModuleDescriptions: Record<EntitlementModule, string> = {
  member_app: "Acceso general del usuario final a su app.",
  coach_console: "Acceso del entrenador a su panel operativo.",
  training: "Programas, sesiones, ejercicios y progreso de entrenamiento.",
  nutrition: "Dietas, recetas, macros y lista de compra.",
  checkins: "Seguimiento, mediciones y feedback del entrenador.",
  content: "Guias, soporte, recursos y paginas privadas.",
  notifications: "Mensajes, avisos y campanas.",
  billing: "Productos, pagos, suscripciones y reglas comerciales.",
};

export const entitlementStatusLabels: Record<EntitlementStatus, string> = {
  active: "Activa",
  past_due: "Pendiente de regularizar",
  suspended: "Suspendida",
  revoked: "Revocada",
  terminated: "Finalizada",
};

export const entitlementStatusDescriptions: Record<EntitlementStatus, string> = {
  active: "La licencia esta activa y la app funciona con normalidad.",
  past_due: "La licencia requiere atencion interna, pero la experiencia sigue operativa.",
  suspended: "El acceso queda pausado hasta que el equipo reactive la marca.",
  revoked: "La licencia queda revocada y las superficies de cliente se bloquean.",
  terminated: "La relacion operativa esta cerrada y la app queda fuera de servicio.",
};

const defaultModules: Record<EntitlementModule, boolean> = {
  member_app: true,
  coach_console: true,
  training: true,
  nutrition: true,
  checkins: true,
  content: true,
  notifications: true,
  billing: true,
};

function normalizeModules(value: unknown): Record<EntitlementModule, boolean> {
  if (!value || typeof value !== "object") {
    return defaultModules;
  }

  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaultModules).map(([key, defaultValue]) => [key, typeof source[key] === "boolean" ? source[key] : defaultValue]),
  ) as Record<EntitlementModule, boolean>;
}

function fallbackEntitlement(workspaceId: string): WorkspaceEntitlement {
  return {
    workspaceId,
    status: "active",
    modules: defaultModules,
    contractRef: "",
    reason: "",
    enforcedAt: "",
    updatedAt: "",
  };
}

function isUuid(value?: string): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapEntitlement(row: {
  workspace_id: string;
  status: EntitlementStatus;
  modules: unknown;
  contract_ref: string | null;
  reason: string | null;
  enforced_at: string | null;
  updated_at: string;
}): WorkspaceEntitlement {
  return {
    workspaceId: row.workspace_id,
    status: row.status,
    modules: normalizeModules(row.modules),
    contractRef: row.contract_ref ?? "",
    reason: row.reason ?? "",
    enforcedAt: row.enforced_at ?? "",
    updatedAt: row.updated_at,
  };
}

export function entitlementAllows(entitlement: WorkspaceEntitlement, module: EntitlementModule) {
  if (["suspended", "revoked", "terminated"].includes(entitlement.status)) {
    return false;
  }

  return entitlement.modules[module] !== false;
}

export async function getWorkspaceEntitlement(workspaceId?: string): Promise<WorkspaceEntitlement> {
  if (!workspaceId || !isUuid(workspaceId)) {
    return fallbackEntitlement(workspaceId ?? "");
  }

  const env = getSupabaseServiceEnv();
  if (!env.ok) {
    return fallbackEntitlement(workspaceId);
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_entitlements")
    .select("workspace_id,status,modules,contract_ref,reason,enforced_at,updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load workspace entitlement", error.message);
    return fallbackEntitlement(workspaceId);
  }

  if (data) {
    return mapEntitlement(data);
  }

  const created = await supabase
    .from("workspace_entitlements")
    .insert({
      workspace_id: workspaceId,
      status: "suspended",
      reason: "Pendiente de pago y activacion comercial.",
    })
    .select("workspace_id,status,modules,contract_ref,reason,enforced_at,updated_at")
    .single();

  if (created.error || !created.data) {
    console.error("Unable to create workspace entitlement", created.error?.message);
    return fallbackEntitlement(workspaceId);
  }

  return mapEntitlement(created.data);
}

export async function upsertWorkspaceEntitlement(input: EntitlementUpdateInput) {
  if (!isUuid(input.workspaceId)) {
    throw new Error("Falta un workspace valido para actualizar la licencia.");
  }

  const supabase = createServiceSupabaseClient();
  const restricted = ["suspended", "revoked", "terminated"].includes(input.status);
  const payload: Database["public"]["Tables"]["workspace_entitlements"]["Insert"] = {
    workspace_id: input.workspaceId,
    status: input.status,
    reason: input.reason.trim() || null,
    contract_ref: input.contractRef.trim() || null,
    enforced_at: restricted ? new Date().toISOString() : null,
    updated_by: input.updatedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.modules) {
    payload.modules = input.modules;
  }

  const { error } = await supabase.from("workspace_entitlements").upsert(payload, { onConflict: "workspace_id" });

  if (error) {
    throw new Error(`No se pudo actualizar la licencia: ${error.message}`);
  }
}
