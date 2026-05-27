import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

export function createServiceSupabaseClient() {
  const env = getSupabaseServiceEnv();

  if (!env.ok) {
    throw new Error(`Missing Supabase service env: ${env.missing.join(", ")}`);
  }

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
