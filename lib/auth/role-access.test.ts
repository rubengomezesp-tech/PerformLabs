import { describe, expect, it } from "vitest";
import {
  canInviteWorkspaceRole,
  canManageWorkspace,
  consoleRoles,
  formatRole,
  highestRole,
  platformRoles,
  roleAllowed,
  workspaceManagerRoles,
} from "./role-access";

describe("role-access", () => {
  it("chooses the strongest workspace role", () => {
    expect(highestRole(["member", "coach_staff", "coach_admin"])).toBe("coach_admin");
    expect(highestRole(["agency_admin", "coach_admin", "platform_owner"])).toBe("platform_owner");
    expect(highestRole([])).toBe("member");
  });

  it("allows stronger roles through minimum-role checks", () => {
    expect(roleAllowed("platform_owner", platformRoles)).toBe(true);
    expect(roleAllowed("agency_admin", platformRoles)).toBe(true);
    expect(roleAllowed("coach_admin", platformRoles)).toBe(false);
    expect(roleAllowed("coach_staff", workspaceManagerRoles)).toBe(true);
    expect(roleAllowed("member", consoleRoles)).toBe(false);
    expect(roleAllowed("platform_owner", [])).toBe(false);
  });

  it("formats roles for the security console", () => {
    expect(formatRole("platform_owner")).toBe("Propietario plataforma");
    expect(formatRole("coach_staff")).toBe("Equipo coach");
    expect(formatRole("member")).toBe("Miembro");
  });

  it("limits operational invitations by actor role", () => {
    expect(canInviteWorkspaceRole("platform_owner", "platform_owner")).toBe(true);
    expect(canInviteWorkspaceRole("platform_owner", "agency_admin")).toBe(true);
    expect(canInviteWorkspaceRole("agency_admin", "coach_admin")).toBe(true);
    expect(canInviteWorkspaceRole("agency_admin", "platform_owner")).toBe(false);
    expect(canInviteWorkspaceRole("coach_admin", "coach_staff")).toBe(false);
    expect(canInviteWorkspaceRole("platform_owner", "member")).toBe(false);
  });

  describe("canManageWorkspace (tenant boundary)", () => {
    const ws = "11111111-1111-1111-1111-111111111111";
    const other = "22222222-2222-2222-2222-222222222222";

    it("lets platform/agency roles manage any workspace", () => {
      expect(canManageWorkspace({ topRole: "platform_owner", memberships: [] }, ws)).toBe(true);
      expect(canManageWorkspace({ topRole: "agency_admin", memberships: [] }, ws)).toBe(true);
      // platform roles don't even need a workspace target
      expect(canManageWorkspace({ topRole: "platform_owner", memberships: [] })).toBe(true);
    });

    it("lets a coach manage only the workspace they belong to", () => {
      const session = {
        topRole: "coach_admin" as const,
        memberships: [{ workspaceId: ws, role: "coach_admin" as const }],
      };
      expect(canManageWorkspace(session, ws)).toBe(true);
      // same coach, different tenant → denied (the multi-tenant boundary)
      expect(canManageWorkspace(session, other)).toBe(false);
      // no workspace target and not a platform role → denied
      expect(canManageWorkspace(session)).toBe(false);
    });

    it("denies a member-only session", () => {
      const session = {
        topRole: "member" as const,
        memberships: [{ workspaceId: ws, role: "member" as const }],
      };
      expect(canManageWorkspace(session, ws)).toBe(false);
    });

    it("denies coach_staff outside their workspace and allows inside", () => {
      const session = {
        topRole: "coach_staff" as const,
        memberships: [{ workspaceId: ws, role: "coach_staff" as const }],
      };
      expect(canManageWorkspace(session, ws)).toBe(true);
      expect(canManageWorkspace(session, other)).toBe(false);
    });
  });
});
