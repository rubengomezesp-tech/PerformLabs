import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

export const RG_COACH_WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";

const RG_COACH_ASSETS = {
  logoUrl: "/brand/rg-coach/rg-lockup-horizontal.svg",
  faviconUrl: "/brand/rg-coach/rg-favicon.svg",
  signatureUrl: "/brand/rg-coach/ruben-gomez-signature.svg",
  pwaIconUrl: "/brand/rg-coach/rg-icon-512.png",
  pwaMaskableIconUrl: "/brand/rg-coach/rg-icon-maskable-512.png",
} as const;

export function withCanonicalWorkspaceBrandAssets(brand: WorkspaceBrand): WorkspaceBrand {
  if (brand.id !== RG_COACH_WORKSPACE_ID) return brand;

  return {
    ...brand,
    ...RG_COACH_ASSETS,
  };
}

export function workspaceBrandMarkUrl(brand: WorkspaceBrand): string | null {
  return brand.faviconUrl || brand.pwaIconUrl || brand.logoUrl || null;
}

export function workspaceBrandLockupUrl(brand: WorkspaceBrand): string | null {
  return brand.logoUrl || workspaceBrandMarkUrl(brand);
}
