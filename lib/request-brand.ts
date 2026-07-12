import { cache } from "react";
import { headers } from "next/headers";
import { getWorkspaceBrand, type WorkspaceBrand } from "@/lib/repositories/workspaces";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { isTenantHost, selectRequestHost, shouldBlockUnknownTenantHost } from "@/lib/tenant-host-guard";

export type RequestBrandContext =
  | { kind: "platform"; brand: null }
  | { kind: "tenant"; brand: WorkspaceBrand }
  | { kind: "unknown-tenant"; brand: null };

export function classifyRequestBrand(
  onTenantHost: boolean,
  brand: WorkspaceBrand,
  blockUnknownTenant: boolean,
): RequestBrandContext {
  if (!onTenantHost) return { kind: "platform", brand: null };
  if (blockUnknownTenant) return { kind: "unknown-tenant", brand: null };
  return { kind: "tenant", brand };
}

/**
 * Returns the tenant represented by the current host. The platform apex and
 * preview/local hosts intentionally return null so their metadata remains
 * PerformLabs instead of inheriting whichever workspace happens to be first.
 */
export const getRequestBrandContext = cache(async (): Promise<RequestBrandContext> => {
  const headerStore = await headers();
  const host = selectRequestHost(headerStore.get("x-forwarded-host"), headerStore.get("host"));
  const onTenantHost = isTenantHost(host);
  if (!onTenantHost) return { kind: "platform", brand: null };

  const brand = await getWorkspaceBrand(host);
  return classifyRequestBrand(
    onTenantHost,
    brand,
    shouldBlockUnknownTenantHost({
      onTenantHost: true,
      brandId: brand.id,
      serviceEnvOk: getSupabaseServiceEnv().ok,
      isProduction: process.env.NODE_ENV === "production",
    }),
  );
});

/** Backwards-compatible convenience for tenant-only consumers. */
export const getRequestTenantBrand = cache(async (): Promise<WorkspaceBrand | null> => {
  const context = await getRequestBrandContext();
  return context.kind === "tenant" ? context.brand : null;
});
