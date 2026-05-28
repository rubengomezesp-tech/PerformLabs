import { createHash, randomBytes } from "node:crypto";
import { canInviteWorkspaceRole } from "@/lib/auth/role-access";
import { getWorkspaceEntitlement } from "@/lib/repositories/entitlements";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/lib/auth/access-control";

export type SecurityTeamMember = {
  id: string;
  userId: string;
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
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

export type WorkspaceTeamInvitation = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  email: string;
  role: WorkspaceRole;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedBy: string | null;
  acceptedBy: string | null;
  acceptedAt: string;
  expiresAt: string;
  createdAt: string;
};

export type TeamInviteInput = {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  actorUserId?: string | null;
  actorRole: WorkspaceRole;
  redirectTo?: string;
};

export type TeamAccessRevokeInput = {
  workspaceId: string;
  membershipId?: string;
  invitationId?: string;
  actorRole?: WorkspaceRole;
  actorUserId?: string | null;
};

type WorkspaceRelation = {
  name?: string | null;
  slug?: string | null;
} | null;

type TeamMembershipRow = {
  id: string;
  workspace_id: string;
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

type TeamInvitationRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceTeamInvitation["status"];
  invited_by: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  workspaces: WorkspaceRelation;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function resolvePublicAppUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
  );

  return rawUrl ? rawUrl.replace(/\/+$/, "") : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function newInvitationTokenHash() {
  return hashToken(randomBytes(32).toString("hex"));
}

function workspaceScope(workspaceIds?: string[]) {
  if (!workspaceIds) return null;
  return [...new Set(workspaceIds.filter(Boolean))];
}

async function findAuthUserByEmail(email: string) {
  const supabase = createServiceSupabaseClient();
  let page = 1;

  while (page <= 10) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) {
      throw new Error(`No se pudo comprobar usuarios existentes: ${result.error.message}`);
    }

    const user = result.data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (result.data.users.length < 1000) return null;
    page += 1;
  }

  return null;
}

async function inviteOrFindAuthUser(input: {
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
  redirectTo?: string;
}) {
  const supabase = createServiceSupabaseClient();
  const existingUser = await findAuthUserByEmail(input.email);
  if (existingUser) return { userId: existingUser.id, inviteSent: false };

  const inviteResult = await supabase.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: input.redirectTo,
    data: {
      invited_role: input.role,
      workspace_id: input.workspaceId,
    },
  });

  if (inviteResult.error || !inviteResult.data.user?.id) {
    throw new Error(`No se pudo enviar la invitacion: ${inviteResult.error?.message ?? "error desconocido"}`);
  }

  return { userId: inviteResult.data.user.id, inviteSent: true };
}

async function ensurePlatformWorkspace(supabase: ReturnType<typeof createServiceSupabaseClient>) {
  const result = await supabase
    .from("workspaces")
    .upsert({
      name: "PerformLabs Operativa",
      slug: "platform",
      app_name: "PerformLabs",
      support_email: "admin@performlabs.local",
      accent_color: "#078df2",
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(`No se pudo preparar el workspace interno: ${result.error?.message ?? "error desconocido"}`);
  }

  return result.data.id;
}

async function assertWorkspaceReadyForTeamAccess(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  role: WorkspaceRole,
) {
  if (role === "platform_owner") {
    return;
  }

  const workspace = await supabase
    .from("workspaces")
    .select("id,name,is_active")
    .eq("id", workspaceId)
    .single();

  if (workspace.error || !workspace.data) {
    throw new Error(`No se pudo validar la marca: ${workspace.error?.message ?? "no existe"}`);
  }

  const entitlement = await getWorkspaceEntitlement(workspaceId);

  if (!workspace.data.is_active || entitlement.status !== "active" || entitlement.modules.coach_console === false) {
    throw new Error("Esta app todavia no esta pagada y activa. Activa la licencia en Apps antes de dar acceso al entrenador.");
  }
}

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

export async function listSecurityTeamMembers(workspaceIds?: string[]): Promise<SecurityTeamMember[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const scope = workspaceScope(workspaceIds);
  if (scope && !scope.length) return [];

  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("workspace_memberships")
    .select("id,workspace_id,user_id,role,created_at,workspaces(name,slug)");

  if (scope) {
    query = query.in("workspace_id", scope);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(80);

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
    workspaceId: row.workspace_id,
    workspaceName: row.workspaces?.name ?? "Marca eliminada",
    workspaceSlug: row.workspaces?.slug ?? "",
    createdAt: row.created_at,
  }));
}

export async function ensurePlatformOwner(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) {
    throw new Error("Falta el email del propietario de plataforma.");
  }

  const supabase = createServiceSupabaseClient();
  const workspaceId = await ensurePlatformWorkspace(supabase);
  const appUrl = resolvePublicAppUrl();
  const { userId } = await inviteOrFindAuthUser({
    email,
    role: "platform_owner",
    workspaceId,
    redirectTo: appUrl ? `${appUrl}/auth/callback?next=/console/security` : undefined,
  });

  const membership = await supabase
    .from("workspace_memberships")
    .upsert({
      workspace_id: workspaceId,
      user_id: userId,
      role: "platform_owner",
    }, { onConflict: "workspace_id,user_id" })
    .select("id")
    .single();

  if (membership.error || !membership.data?.id) {
    throw new Error(`No se pudo asignar platform_owner: ${membership.error?.message ?? "error desconocido"}`);
  }

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: userId,
    action: "security.platform_owner_ensured",
    entityType: "workspace_membership",
    entityId: membership.data.id,
    metadata: { email },
  });

  return { workspaceId, userId, membershipId: membership.data.id };
}

export async function inviteWorkspaceTeamMember(input: TeamInviteInput) {
  const email = normalizeEmail(input.email);
  if (!input.workspaceId || !email) {
    throw new Error("Falta la marca o el email.");
  }

  if (!canInviteWorkspaceRole(input.actorRole, input.role)) {
    throw new Error("No tienes permisos para invitar ese rol.");
  }

  const supabase = createServiceSupabaseClient();
  await assertWorkspaceReadyForTeamAccess(supabase, input.workspaceId, input.role);

  const { userId, inviteSent } = await inviteOrFindAuthUser({
    email,
    role: input.role,
    workspaceId: input.workspaceId,
    redirectTo: input.redirectTo,
  });
  const now = new Date().toISOString();

  const pendingInvitation = await supabase
    .from("workspace_team_invitations")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("email", email)
    .eq("role", input.role)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingInvitation.error) {
    throw new Error(`No se pudo comprobar la invitacion pendiente: ${pendingInvitation.error.message}`);
  }

  const invitationPayload = {
    workspace_id: input.workspaceId,
    email,
    role: input.role,
    status: "pending" as const,
    token_hash: newInvitationTokenHash(),
    invited_by: input.actorUserId ?? null,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: now,
  };
  const invitation = pendingInvitation.data?.id ? await supabase
    .from("workspace_team_invitations")
    .update(invitationPayload)
    .eq("id", pendingInvitation.data.id)
    .select("id")
    .single() : await supabase
    .from("workspace_team_invitations")
    .insert(invitationPayload)
    .select("id")
    .single();

  if (invitation.error || !invitation.data?.id) {
    throw new Error(`No se pudo guardar la invitacion: ${invitation.error?.message ?? "error desconocido"}`);
  }

  const membership = await supabase
    .from("workspace_memberships")
    .upsert({
      workspace_id: input.workspaceId,
      user_id: userId,
      role: input.role,
    }, { onConflict: "workspace_id,user_id" })
    .select("id")
    .single();

  if (membership.error || !membership.data?.id) {
    throw new Error(`No se pudo asignar el acceso: ${membership.error?.message ?? "error desconocido"}`);
  }

  await recordSecurityAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId ?? null,
    action: "workspace_team.invited",
    entityType: "workspace_team_invitation",
    entityId: invitation.data.id,
    metadata: { email, role: input.role, inviteSent, membershipId: membership.data.id },
  });

  return { invitationId: invitation.data.id, membershipId: membership.data.id, userId, inviteSent };
}

export async function listPendingTeamInvitations(workspaceIds?: string[]): Promise<WorkspaceTeamInvitation[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const scope = workspaceScope(workspaceIds);
  if (scope && !scope.length) return [];

  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("workspace_team_invitations")
    .select("id,workspace_id,email,role,status,invited_by,accepted_by,accepted_at,expires_at,created_at,workspaces(name,slug)")
    .in("status", ["pending", "expired", "revoked"]);

  if (scope) {
    query = query.in("workspace_id", scope);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(80);

  if (error) {
    console.error("Unable to load team invitations", error.message);
    return [];
  }

  return ((data ?? []) as unknown as TeamInvitationRow[]).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: row.workspaces?.name ?? "Marca eliminada",
    workspaceSlug: row.workspaces?.slug ?? "",
    email: row.email,
    role: row.role,
    status: row.status === "pending" && new Date(row.expires_at).getTime() < Date.now() ? "expired" : row.status,
    invitedBy: row.invited_by,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at ?? "",
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function acceptPendingTeamInvitationsForUser(input: {
  userId: string;
  email: string;
}) {
  const email = normalizeEmail(input.email);
  if (!input.userId || !email) return 0;

  const env = getSupabaseServiceEnv();
  if (!env.ok) return 0;

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_team_invitations")
    .select("id,workspace_id,role,expires_at")
    .eq("email", email)
    .eq("status", "pending");

  if (error) {
    console.error("Unable to load pending team invitations", error.message);
    return 0;
  }

  const validInvitations = (data ?? []).filter((invitation) => (
    new Date(invitation.expires_at).getTime() >= Date.now()
  ));
  const expiredIds = (data ?? [])
    .filter((invitation) => new Date(invitation.expires_at).getTime() < Date.now())
    .map((invitation) => invitation.id);
  const now = new Date().toISOString();

  if (expiredIds.length) {
    await supabase
      .from("workspace_team_invitations")
      .update({ status: "expired", updated_at: now })
      .in("id", expiredIds);
  }

  for (const invitation of validInvitations) {
    await supabase.from("workspace_memberships").upsert({
      workspace_id: invitation.workspace_id,
      user_id: input.userId,
      role: invitation.role,
    }, { onConflict: "workspace_id,user_id" });
  }

  if (validInvitations.length) {
    await supabase
      .from("workspace_team_invitations")
      .update({
        status: "accepted",
        accepted_by: input.userId,
        accepted_at: now,
        updated_at: now,
      })
      .in("id", validInvitations.map((invitation) => invitation.id));

    await Promise.all(validInvitations.map((invitation) => recordSecurityAuditEvent({
      workspaceId: invitation.workspace_id,
      actorUserId: input.userId,
      action: "workspace_team.invitation_accepted",
      entityType: "workspace_team_invitation",
      entityId: invitation.id,
      metadata: { email, role: invitation.role },
    })));
  }

  return validInvitations.length;
}

export async function revokeWorkspaceTeamInvitation(input: TeamAccessRevokeInput) {
  if (!input.invitationId) {
    throw new Error("Falta la invitacion.");
  }

  const supabase = createServiceSupabaseClient();
  const invitationResult = await supabase
    .from("workspace_team_invitations")
    .select("id,email,role,status")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.invitationId)
    .single();

  if (invitationResult.error || !invitationResult.data) {
    throw new Error(`No se pudo encontrar la invitacion: ${invitationResult.error?.message ?? "no existe"}`);
  }

  if (invitationResult.data.role === "platform_owner" && input.actorRole !== "platform_owner") {
    throw new Error("Solo un platform_owner puede revocar invitaciones de platform_owner.");
  }

  if (invitationResult.data.status !== "pending") {
    throw new Error("Solo se pueden revocar invitaciones pendientes.");
  }

  const { error } = await supabase
    .from("workspace_team_invitations")
    .update({
      status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.invitationId);

  if (error) {
    throw new Error(`No se pudo revocar la invitacion: ${error.message}`);
  }

  const invitedUser = await findAuthUserByEmail(invitationResult.data.email);
  if (invitedUser) {
    await supabase
      .from("workspace_memberships")
      .delete()
      .eq("workspace_id", input.workspaceId)
      .eq("user_id", invitedUser.id)
      .eq("role", invitationResult.data.role);
  }

  await recordSecurityAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId ?? null,
    action: "workspace_team.invitation_revoked",
    entityType: "workspace_team_invitation",
    entityId: input.invitationId,
  });
}

export async function revokeWorkspaceTeamAccess(input: TeamAccessRevokeInput) {
  if (!input.membershipId) {
    throw new Error("Falta el acceso.");
  }

  const supabase = createServiceSupabaseClient();
  const membershipResult = await supabase
    .from("workspace_memberships")
    .select("id,user_id,role")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.membershipId)
    .single();

  if (membershipResult.error || !membershipResult.data) {
    throw new Error(`No se pudo encontrar el acceso: ${membershipResult.error?.message ?? "no existe"}`);
  }

  if (input.actorUserId && membershipResult.data.user_id === input.actorUserId) {
    throw new Error("No puedes revocar tu propio acceso.");
  }

  if (membershipResult.data.role === "platform_owner") {
    if (input.actorRole !== "platform_owner") {
      throw new Error("Solo un platform_owner puede revocar otro platform_owner.");
    }

    const remainingOwners = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("role", "platform_owner")
      .neq("id", input.membershipId)
      .limit(1);

    if (remainingOwners.error) {
      throw new Error(`No se pudo validar propietarios restantes: ${remainingOwners.error.message}`);
    }

    if (!remainingOwners.data?.length) {
      throw new Error("No puedes dejar la plataforma sin ningun platform_owner.");
    }
  }

  const { error } = await supabase
    .from("workspace_memberships")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.membershipId);

  if (error) {
    throw new Error(`No se pudo revocar el acceso: ${error.message}`);
  }

  await recordSecurityAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId ?? null,
    action: "workspace_team.access_revoked",
    entityType: "workspace_membership",
    entityId: input.membershipId,
  });
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

export async function listSecurityAuditEvents(workspaceIds?: string[]): Promise<SecurityAuditEvent[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const scope = workspaceScope(workspaceIds);
  if (scope && !scope.length) return [];

  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("audit_log")
    .select("id,action,entity_type,entity_id,actor_user_id,metadata,created_at,workspaces(name,slug)");

  if (scope) {
    query = query.in("workspace_id", scope);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);

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
