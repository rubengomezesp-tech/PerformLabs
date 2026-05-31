"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/**
 * Passwordless sign-in with Google (Supabase OAuth). On success the browser is
 * redirected to Google and back to /auth/callback on this host, where the global
 * AuthHashBridge activates the session and lands the member in /app.
 *
 * Activation (founder): enable the Google provider in Supabase Auth and create a
 * Google Cloud OAuth client. Until then the button shows a friendly message.
 */
export function GoogleSignInButton({ label = "Continuar con Google" }: { label?: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) {
        setError("El acceso con Google aún no está disponible. Usa tu email y contraseña.");
        setLoading(false);
      }
      // On success the browser navigates to Google — no further work here.
    } catch {
      setError("El acceso con Google aún no está disponible. Usa tu email y contraseña.");
      setLoading(false);
    }
  }

  return (
    <div className="googleSignIn">
      <button type="button" className="btn googleBtn" onClick={signIn} disabled={loading}>
        <GoogleMark />
        {loading ? "Conectando…" : label}
      </button>
      {error ? <p className="formMessage danger">{error}</p> : null}
    </div>
  );
}
