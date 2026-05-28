"use client";

import { useEffect, useState } from "react";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/console/security";
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
    const nextPath = safeNextPath(queryParams.get("next"));
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
        next: nextPath,
      }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo activar la sesión.");
        }

        window.location.assign(typeof payload.nextPath === "string" ? payload.nextPath : nextPath);
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
