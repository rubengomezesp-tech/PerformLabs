import { describe, expect, it } from "vitest";
import { classifyRequestBrand } from "./request-brand";
import type { WorkspaceBrand } from "./repositories/workspaces";

const brand: WorkspaceBrand = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Fallback",
  appName: "Fallback",
  supportEmail: "support@example.com",
  domain: "example.com",
  publicDomain: "example.com",
  memberDomain: "app.example.com",
  fallbackSubdomain: "example.performlabs.app",
  accentColor: "#078df2",
  isActive: true,
};

describe("request brand context", () => {
  it("mantiene el apex como plataforma", () => {
    expect(classifyRequestBrand(false, brand, false)).toEqual({ kind: "platform", brand: null });
  });

  it("representa un host desconocido sin lanzar notFound desde metadata", () => {
    expect(classifyRequestBrand(true, brand, true)).toEqual({ kind: "unknown-tenant", brand: null });
  });

  it("devuelve la marca resuelta para un tenant válido", () => {
    expect(classifyRequestBrand(true, brand, false)).toEqual({ kind: "tenant", brand });
  });
});
