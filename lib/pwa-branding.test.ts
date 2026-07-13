import { describe, expect, it } from "vitest";
import { brandMonogram, buildPwaManifest, workspacePwaIdentity } from "./pwa-branding";
import type { WorkspaceBrand } from "./repositories/workspaces";

const rgBrand: WorkspaceBrand = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "RG Coach",
  appName: "RG Coach",
  supportEmail: "coach@example.com",
  domain: "miembros.rubengomezcoaching.com",
  publicDomain: "rubengomezcoaching.com",
  memberDomain: "miembros.rubengomezcoaching.com",
  fallbackSubdomain: "rg-coach.performlabs.app",
  accentColor: "#2f6bff",
  backgroundColor: "#050914",
  faviconUrl: "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-icon-512.png",
  pwaIconUrl: "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-icon-512.png",
  pwaMaskableIconUrl: "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-icon-maskable-512.png",
  pwaShortName: "RG Coach",
  pwaDescription: "Tu entrenamiento RG, siempre contigo.",
  pwaThemeColor: "#00d4ff",
  isActive: true,
};

describe("PWA white-label", () => {
  it("construye identidad e iconos propios para un tenant sin fugas de plataforma", () => {
    const manifest = buildPwaManifest(rgBrand);

    expect(workspacePwaIdentity(rgBrand)).toEqual({
      name: "RG Coach",
      shortName: "RG Coach",
      description: "Tu entrenamiento RG, siempre contigo.",
      backgroundColor: "#050914",
      themeColor: "#00d4ff",
    });
    expect(manifest).toMatchObject({
      id: "/app",
      name: "RG Coach",
      short_name: "RG Coach",
      start_url: "/app",
      background_color: "#050914",
      theme_color: "#00d4ff",
    });
    expect(JSON.stringify(manifest)).not.toContain("PerformLabs");
    expect(manifest.icons).toEqual([
      {
        src: "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("mantiene la identidad PerformLabs en el apex de plataforma", () => {
    const manifest = buildPwaManifest(null);
    expect(manifest).toMatchObject({ id: "/", name: "PerformLabs", start_url: "/" });
  });

  it("conserva el monograma RG y genera iniciales para otras marcas", () => {
    expect(brandMonogram("RG Coach")).toBe("RG");
    expect(brandMonogram("Laura Performance")).toBe("LP");
    expect(brandMonogram("Athletica")).toBe("ATH");
  });
});
