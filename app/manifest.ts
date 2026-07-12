import type { MetadataRoute } from "next";
import { buildPwaManifest } from "@/lib/pwa-branding";
import { getRequestBrandContext } from "@/lib/request-brand";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const context = await getRequestBrandContext();
  if (context.kind === "unknown-tenant") {
    return {
      id: "/",
      name: "App no disponible",
      short_name: "App",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0d0d10",
      theme_color: "#0d0d10",
      icons: [],
    };
  }
  return buildPwaManifest(context.kind === "tenant" ? context.brand : null);
}
