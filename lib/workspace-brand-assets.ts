import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

export function workspaceBrandMarkUrl(brand: WorkspaceBrand): string | null {
  return brand.faviconUrl || brand.pwaIconUrl || brand.logoUrl || null;
}

export function workspaceBrandLockupUrl(brand: WorkspaceBrand): string | null {
  return brand.logoUrl || workspaceBrandMarkUrl(brand);
}
