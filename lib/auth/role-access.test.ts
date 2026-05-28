import { describe, expect, it } from "vitest";
import {
  canInviteWorkspaceRole,
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
});
