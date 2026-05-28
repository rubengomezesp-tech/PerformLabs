import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { authAccessCookie } from "@/lib/auth/session";
import {
  consoleRoles,
  formatRole,
  highestRole,
  platformRoles,
  roleAllowed,
  workspaceManagerRoles,
  type WorkspaceRole,
} from "@/lib/auth/role-access";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type { WorkspaceRole } from "@/lib/auth/role-access";

export type ConsoleMembership = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceAppName: string;
  role: WorkspaceRole;
};

export type ConsoleSession = {
  mode: "open" | "authenticated";
  user: {
    id: string;
    email: string;
  };
  topRole: WorkspaceRole;
  memberships: ConsoleMembership[];
};

function localOpenSession(): ConsoleSession {
  return {
    mode: "open",
    user: {
      id: "local-development",
      email: "local@performlabs.dev",
    },
    topRole: "platform_owner",
    memberships: [],
  };
}

async function getVerifiedUser() {
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
  const ownerEmail = process.env.COACHOS_OWNER_EMAIL?.trim().toLowerCase();
  const email = user.email?.toLowerCase() ?? "";

  if (!memberships.length && ownerEmail && email === ownerEmail) {
    return {
      mode: "authenticated",
      user: {
        id: user.id,
        email,
      },
      topRole: "platform_owner",
      memberships: [],
    };
  }

  if (!memberships.length) {
    return null;
  }

  return {
    mode: "authenticated",
    user: {
      id: user.id,
      email,
    },
    topRole: highestRole(memberships.map((membership) => membership.role)),
    memberships,
  };
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

export function canManageWorkspace(session: ConsoleSession, workspaceId?: string) {
  if (roleAllowed(session.topRole, platformRoles)) {
    return true;
  }

  if (!workspaceId) {
    return false;
  }

  return session.memberships.some((membership) => (
    membership.workspaceId === workspaceId && workspaceManagerRoles.includes(membership.role)
  ));
}

export async function requireWorkspaceMutationAccess(workspaceId?: string) {
  const session = await requireConsoleAccess(workspaceManagerRoles);

  if (!canManageWorkspace(session, workspaceId)) {
    redirect("/login?error=No tienes permisos para esta marca.");
  }

  return session;
}

export { formatRole };
