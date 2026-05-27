"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeRedirectPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/console";
  }

  return value;
}

function createAuthClient() {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    throw new Error(`Faltan variables públicas: ${env.missing.join(", ")}`);
  }

  return createClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function signInAction(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");
  const nextPath = safeRedirectPath(readText(formData, "next"));
  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    redirect(`/login?error=${encodeURIComponent("No hemos podido iniciar sesión con esos datos.")}`);
  }

  await setAuthCookies({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  });

  redirect(nextPath);
}

export async function signUpAction(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");
  const fullName = readText(formData, "fullName");
  const supabase = createAuthClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/registro?error=${encodeURIComponent("No hemos podido crear la cuenta.")}`);
  }

  redirect("/login?success=Cuenta creada. Revisa tu email si hace falta confirmar el acceso.");
}

export async function signOutAction() {
  await clearAuthCookies();
  redirect("/login");
}
