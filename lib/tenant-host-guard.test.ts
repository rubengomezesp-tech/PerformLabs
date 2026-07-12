import { describe, expect, it } from "vitest";
import { isTenantHost, selectRequestHost, shouldBlockUnknownTenantHost, ZERO_UUID } from "./tenant-host-guard";

describe("selectRequestHost", () => {
  it("prioriza x-forwarded-host igual que metadata y autenticación", () => {
    expect(selectRequestHost("miembros.rubengomezcoaching.com", "performlabs.app"))
      .toBe("miembros.rubengomezcoaching.com");
    expect(selectRequestHost("tenant.example.com, proxy.internal", "proxy.internal"))
      .toBe("tenant.example.com");
  });

  it("usa host como fallback", () => {
    expect(selectRequestHost(null, "performlabs.app")).toBe("performlabs.app");
  });
});

describe("isTenantHost", () => {
  it("treats a trainer subdomain / custom domain as a tenant host", () => {
    expect(isTenantHost("coach.performlabs.app")).toBe(true);
    expect(isTenantHost("mitrainer.com")).toBe(true);
    expect(isTenantHost("WWW.MiTrainer.com:443")).toBe(true); // case + www + port normalized
  });

  it("never treats platform apex / localhost / *.vercel.app as a tenant host", () => {
    expect(isTenantHost("performlabs.app")).toBe(false);
    expect(isTenantHost("www.performlabs.app")).toBe(false);
    expect(isTenantHost("localhost")).toBe(false);
    expect(isTenantHost("127.0.0.1")).toBe(false);
    expect(isTenantHost("perform-labs-pcgg-git-main-discipline1.vercel.app")).toBe(false);
  });

  it("handles empty / nullish hosts safely", () => {
    expect(isTenantHost("")).toBe(false);
    expect(isTenantHost(null)).toBe(false);
    expect(isTenantHost(undefined)).toBe(false);
  });
});

describe("shouldBlockUnknownTenantHost (L4)", () => {
  const unknownTenantInProd = {
    onTenantHost: true,
    brandId: ZERO_UUID,
    serviceEnvOk: true,
    isProduction: true,
  };

  it("blocks an unknown tenant host in production when the DB was reachable", () => {
    expect(shouldBlockUnknownTenantHost(unknownTenantInProd)).toBe(true);
  });

  it("never blocks platform hosts (apex / *.vercel.app / localhost)", () => {
    expect(shouldBlockUnknownTenantHost({ ...unknownTenantInProd, onTenantHost: false })).toBe(false);
  });

  it("does not block when the host resolved to a real workspace", () => {
    expect(
      shouldBlockUnknownTenantHost({ ...unknownTenantInProd, brandId: "11111111-1111-1111-1111-111111111111" }),
    ).toBe(false);
  });

  it("does not block when Supabase is unconfigured (no site-wide 404 from an env outage)", () => {
    expect(shouldBlockUnknownTenantHost({ ...unknownTenantInProd, serviceEnvOk: false })).toBe(false);
  });

  it("does not block outside production (dev/preview keep the fallback)", () => {
    expect(shouldBlockUnknownTenantHost({ ...unknownTenantInProd, isProduction: false })).toBe(false);
  });
});
