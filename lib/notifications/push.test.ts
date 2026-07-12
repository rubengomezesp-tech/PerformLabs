import { describe, expect, it, vi } from "vitest";
import { resolvePushTitle } from "./push";

describe("resolvePushTitle", () => {
  it("usa el título explícito sin consultar la marca", async () => {
    const loadBrand = vi.fn();
    await expect(resolvePushTitle({ title: "Plan actualizado", workspaceId: "workspace" }, loadBrand)).resolves.toBe("Plan actualizado");
    expect(loadBrand).not.toHaveBeenCalled();
  });

  it("usa el nombre de app del workspace como fallback white-label", async () => {
    const loadBrand = vi.fn().mockResolvedValue({ appName: "RG Coach", name: "Rubén Gómez Coaching" });
    await expect(resolvePushTitle({ workspaceId: "workspace" }, loadBrand)).resolves.toBe("RG Coach");
  });

  it("usa un fallback neutro si la marca no se puede resolver", async () => {
    const loadBrand = vi.fn().mockRejectedValue(new Error("DB unavailable"));
    await expect(resolvePushTitle({ workspaceId: "workspace" }, loadBrand)).resolves.toBe("Coach App");
  });
});
