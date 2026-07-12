import type { MetadataRoute } from "next";
import { platformBrand } from "@/lib/brand";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

const PLATFORM_BACKGROUND = "#0d0d10";

export const tenantPwaIconUrl = (size: 180 | 192 | 512, maskable = false) =>
  `/api/pwa-icon?size=${size}${maskable ? "&maskable=1" : ""}`;

export function workspacePwaIdentity(brand: WorkspaceBrand) {
  const name = brand.appName || brand.name;
  const shortName = (brand.pwaShortName || name || "Coach App").slice(0, 12);
  const description = brand.pwaDescription || `${name}: entrenamiento, nutrición y progreso.`;
  const backgroundColor = brand.backgroundColor || PLATFORM_BACKGROUND;
  const themeColor = brand.pwaThemeColor || backgroundColor || brand.accentColor;

  return { name, shortName, description, backgroundColor, themeColor };
}

export function brandMonogram(name: string): string {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return "APP";
  const first = words[0]!;
  if (words.length === 1) return first.slice(0, 3).toUpperCase();
  if (first.length <= 3) return first.slice(0, 3).toUpperCase();
  return `${first[0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function buildPwaManifest(brand: WorkspaceBrand | null): MetadataRoute.Manifest {
  if (!brand) {
    return {
      id: "/",
      name: platformBrand.name,
      short_name: platformBrand.name,
      description: "Premium coaching app implementation for performance brands",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: PLATFORM_BACKGROUND,
      theme_color: PLATFORM_BACKGROUND,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: platformBrand.markUrl, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };
  }

  const identity = workspacePwaIdentity(brand);
  return {
    id: "/app",
    name: identity.name,
    short_name: identity.shortName,
    description: identity.description,
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: identity.backgroundColor,
    theme_color: identity.themeColor,
    icons: [
      { src: tenantPwaIconUrl(192), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: tenantPwaIconUrl(512), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: tenantPwaIconUrl(512, true), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
