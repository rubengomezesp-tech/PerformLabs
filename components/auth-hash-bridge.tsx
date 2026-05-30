"use client";

import { useEffect, useState } from "react";

function validNextPath(value: string | null) {
  // Only a real same-origin path counts. Otherwise return null so the server
  // decides the destination by role (member → /app, staff → /console).
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }

  return value;
}

export function AuthHashBridge() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const nextPath = validNextPath(queryParams.get("next"));
    const expiresIn = Number.parseInt(hashParams.get("expires_in") || "", 10);

    setMessage("Activando tu sesión segura...");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    fetch("/auth/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        expiresIn: Number.isFinite(expiresIn) ? expiresIn : undefined,
        next: nextPath ?? undefined,
      }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo activar la sesión.");
        }

        window.location.assign(typeof payload.nextPath === "string" ? payload.nextPath : nextPath ?? "/app");
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
