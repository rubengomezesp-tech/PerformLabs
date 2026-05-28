import type { Metadata } from "next";
import { EntitlementGate } from "@/components/entitlement-gate";
import { PageShell } from "@/components/page-shell";
import { coachNav } from "@/lib/coach-console";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getWorkspaceEntitlement } from "@/lib/repositories/entitlements";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSelectedMemberAppBrand();

  return {
    title: `${brand.name} Coach Console`,
    description: `Consola del entrenador para gestionar ${brand.name}.`,
  };
}

export default async function CoachConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getSelectedMemberAppBrand();
  const entitlement = await getWorkspaceEntitlement(brand.id);

  return (
    <PageShell brand={brand} nav={coachNav} active="/coach" productLabel="Coach console">
      <EntitlementGate brand={brand} entitlement={entitlement} module="coach_console">
        {children}
      </EntitlementGate>
    </PageShell>
  );
}
