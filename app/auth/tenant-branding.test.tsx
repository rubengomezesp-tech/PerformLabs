import { isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestTenantBrand: vi.fn(),
  getSelectedMemberAppBrand: vi.fn(),
}));

vi.mock("@/app/auth/actions", () => ({
  memberSignInAction: vi.fn(),
  requestMemberAccessLinkAction: vi.fn(),
}));

vi.mock("@/components/google-signin-button", () => ({
  GoogleSignInButton: () => null,
}));

vi.mock("@/lib/member-app", () => ({
  getSelectedMemberAppBrand: mocks.getSelectedMemberAppBrand,
}));

vi.mock("@/lib/request-brand", () => ({
  getRequestTenantBrand: mocks.getRequestTenantBrand,
}));

import MemberAccessPage from "@/app/acceso/page";
import AuthCallbackPage from "@/app/auth/callback/page";

const tenantBrand = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "RG Coach",
  appName: "RG Coach",
  supportEmail: "coach@example.com",
  domain: "rubengomezcoaching.com",
  publicDomain: "rubengomezcoaching.com",
  memberDomain: "miembros.rubengomezcoaching.com",
  fallbackSubdomain: "rg-coach.performlabs.app",
  accentColor: "#2f6bff",
  isActive: true,
  logoUrl: "https://cdn.example.com/rg-logo.png",
};

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  return textContent((node.props as { children?: ReactNode }).children);
}

describe("tenant auth branding", () => {
  beforeEach(() => {
    mocks.getRequestTenantBrand.mockReset();
    mocks.getSelectedMemberAppBrand.mockReset().mockResolvedValue(tenantBrand);
  });

  it("hides the PerformLabs staff-console link on a tenant access host", async () => {
    mocks.getRequestTenantBrand.mockResolvedValue(tenantBrand);

    const page = await MemberAccessPage({ searchParams: Promise.resolve({}) });

    expect(textContent(page)).not.toContain("¿Eres entrenador o staff?");
  });

  it("keeps the staff-console link on the platform host", async () => {
    mocks.getRequestTenantBrand.mockResolvedValue(null);

    const page = await MemberAccessPage({ searchParams: Promise.resolve({}) });

    expect(textContent(page)).toContain("¿Eres entrenador o staff?");
    expect(textContent(page)).toContain("Entra a la consola");
  });

  it("uses tenant app copy during a member callback", async () => {
    mocks.getRequestTenantBrand.mockResolvedValue(tenantBrand);

    const page = await AuthCallbackPage();
    const copy = textContent(page);

    expect(copy).toContain("Activando tu sesión en");
    expect(copy).toContain("RG Coach");
    expect(copy).toContain("preparando tu entrada a la app");
    expect(copy).not.toContain("preparando tu entrada a la consola");
  });

  it("keeps PerformLabs console copy on the platform callback", async () => {
    mocks.getRequestTenantBrand.mockResolvedValue(null);

    const page = await AuthCallbackPage();
    const copy = textContent(page);

    expect(copy).toContain("Activando tu sesión en");
    expect(copy).toContain("PerformLabs");
    expect(copy).toContain("preparando tu entrada a la consola");
  });
});
