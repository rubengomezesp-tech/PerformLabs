import { describe, expect, it } from "vitest";
import { localOpenSession, resolveConsoleSession, type ConsoleMembership } from "./console-session";

const ws = "11111111-1111-1111-1111-111111111111";

function membership(role: ConsoleMembership["role"], workspaceId = ws): ConsoleMembership {
  return {
    id: "m1",
    workspaceId,
    workspaceName: "Marca",
    workspaceSlug: "marca",
    workspaceAppName: "App",
    role,
  };
}

describe("localOpenSession", () => {
  it("is an open-mode session with full platform_owner access (demo/local only)", () => {
    const s = localOpenSession();
    expect(s.mode).toBe("open");
    expect(s.topRole).toBe("platform_owner");
    expect(s.memberships).toEqual([]);
  });
});

describe("resolveConsoleSession", () => {
  it("grants platform_owner to the bootstrap owner email when they hold no membership", () => {
    const s = resolveConsoleSession({ id: "u1", email: "Boss@Brand.com" }, [], "  boss@brand.com ");
    expect(s).not.toBeNull();
    expect(s!.mode).toBe("authenticated");
    expect(s!.topRole).toBe("platform_owner");
    expect(s!.user.email).toBe("boss@brand.com");
  });

  it("denies a membership-less user who is not the owner (or when no owner is configured)", () => {
    expect(resolveConsoleSession({ id: "u1", email: "nobody@brand.com" }, [], "boss@brand.com")).toBeNull();
    expect(resolveConsoleSession({ id: "u1", email: "boss@brand.com" }, [], undefined)).toBeNull();
    expect(resolveConsoleSession({ id: "u1", email: "boss@brand.com" }, [], "")).toBeNull();
  });

  it("derives topRole from the strongest membership", () => {
    const s = resolveConsoleSession(
      { id: "u1", email: "coach@brand.com" },
      [membership("coach_staff"), membership("coach_admin")],
      null,
    );
    expect(s!.topRole).toBe("coach_admin");
    expect(s!.memberships).toHaveLength(2);
  });

  it("never lets the owner-email fallback override a real (weaker) membership", () => {
    const s = resolveConsoleSession({ id: "u1", email: "boss@brand.com" }, [membership("coach_staff")], "boss@brand.com");
    expect(s!.topRole).toBe("coach_staff");
  });
});
