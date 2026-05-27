export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasValidAnonKey = anonKey && !anonKey.includes("PEGAR_");

  if (!url || !hasValidAnonKey) {
    return {
      ok: false as const,
      missing: [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !hasValidAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
      ].filter(Boolean) as string[],
    };
  }

  return { ok: true as const, url, anonKey };
}

export function getSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasValidServiceRoleKey = serviceRoleKey && !serviceRoleKey.includes("PEGAR_");

  if (!url || !hasValidServiceRoleKey) {
    return {
      ok: false as const,
      missing: [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !hasValidServiceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean) as string[],
    };
  }

  return { ok: true as const, url, serviceRoleKey };
}
