import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const env = getSupabasePublicEnv();

  if (!env.ok) {
    throw new Error(`Missing Supabase public env: ${env.missing.join(", ")}`);
  }

  return createClient<Database>(env.url, env.anonKey);
}
