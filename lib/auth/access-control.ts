import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { authAccessCookie } from "@/lib/auth/session";
import {
  canManageWorkspace,
  consoleRoles,
  formatRole,
  platformRoles,
  roleAllowed,
  workspaceManagerRoles,
  type WorkspaceRole,
} from "@/lib/auth/role-access";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { localOpenSession, resolveConsoleSession, type ConsoleMembership, type ConsoleSession } from "@/lib/auth/console-session";

export type { WorkspaceRole } from "@/lib/auth/role-access";

export type { ConsoleMembership, ConsoleSession };

export async function getVerifiedUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authAccessCookie)?.value;

  if (!accessToken) {
    return null;
  }

  const publicEnv = getSupabasePublicEnv();
  if (!publicEnv.ok) {
    return null;
  }

  const supabase = createClient<Database>(publicEnv.url, publicEnv.anonKey, {
    auth: {
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

async function listMembershipsForUser(userId: string): Promise<ConsoleMembership[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) {
    return [];
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("id,workspace_id,role,workspaces(id,name,slug,app_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to load console memberships", error.message);
    return [];
  }

  type MembershipRow = {
    id: string;
    workspace_id: string;
    role: WorkspaceRole;
    workspaces: {
      id: string;
      name: string;
      slug: string;
      app_name: string;
    } | null;
  };

  return ((data ?? []) as unknown as MembershipRow[])
    .filter((membership) => consoleRoles.includes(membership.role))
    .map((membership) => ({
      id: membership.id,
      workspaceId: membership.workspace_id,
      workspaceName: membership.workspaces?.name ?? "Marca sin nombre",
      workspaceSlug: membership.workspaces?.slug ?? "",
      workspaceAppName: membership.workspaces?.app_name ?? "",
      role: membership.role,
    }));
}

export async function getConsoleSession(): Promise<ConsoleSession | null> {
  if (!isConsoleAuthRequired()) {
    return localOpenSession();
  }

  const user = await getVerifiedUser();
  if (!user) {
    return null;
  }

  const memberships = await listMembershipsForUser(user.id);
  return resolveConsoleSession({ id: user.id, email: user.email }, memberships, process.env.COACHOS_OWNER_EMAIL);
}

export async function requireConsoleAccess(allowedRoles: WorkspaceRole[] = consoleRoles) {
  const session = await getConsoleSession();

  if (!session || !roleAllowed(session.topRole, allowedRoles)) {
    redirect("/login?error=Acceso no autorizado.");
  }

  return session;
}

export async function requirePlatformAccess() {
  return requireConsoleAccess(platformRoles);
}

export async function requireWorkspaceMutationAccess(workspaceId?: string) {
  const session = await requireConsoleAccess(workspaceManagerRoles);

  if (!canManageWorkspace(session, workspaceId)) {
    redirect("/login?error=No tienes permisos para esta marca.");
  }

  return session;
}

export { formatRole, canManageWorkspace };
