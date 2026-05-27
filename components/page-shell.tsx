import { MobileBar } from "@/components/mobile-bar";
import { Sidebar } from "@/components/sidebar";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

export function PageShell({
  nav,
  active,
  productLabel,
  brand,
  children,
}: {
  nav: NavItem[];
  active: string;
  productLabel: string;
  brand?: WorkspaceBrand;
  children: React.ReactNode;
}) {
  return (
    <div className="shell" style={brand ? ({ "--gold": brand.accentColor } as React.CSSProperties) : undefined}>
      <MobileBar brand={brand} href={nav[0]?.href ?? "/"} productLabel={productLabel} />
      <Sidebar brand={brand} nav={nav} active={active} productLabel={productLabel} />
      <main className="main">{children}</main>
    </div>
  );
}
