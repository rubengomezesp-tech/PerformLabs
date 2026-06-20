// Pure multi-tenant guard logic (no Next/DB imports) so it can be unit-tested.
// Used by lib/member-app.ts to decide whether to refuse an unknown tenant host.

/** The synthetic brand id getWorkspaceBrand returns when a host resolves to no workspace. */
export const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * A tenant host = a trainer's own subdomain/custom domain — NOT the platform apex
 * (`performlabs.app`), localhost, or a `*.vercel.app` preview/system URL, all of
 * which legitimately serve the default brand and must never be treated as tenant
 * hosts. Centralized here (was triplicated in proxy.ts, lib/member-app.ts and
 * app/auth/session/route.ts) so the multi-tenant routing decision has a single,
 * tested source of truth — a divergence between copies would be an isolation bug.
 */
export function isTenantHost(host: string | null | undefined): boolean {
  const value = (host || "").split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!value || value === "performlabs.app" || value === "localhost" || value === "127.0.0.1") {
    return false;
  }
  return !value.endsWith(".vercel.app");
}

/**
 * L4 (multi-tenant hardening): should we 404 instead of serving the synthetic
 * zero-UUID brand?
 *
 * A tenant host (a trainer's subdomain/custom domain) that resolves to the
 * zero-UUID brand is a domain pointed at us that isn't a configured workspace —
 * serving it the generic fallback brand makes a stranger's domain look like a
 * live white-label product. We block it, but only when:
 *  - it really is a tenant host (platform apex / *.vercel.app / localhost use the
 *    default brand legitimately and must never be blocked),
 *  - the service DB was actually reachable (a missing Supabase env yields the same
 *    fallback; we don't turn a config outage into a site-wide 404), and
 *  - we're in production (dev/preview keep serving the fallback for convenience).
 */
export function shouldBlockUnknownTenantHost(params: {
  onTenantHost: boolean;
  brandId: string;
  serviceEnvOk: boolean;
  isProduction: boolean;
}): boolean {
  return params.onTenantHost && params.brandId === ZERO_UUID && params.serviceEnvOk && params.isProduction;
}
