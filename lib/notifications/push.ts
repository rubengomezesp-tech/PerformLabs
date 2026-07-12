import webpush from "web-push";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";

/**
 * Channel-agnostic push delivery. Today it sends Web Push (VAPID) — works on
 * Android/desktop PWAs and on iOS only when installed to the Home Screen (16.4+).
 * The native track (Capacitor/RN) swaps the transport for APNs/FCM without
 * changing the engine or the payload. Ships dark until VAPID keys are set.
 */
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.VAPID_CONTACT ?? "mailto:soporte@performlabs.app";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(CONTACT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
    return true;
  } catch {
    return false;
  }
}

export function isPushConfigured(): boolean {
  // Reflect actual usability, not just presence: ensureConfigured runs
  // setVapidDetails, which throws on malformed keys. Returning true when the keys
  // exist but are invalid made every send fail later with a generic error instead
  // of short-circuiting cleanly as "not configured".
  return ensureConfigured();
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

export type PushPayload = {
  title?: string;
  body: string;
  url?: string;
  tag?: string;
  workspaceId?: string;
};

export type PushSendResult = { ok: true } | { ok: false; gone: boolean; error: string };

type PushBrandLoader = (workspaceId: string) => Promise<{ appName: string; name: string }>;

/** Resolve every implicit notification title through the workspace brand. */
export async function resolvePushTitle(
  payload: Pick<PushPayload, "title" | "workspaceId">,
  loadBrand: PushBrandLoader = getWorkspaceBrand,
): Promise<string> {
  const explicit = payload.title?.trim();
  if (explicit) return explicit;
  if (payload.workspaceId) {
    try {
      const brand = await loadBrand(payload.workspaceId);
      return brand.appName.trim() || brand.name.trim() || "Coach App";
    } catch {
      // Push remains best-effort; a brand lookup outage must not fail the event.
    }
  }
  return "Coach App";
}

/** Sends one notification. `gone: true` means the subscription is dead (410/404) and should be pruned. */
export async function sendWebPush(target: PushTarget, payload: PushPayload): Promise<PushSendResult> {
  if (!ensureConfigured()) return { ok: false, gone: false, error: "Push no configurado." };

  try {
    const title = await resolvePushTitle(payload);
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify({
        title,
        body: payload.body,
        url: payload.url ?? "/app",
        tag: payload.tag ?? "coach-app",
      }),
    );
    return { ok: true };
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    const gone = statusCode === 404 || statusCode === 410;
    return { ok: false, gone, error: error instanceof Error ? error.message : "push error" };
  }
}
