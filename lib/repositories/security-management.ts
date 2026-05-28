import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/lib/auth/access-control";

export type SecurityTeamMember = {
  id: string;
  userId: string;
  email: string;
  role: WorkspaceRole;
  workspaceName: string;
  workspaceSlug: string;
  createdAt: string;
};

export type SecurityAuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  actorEmail: string;
  workspaceName: string;
  metadata: Json;
  createdAt: string;
};

export type LoginSecurityAlert = {
  id: string;
  action: "auth.sign_in_failed" | "auth.sign_in_rate_limited";
  severity: "warning" | "critical";
  title: string;
  detail: string;
  count: number;
  emailDomain: string;
  ipHashPreview: string;
  userAgent: string;
  lastSeenAt: string;
};

type WorkspaceRelation = {
  name?: string | null;
  slug?: string | null;
} | null;

type TeamMembershipRow = {
  id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  workspaces: WorkspaceRelation;
};

type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  metadata: Json;
  created_at: string;
  workspaces: WorkspaceRelation;
};

type AuthAuditLogRow = {
  id: string;
  action: "auth.sign_in_failed" | "auth.sign_in_rate_limited";
  metadata: Json;
  created_at: string;
};

function metadataValue(metadata: Json, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function shortHash(value: string) {
  return value ? `${value.slice(0, 10)}...` : "sin huella";
}

async function getUserEmail(userId?: string | null) {
  if (!userId) {
    return "Sistema";
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data.user?.email) {
    return "Usuario sin email";
  }

  return data.user.email;
}

export async function listSecurityTeamMembers(): Promise<SecurityTeamMember[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("id,user_id,role,created_at,workspaces(name,slug)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("Unable to load security team members", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as TeamMembershipRow[];
  const uniqueUserIds = [...new Set(rows.map((row) => row.user_id))];
  const emailByUserId = new Map<string, string>();

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      emailByUserId.set(userId, await getUserEmail(userId));
    }),
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: emailByUserId.get(row.user_id) ?? "Usuario sin email",
    role: row.role,
    workspaceName: row.workspaces?.name ?? "Marca eliminada",
    workspaceSlug: row.workspaces?.slug ?? "",
    createdAt: row.created_at,
  }));
}

export async function listLoginSecurityAlerts(): Promise<LoginSecurityAlert[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id,action,metadata,created_at")
    .in("action", ["auth.sign_in_failed", "auth.sign_in_rate_limited"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Unable to load login security alerts", error.message);
    return [];
  }

  const grouped = new Map<string, LoginSecurityAlert>();
  const rows = (data ?? []) as unknown as AuthAuditLogRow[];

  for (const row of rows) {
    const emailDomain = metadataValue(row.metadata, "email_domain") || "unknown";
    const emailHash = metadataValue(row.metadata, "email_hash");
    const ipHash = metadataValue(row.metadata, "ip_hash");
    const userAgent = metadataValue(row.metadata, "user_agent") || "Navegador sin identificar";
    const groupKey = `${row.action}:${emailHash}:${ipHash}`;
    const existing = grouped.get(groupKey);

    if (existing) {
      existing.count += 1;
      if (row.created_at > existing.lastSeenAt) {
        existing.lastSeenAt = row.created_at;
      }
      if (existing.count >= 5 || row.action === "auth.sign_in_rate_limited") {
        existing.severity = "critical";
        existing.title = row.action === "auth.sign_in_rate_limited" ? "Bloqueo activo de login" : "Intentos repetidos";
      }
      existing.detail = `${existing.count} eventos en 24h · dominio ${emailDomain} · IP ${shortHash(ipHash)}`;
      continue;
    }

    const isCritical = row.action === "auth.sign_in_rate_limited";
    grouped.set(groupKey, {
      id: row.id,
      action: row.action,
      severity: isCritical ? "critical" : "warning",
      title: isCritical ? "Bloqueo activo de login" : "Intento fallido de login",
      detail: `1 evento en 24h · dominio ${emailDomain} · IP ${shortHash(ipHash)}`,
      count: 1,
      emailDomain,
      ipHashPreview: shortHash(ipHash),
      userAgent,
      lastSeenAt: row.created_at,
    });
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return b.lastSeenAt.localeCompare(a.lastSeenAt);
    })
    .slice(0, 10);
}

export async function listSecurityAuditEvents(): Promise<SecurityAuditEvent[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id,action,entity_type,entity_id,actor_user_id,metadata,created_at,workspaces(name,slug)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Unable to load security audit events", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as AuditLogRow[];
  const uniqueUserIds = [...new Set(rows.map((row) => row.actor_user_id).filter(Boolean) as string[])];
  const emailByUserId = new Map<string, string>();

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      emailByUserId.set(userId, await getUserEmail(userId));
    }),
  );

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_user_id ? emailByUserId.get(row.actor_user_id) ?? "Usuario sin email" : "Sistema",
    workspaceName: row.workspaces?.name ?? "Plataforma",
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

export async function recordSecurityAuditEvent(input: {
  workspaceId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
}) {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return;

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audit_log").insert({
    workspace_id: input.workspaceId ?? null,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Unable to record audit event", error.message);
  }
}
