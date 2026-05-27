import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getSelectedMemberAppBrand, getSelectedMemberAppShell } from "@/lib/member-app";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSelectedMemberAppBrand();

  return {
    title: brand.name,
    description: `${brand.name}: entrenamiento, nutricion, progreso y soporte.`,
  };
}

export default async function MemberAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { brand, nav } = await getSelectedMemberAppShell();

  return (
    <PageShell brand={brand} nav={nav} active="/app" productLabel="App cliente">
      {children}
    </PageShell>
  );
}
