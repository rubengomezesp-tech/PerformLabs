import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkspaceBrand: vi.fn(),
}));

vi.mock("@/lib/repositories/workspaces", () => ({
  getWorkspaceBrand: mocks.getWorkspaceBrand,
}));

import { resolveMemberAccessWorkspace } from "./member-workspace";

const brandA = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "RG Coach",
  appName: "RG Coach",
};
const brandB = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Coach B",
  appName: "Coach B",
};
const fallbackBrand = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Marca genérica",
  appName: "Coach App",
};

describe("resolveMemberAccessWorkspace", () => {
  beforeEach(() => {
    mocks.getWorkspaceBrand.mockReset().mockImplementation(async (reference: string) => {
      if (["miembros.rubengomezcoaching.com", "rg-coach", brandA.id].includes(reference)) return brandA;
      if (["app.coach-b.com", "coach-b", brandB.id].includes(reference)) return brandB;
      return fallbackBrand;
    });
  });

  it("rejects a workspace B hint submitted from tenant host A", async () => {
    await expect(resolveMemberAccessWorkspace("miembros.rubengomezcoaching.com", brandB.id)).resolves.toBeNull();
  });

  it("binds a legitimate tenant request to the canonical host workspace", async () => {
    await expect(resolveMemberAccessWorkspace("miembros.rubengomezcoaching.com", "rg-coach")).resolves.toBe(brandA);
    await expect(resolveMemberAccessWorkspace("miembros.rubengomezcoaching.com")).resolves.toBe(brandA);
  });

  it("accepts an explicit real workspace on the platform host", async () => {
    await expect(resolveMemberAccessWorkspace("performlabs.app", "coach-b")).resolves.toBe(brandB);
  });

  it("rejects missing or unknown workspaces on a platform host", async () => {
    await expect(resolveMemberAccessWorkspace("performlabs.app", "")).resolves.toBeNull();
    await expect(resolveMemberAccessWorkspace("performlabs.app", "does-not-exist")).resolves.toBeNull();
  });
});
