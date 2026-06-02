import type { MetadataRoute } from "next";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getSelectedMemberAppBrand();
  const dark = brand.backgroundColor || "#0d0d10";
  const shortName = (brand.appName || brand.name || "App").slice(0, 12);

  return {
    // Stable identity so the install isn't re-keyed if start_url ever changes.
    id: "/app",
    name: brand.name,
    short_name: shortName,
    description: `${brand.name}: entrenamiento, nutrición y progreso.`,
    lang: "es",
    dir: "ltr",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: dark,
    theme_color: dark,
    // Store taxonomy (Play/PWA listings read this).
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // El apple-touch-icon (app/apple-icon.png) lo expone Next como <link rel="apple-touch-icon">;
      // no va en el array del manifest. Declararlo aquí como 180x180 cuando el PNG real es 512x512
      // hacía que Chrome lo rechazara ("resource isn't a valid image").
    ],
    // Long-press app-icon shortcuts — native-feel quick entry into the core tabs.
    shortcuts: [
      { name: "Entreno de hoy", short_name: "Entreno", url: "/app/workouts", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Comidas", short_name: "Comidas", url: "/app/meals", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Progreso", short_name: "Progreso", url: "/app/progress", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Coach", short_name: "Coach", url: "/app/coach-ai", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
