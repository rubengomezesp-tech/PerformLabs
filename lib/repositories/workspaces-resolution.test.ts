import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseServiceEnv: () => ({
    ok: true as const,
    url: "https://example.supabase.co",
    serviceRoleKey: "test-service-role-key",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabaseClient: mocks.createServiceSupabaseClient,
}));

import { RG_COACH_WORKSPACE_ID } from "@/lib/workspace-brand-assets";
import { applyWorkspaceBrandSettings, resolveWorkspaceBrand, type WorkspaceBrand } from "./workspaces";

const workspace = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "RG Coach",
  slug: "rg-coach",
  app_name: "RG Coach",
  custom_domain: "rubengomezcoaching.com",
  public_domain: "rubengomezcoaching.com",
  member_domain: "miembros.rubengomezcoaching.com",
  fallback_subdomain: "rg-coach.performlabs.app",
  support_email: "coach@example.com",
  is_active: true,
  accent_color: "#078df2",
  created_at: "2026-07-12T00:00:00.000Z",
};

const settings = [
  { key: "brand.accent_color", value: "#2f6bff" },
  { key: "brand.background_color", value: "#050914" },
  { key: "brand.logo_url", value: "https://cdn.example.com/rg-logo.png" },
  { key: "brand.favicon_url", value: "https://cdn.example.com/rg-icon.png" },
  { key: "brand.signature_url", value: "https://cdn.example.com/rg-signature.png" },
  { key: "brand.hero_headline", value: "Tu plan de hoy" },
  { key: "pwa.short_name", value: "RG Coach" },
  { key: "pwa.description", value: "Entrena con tu plan RG." },
  { key: "pwa.theme_color", value: "#050914" },
  { key: "pwa.icon_url", value: "https://cdn.example.com/rg-app-icon.png" },
  { key: "pwa.maskable_icon_url", value: "https://cdn.example.com/rg-app-icon-maskable.png" },
];

function createSupabaseStub() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: workspace, error: null });
  const lookupSelect = vi.fn(() => ({
    or: vi.fn(() => ({
      limit: vi.fn(() => ({ maybeSingle })),
    })),
  }));
  const settingsSelect = vi.fn(() => ({
    eq: vi.fn(() => ({
      in: vi.fn().mockResolvedValue({ data: settings, error: null }),
    })),
  }));

  return {
    from: vi.fn((table: string) => {
      if (table === "app_settings") return { select: settingsSelect };
      return { select: lookupSelect };
    }),
  };
}

describe("resolveWorkspaceBrand", () => {
  beforeEach(() => {
    mocks.createServiceSupabaseClient.mockReset();
    mocks.createServiceSupabaseClient.mockReturnValue(createSupabaseStub());
  });

  it.each([
    ["slug", "rg-coach"],
    ["dominio público", "rubengomezcoaching.com"],
    ["dominio de miembros", "miembros.rubengomezcoaching.com"],
    ["subdominio provisional", "rg-coach.performlabs.app"],
    ["UUID", workspace.id],
  ])("aplica app_settings al resolver por %s", async (_label, reference) => {
    const brand = await resolveWorkspaceBrand(reference);

    expect(brand).toMatchObject({
      id: workspace.id,
      name: "RG Coach",
      accentColor: "#2f6bff",
      backgroundColor: "#050914",
      logoUrl: "https://cdn.example.com/rg-logo.png",
      faviconUrl: "https://cdn.example.com/rg-icon.png",
      signatureUrl: "https://cdn.example.com/rg-signature.png",
      heroHeadline: "Tu plan de hoy",
      pwaShortName: "RG Coach",
      pwaDescription: "Entrena con tu plan RG.",
      pwaThemeColor: "#050914",
      pwaIconUrl: "https://cdn.example.com/rg-app-icon.png",
      pwaMaskableIconUrl: "https://cdn.example.com/rg-app-icon-maskable.png",
    });
  });
});

describe("RG Coach asset defaults", () => {
  const rgBrand: WorkspaceBrand = {
    id: RG_COACH_WORKSPACE_ID,
    name: "Rubén Gómez Coaching",
    appName: "RG Coach",
    supportEmail: "coach@example.com",
    domain: "miembros.rubengomezcoaching.com",
    publicDomain: "rubengomezcoaching.com",
    memberDomain: "miembros.rubengomezcoaching.com",
    fallbackSubdomain: "rg-coach.performlabs.app",
    accentColor: "#2f6bff",
    isActive: true,
  };

  it("uses the isolated RG kit when the database has no asset rows", () => {
    expect(applyWorkspaceBrandSettings(rgBrand, [])).toMatchObject({
      logoUrl: "/brand/rg-coach/rg-lockup-horizontal.svg",
      faviconUrl: "/brand/rg-coach/rg-favicon.svg",
      signatureUrl: "/brand/rg-coach/ruben-gomez-signature.svg",
      pwaIconUrl: "/brand/rg-coach/rg-icon-512.png",
      pwaMaskableIconUrl: "/brand/rg-coach/rg-icon-maskable-512.png",
    });
  });

  it("replaces legacy RG asset settings with the approved canonical kit", () => {
    expect(
      applyWorkspaceBrandSettings(rgBrand, [
        { key: "brand.logo_url", value: "https://cdn.example.com/custom-logo.svg" },
        { key: "brand.signature_url", value: "https://cdn.example.com/custom-signature.svg" },
      ]),
    ).toMatchObject({
      logoUrl: "/brand/rg-coach/rg-lockup-horizontal.svg",
      signatureUrl: "/brand/rg-coach/ruben-gomez-signature.svg",
    });
  });

  it("does not apply RG assets to other workspaces", () => {
    const other = applyWorkspaceBrandSettings({ ...rgBrand, id: workspace.id, name: "Other Coach" }, []);
    expect(other.logoUrl).toBeUndefined();
    expect(other.signatureUrl).toBeUndefined();
  });
});
