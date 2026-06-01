export function isConsoleAuthRequired(env: Record<string, string | undefined> = process.env) {
  // Only an explicit dev/test runtime is treated as non-production. Anything
  // else — prod, Vercel, a self-hosted box, or NODE_ENV simply being unset —
  // is production-like and requires auth by default, so an unauthenticated
  // visitor can never resolve "the first member of a workspace" and read another
  // tenant's data just because a deploy forgot to set NODE_ENV=production.
  const isDevLike = env.NODE_ENV === "development" || env.NODE_ENV === "test";
  const isProductionLike = !isDevLike || env.VERCEL === "1";

  if (env.COACHOS_AUTH_REQUIRED === "true") {
    return true;
  }

  if (env.COACHOS_AUTH_REQUIRED === "false") {
    return isProductionLike;
  }

  return isProductionLike;
}
