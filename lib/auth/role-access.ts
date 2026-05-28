import type { Database } from "@/lib/supabase/database.types";

export type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

export const consoleRoles: WorkspaceRole[] = ["platform_owner", "agency_admin", "coach_admin", "coach_staff"];
export const platformRoles: WorkspaceRole[] = ["platform_owner", "agency_admin"];
export const workspaceManagerRoles: WorkspaceRole[] = ["platform_owner", "agency_admin", "coach_admin", "coach_staff"];

const roleWeight: Record<WorkspaceRole, number> = {
  member: 0,
  coach_staff: 10,
  coach_admin: 20,
  agency_admin: 30,
  platform_owner: 40,
};

export function highestRole(roles: WorkspaceRole[]): WorkspaceRole {
  return roles.reduce<WorkspaceRole>((topRole, role) => (
    roleWeight[role] > roleWeight[topRole] ? role : topRole
  ), "member");
}

export function roleAllowed(role: WorkspaceRole, allowedRoles: WorkspaceRole[]) {
  if (!allowedRoles.length) return false;
  const minimumWeight = Math.min(...allowedRoles.map((allowedRole) => roleWeight[allowedRole]));
  return roleWeight[role] >= minimumWeight;
}

export function formatRole(role: WorkspaceRole) {
  const labels: Record<WorkspaceRole, string> = {
    platform_owner: "Propietario plataforma",
    agency_admin: "Dirección agencia",
    coach_admin: "Administrador coach",
    coach_staff: "Equipo coach",
    member: "Miembro",
  };

  return labels[role];
}

export function canInviteWorkspaceRole(actorRole: WorkspaceRole, invitedRole: WorkspaceRole) {
  if (actorRole === "platform_owner") {
    return ["platform_owner", "agency_admin", "coach_admin", "coach_staff"].includes(invitedRole);
  }

  if (actorRole === "agency_admin") {
    return ["coach_admin", "coach_staff"].includes(invitedRole);
  }

  return false;
}
