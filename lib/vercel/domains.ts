// Vercel Domains API — registers a coach's custom domain on the project so Vercel
// serves it and provisions TLS. Dark-safe: no-ops until VERCEL_API_TOKEN +
// VERCEL_PROJECT_ID are set (mirrors the Stripe/push "configured" pattern). The
// network call only runs at runtime in production, never at build time.

type VercelEnv = { token: string; projectId: string; teamId: string; ok: boolean };

function getVercelEnv(): VercelEnv {
  const token = process.env.VERCEL_API_TOKEN ?? "";
  const projectId = process.env.VERCEL_PROJECT_ID ?? "";
  const teamId = process.env.VERCEL_TEAM_ID ?? "";
  return { token, projectId, teamId, ok: Boolean(token && projectId) };
}

export function isVercelDomainsConfigured(): boolean {
  return getVercelEnv().ok;
}

export type DomainRegisterResult = {
  /** Whether the Vercel API is configured at all. */
  configured: boolean;
  ok: boolean;
  alreadyExists?: boolean;
  error?: string;
};

/**
 * Add a custom domain to the Vercel project. Idempotent: a domain that already
 * exists (409) is treated as success. Returns configured:false when the token
 * isn't set, so callers degrade gracefully (the operator can add it by hand).
 */
export async function registerProjectDomain(domain: string): Promise<DomainRegisterResult> {
  const env = getVercelEnv();
  if (!env.ok) return { configured: false, ok: false };

  const name = domain.trim().toLowerCase();
  if (!name) return { configured: true, ok: false, error: "Dominio vacío." };

  const query = env.teamId ? `?teamId=${encodeURIComponent(env.teamId)}` : "";
  try {
    const response = await fetch(`https://api.vercel.com/v10/projects/${env.projectId}/domains${query}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.ok) return { configured: true, ok: true };
    if (response.status === 409) return { configured: true, ok: true, alreadyExists: true };
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    return { configured: true, ok: false, error: body.error?.message ?? `Vercel respondió ${response.status}` };
  } catch (error) {
    return { configured: true, ok: false, error: (error as Error).message };
  }
}
