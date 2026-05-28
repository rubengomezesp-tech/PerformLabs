export function isConsoleAuthRequired(env: Record<string, string | undefined> = process.env) {
  const isProductionLike = env.NODE_ENV === "production" || env.VERCEL === "1";

  if (env.COACHOS_AUTH_REQUIRED === "true") {
    return true;
  }

  if (env.COACHOS_AUTH_REQUIRED === "false") {
    return isProductionLike;
  }

  return isProductionLike;
}
