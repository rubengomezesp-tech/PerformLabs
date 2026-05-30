"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check } from "lucide-react";
import { subscribeMemberPushAction, unsubscribeMemberPushAction } from "@/app/app/push-actions";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type State = "loading" | "unsupported" | "idle" | "subscribed" | "denied" | "working";

export function PushOptIn() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(PUBLIC_KEY);
    if (!supported) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "subscribed" : "idle"))
      .catch(() => setState("idle"));
  }, []);

  async function enable() {
    if (!PUBLIC_KEY) return;
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      await subscribeMemberPushAction(
        { endpoint: json.endpoint ?? "", keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } },
        navigator.userAgent,
      );
      setState("subscribed");
    } catch {
      setState("idle");
    }
  }

  async function disable() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMemberPushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("idle");
    } catch {
      setState("subscribed");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <article className="card span12 pushOptIn">
      <div className="pushOptInIcon">{state === "subscribed" ? <BellRing color="var(--accent)" /> : <Bell color="var(--accent)" />}</div>
      <div className="pushOptInBody">
        <strong>
          {state === "subscribed" ? "Recordatorios activados" : "Activa tus recordatorios"}
        </strong>
        <p>
          {state === "denied"
            ? "Has bloqueado las notificaciones. Actívalas desde los ajustes de tu navegador para recibir recordatorios."
            : state === "subscribed"
              ? "Te avisaremos para que no falles a tu entreno, aunque tengas la app cerrada."
              : "Recibe avisos motivadores y recordatorios para entrenar, aunque no tengas la app abierta."}
        </p>
      </div>
      {state === "subscribed" ? (
        <button className="btn" type="button" onClick={disable}><BellOff size={16} /> Desactivar</button>
      ) : state === "denied" ? (
        <span className="tag">Bloqueado</span>
      ) : (
        <button className="btn primary" type="button" onClick={enable} disabled={state === "working"} aria-busy={state === "working"}>
          {state === "working" ? "Activando…" : <><Check size={16} /> Activar</>}
        </button>
      )}
    </article>
  );
}
