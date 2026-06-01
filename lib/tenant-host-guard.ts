// Pure multi-tenant guard logic (no Next/DB imports) so it can be unit-tested.
// Used by lib/member-app.ts to decide whether to refuse an unknown tenant host.

/** The synthetic brand id getWorkspaceBrand returns when a host resolves to no workspace. */
export const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

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
