// Minimal service worker for installability + offline shell fallback.
const CACHE = "performlabs-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
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
  const title = data.title || "PerformLabs";
  const options = {
    body: data.body || "",
    tag: data.tag || "performlabs",
    icon: "/icon.png",
    badge: "/icon.png",
    data: { url: data.url || "/app" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
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
