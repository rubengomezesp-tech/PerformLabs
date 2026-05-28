import { EntitlementGate } from "@/components/entitlement-gate";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getWorkspaceEntitlement, type EntitlementModule } from "@/lib/repositories/entitlements";

export async function WorkspaceModuleLayout({
  module,
  children,
}: {
  module: EntitlementModule;
  children: React.ReactNode;
}) {
  const brand = await getSelectedMemberAppBrand();
  const entitlement = await getWorkspaceEntitlement(brand.id);

  return (
    <EntitlementGate brand={brand} entitlement={entitlement} module={module}>
      {children}
    </EntitlementGate>
  );
}
