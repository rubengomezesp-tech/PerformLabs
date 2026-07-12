import { getWorkspaceBrand, type WorkspaceBrand } from "@/lib/repositories/workspaces";
import { isTenantHost, ZERO_UUID } from "@/lib/tenant-host-guard";

function isRealWorkspace(brand: WorkspaceBrand): boolean {
  return brand.id !== ZERO_UUID;
}

/**
 * Resolve the workspace that may be embedded in a member auth callback.
 *
 * A tenant host is authoritative: a hidden `w` value can confirm that tenant,
 * but can never switch the request to another workspace. On platform/preview
 * hosts there is no host tenant, so an explicit real workspace is required.
 */
export async function resolveMemberAccessWorkspace(
  host: string,
  workspaceReference?: string | null,
): Promise<WorkspaceBrand | null> {
  const reference = workspaceReference?.trim() ?? "";

  if (isTenantHost(host)) {
    const hostBrand = await getWorkspaceBrand(host);
    if (!isRealWorkspace(hostBrand)) return null;

    if (reference) {
      const requestedBrand = await getWorkspaceBrand(reference);
      if (!isRealWorkspace(requestedBrand) || requestedBrand.id !== hostBrand.id) {
        return null;
      }
    }

    return hostBrand;
  }

  if (!reference) return null;
  const requestedBrand = await getWorkspaceBrand(reference);
  return isRealWorkspace(requestedBrand) ? requestedBrand : null;
}
