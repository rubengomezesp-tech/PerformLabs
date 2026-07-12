// Minimal service worker for installability + offline shell fallback.
const CACHE = "performlabs-shell-v3";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  // Precache the offline shell so a failed navigation has something to show.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Cache ONLY static, immutable assets. Navigations, RSC fetches, Server Actions
// and API calls must always reach the network untouched, so the app's dynamic
// logic (auth, onboarding submit, redirects) is never served a stale or invalid
// response. The previous version returned `undefined` from the catch (cache miss),
// which made respondWith throw "Failed to convert value to 'Response'" and broke
// navigation — that's what stopped the onboarding from completing.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Top-level navigations: network-first so auth, redirects, RSC and Server
  // Actions are never served stale; fall back to the offline shell only when
  // the network is unreachable. Server Actions are POST (returned above) and
  // RSC fetches aren't mode === "navigate", so neither path is affected.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((cached) => cached || Response.error())),
    );
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|mjs|woff2?|png|jpe?g|svg|webp|gif|ico)$/.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    }),
  );
});

// Proactive push notifications (motivational reminders, "you haven't trained" nudges).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil((async () => {
    let manifestName = "";
    if (!data.title) {
      try {
        const response = await fetch("/manifest.webmanifest", { cache: "no-store" });
        const manifest = response.ok ? await response.json() : null;
        manifestName = typeof manifest?.name === "string" ? manifest.name : "";
      } catch (_) {}
    }

    const title = data.title || manifestName || "Coach App";
    await self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "coach-app",
      icon: "/api/pwa-icon?size=192",
      badge: "/api/pwa-icon?size=192&maskable=1",
      data: { url: data.url || "/app" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
