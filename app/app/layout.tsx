import type { Metadata, Viewport } from "next";
import { EntitlementGate } from "@/components/entitlement-gate";
import { PageShell } from "@/components/page-shell";
import { getSelectedMemberAppBrand, getSelectedMemberAppShell } from "@/lib/member-app";
import { getWorkspaceEntitlement } from "@/lib/repositories/entitlements";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSelectedMemberAppBrand();

  return {
    title: brand.name,
    description: `${brand.name}: entrenamiento, nutricion, progreso y soporte.`,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const brand = await getSelectedMemberAppBrand();

  return {
    themeColor: brand.backgroundColor || "#0d0d10",
  };
}

export default async function MemberAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { brand, nav } = await getSelectedMemberAppShell();
  const entitlement = await getWorkspaceEntitlement(brand.id);

  return (
    <PageShell brand={brand} nav={nav} active="/app" productLabel="App cliente" variant="app">
      <EntitlementGate brand={brand} entitlement={entitlement} module="member_app">
        {children}
      </EntitlementGate>
    </PageShell>
  );
}
