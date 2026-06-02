import { highestRole, type WorkspaceRole } from "@/lib/auth/role-access";

// Pure console-session shapes + resolution, kept free of next/headers, cookies and
// Supabase so the access decision can be unit-tested. access-control.ts wires the I/O
// (cookie → verified user → memberships) around resolveConsoleSession.

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

/**
 * The local/demo session returned when console auth isn't required
 * (isConsoleAuthRequired === false). It grants full platform_owner access with no real
 * user, so it must ONLY ever be returned behind that gate — never on an authenticated
 * path.
 */
export function localOpenSession(): ConsoleSession {
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

/**
 * Resolve an authenticated console session from a verified user and their console
 * memberships. Security-critical: a user with no console membership is granted
 * platform_owner ONLY when their email matches the configured bootstrap owner
 * (COACHOS_OWNER_EMAIL); anyone else with no membership is denied (null). With
 * memberships, the role is the strongest one they hold — the owner-email fallback
 * never overrides a real membership.
 */
export function resolveConsoleSession(
  user: { id: string; email?: string | null },
  memberships: ConsoleMembership[],
  ownerEmail?: string | null,
): ConsoleSession | null {
  const email = user.email?.toLowerCase() ?? "";
  const owner = ownerEmail?.trim().toLowerCase();

  if (!memberships.length) {
    if (owner && email === owner) {
      return { mode: "authenticated", user: { id: user.id, email }, topRole: "platform_owner", memberships: [] };
    }
    return null;
  }

  return {
    mode: "authenticated",
    user: { id: user.id, email },
    topRole: highestRole(memberships.map((membership) => membership.role)),
    memberships,
  };
}
