"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function validNextPath(value: string | null) {
  // Only a real same-origin path counts. Otherwise return null so the server
  // decides the destination by role (member → /app, staff → /console).
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }

  return value;
}

type SessionTokens = { accessToken: string; refreshToken: string; expiresIn?: number };

/**
 * Activates a session from two auth return shapes and hands the tokens to
 * /auth/session (which sets the httpOnly cookies and picks the destination):
 *  - Implicit hash (`#access_token=...`): magic links / Supabase invites.
 *  - PKCE code (`?code=...` on /auth/callback): OAuth (Google). The browser
 *    client holds the code_verifier from signInWithOAuth, so it can exchange it.
 */
export function AuthHashBridge() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);
    const hashAccess = hashParams.get("access_token");
    const hashRefresh = hashParams.get("refresh_token");

    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    const isCallback = window.location.pathname.startsWith("/auth/callback");
    const hasHashSession = Boolean(hashAccess && hashRefresh);
    const hasPkceCode = Boolean(code && isCallback);

    if (!hasHashSession && !hasPkceCode) {
      return;
    }

    const nextPath = validNextPath(queryParams.get("next"));
    const workspaceRef = queryParams.get("w");
    setMessage("Activando tu sesión segura...");

    async function resolveTokens(): Promise<SessionTokens> {
      if (hasHashSession) {
        const expiresIn = Number.parseInt(hashParams.get("expires_in") || "", 10);
        return {
          accessToken: hashAccess as string,
          refreshToken: hashRefresh as string,
          expiresIn: Number.isFinite(expiresIn) ? expiresIn : undefined,
        };
      }
      // PKCE (OAuth): exchange the authorization code for a session.
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);
      if (error || !data.session) {
        throw new Error("No se pudo activar la sesión.");
      }
      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      };
    }

    resolveTokens()
      .then((tokens) => {
        // Submit as a real navigation so the Set-Cookie on the 303 response is
        // reliably applied before the browser requests the destination (a fetch
        // response's Set-Cookie was not being carried to the next navigation).
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/auth/session";
        const addField = (name: string, value: string) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };
        addField("accessToken", tokens.accessToken);
        addField("refreshToken", tokens.refreshToken);
        if (tokens.expiresIn) addField("expiresIn", String(tokens.expiresIn));
        if (nextPath) addField("next", nextPath);
        if (workspaceRef) addField("w", workspaceRef);
        document.body.appendChild(form);
        form.submit();
      })
      .catch((error: Error) => {
        setMessage(error.message || "No se pudo activar la sesión.");
      });
  }, []);

  if (!message) {
    return null;
  }

  return <div className="authBridgeToast">{message}</div>;
}
