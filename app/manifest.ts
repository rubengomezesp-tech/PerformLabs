import type { MetadataRoute } from "next";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getSelectedMemberAppBrand();
  const dark = brand.backgroundColor || "#0d0d10";
  const shortName = (brand.appName || brand.name || "App").slice(0, 12);

  return {
    name: brand.name,
    short_name: shortName,
    description: `${brand.name}: entrenamiento, nutrición y progreso.`,
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: dark,
    theme_color: dark,
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
