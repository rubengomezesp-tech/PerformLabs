import type { Metadata } from "next";
import { EntitlementGate } from "@/components/entitlement-gate";
import { PageShell } from "@/components/page-shell";
import { formatRole, requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { getCoachNav } from "@/lib/coach-console";
import { getLocale } from "@/lib/i18n/server";
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
  const [brand, locale] = await Promise.all([getSelectedMemberAppBrand(), getLocale()]);
  const session = await requireWorkspaceMutationAccess(brand.id);
  const entitlement = await getWorkspaceEntitlement(brand.id);

  return (
    <PageShell
      brand={brand}
      nav={getCoachNav(locale)}
      active="/coach"
      productLabel={locale === "en" ? "Coach console" : "Panel del coach"}
      variant="coach"
      locale={locale}
      i18nLabels={locale === "en" ? {
        skip: "Skip to content", language: "Language", changeLanguage: "Change language", signedIn: "Signed in", localMode: "Local mode", signOut: "Sign out",
      } : undefined}
      session={{
        mode: session.mode,
        email: session.user.email,
        roleLabel: formatRole(session.topRole),
      }}
    >
      <EntitlementGate brand={brand} entitlement={entitlement} module="coach_console">
        {children}
      </EntitlementGate>
    </PageShell>
  );
}
