import { describe, expect, it } from "vitest";
import { shouldBlockUnknownTenantHost, ZERO_UUID } from "./tenant-host-guard";

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
