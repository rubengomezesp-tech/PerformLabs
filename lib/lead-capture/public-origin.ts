const RG_PUBLIC_HOSTS = new Set([
  "rubengomezcoaching.com",
  "www.rubengomezcoaching.com",
]);

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Browser CORS boundary for RG's public lead form. This is deliberately a small,
 * exact allow-list. Local origins are accepted only outside production so a
 * production browser can never use an arbitrary localhost page as a trusted UI.
 */
export function isAllowedCoachInquiryOrigin(
  rawOrigin: string | null,
  environment = process.env.NODE_ENV,
) {
  if (!rawOrigin) return false;
  try {
    const origin = new URL(rawOrigin);
    if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
      return false;
    }
    if (origin.protocol === "https:" && RG_PUBLIC_HOSTS.has(origin.hostname.toLowerCase()) && !origin.port) {
      return true;
    }
    return environment !== "production"
      && (origin.protocol === "http:" || origin.protocol === "https:")
      && isLocalHost(origin.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function coachInquiryCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}
