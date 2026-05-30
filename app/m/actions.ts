"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * One-step branded member access from the trainer's landing: send a passwordless
 * magic link that returns to THIS host and lands in /app. No password, no extra
 * page. Generic response (no email enumeration); `shouldCreateUser: false` so we
 * never create accounts here — the coach provisions the member.
 */
export async function enterAppAction(formData: FormData) {
  const raw = formData.get("email");
  const email = (typeof raw === "string" ? raw : "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    redirect("/m?error=" + encodeURIComponent("Escribe un email válido."));
  }

  const env = getSupabasePublicEnv();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const proto = headerStore.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");

  if (env.ok && host) {
    const supabase = createClient<Database>(env.url, env.anonKey, { auth: { persistSession: false } });
    await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${proto}://${host}/auth/callback?next=/app`,
      },
    });
  }

  redirect("/m?sent=1");
}
