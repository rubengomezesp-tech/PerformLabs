import { describe, expect, it } from "vitest";
import { entitlementAllows, type WorkspaceEntitlement } from "./entitlements";

function entitlement(overrides: Partial<WorkspaceEntitlement> = {}): WorkspaceEntitlement {
  return {
    workspaceId: "w1",
    status: "active",
    modules: {
      member_app: true,
      coach_console: true,
      training: true,
      nutrition: true,
      checkins: true,
      content: true,
      notifications: true,
      billing: true,
    },
    contractRef: "",
    reason: "",
    enforcedAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("entitlementAllows", () => {
  it("denies every module when the entitlement is suspended/revoked/terminated", () => {
    for (const status of ["suspended", "revoked", "terminated"] as const) {
      expect(entitlementAllows(entitlement({ status }), "training")).toBe(false);
    }
  });

  it("allows a module under an operative status (active/past_due) unless explicitly disabled", () => {
    expect(entitlementAllows(entitlement({ status: "active" }), "training")).toBe(true);
    expect(entitlementAllows(entitlement({ status: "past_due" }), "training")).toBe(true);
  });

  it("denies a single module toggled off even while the status is active", () => {
    const e = entitlement({ modules: { ...entitlement().modules, nutrition: false } });
    expect(entitlementAllows(e, "nutrition")).toBe(false);
    expect(entitlementAllows(e, "training")).toBe(true);
  });
});
