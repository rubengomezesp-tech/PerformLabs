import { MobileBar } from "@/components/mobile-bar";
import { Sidebar } from "@/components/sidebar";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

export type ShellSession = {
  mode: "open" | "authenticated";
  email: string;
  roleLabel: string;
};

export function PageShell({
  nav,
  active,
  productLabel,
  brand,
  session,
  children,
}: {
  nav: NavItem[];
  active: string;
  productLabel: string;
  brand?: WorkspaceBrand;
  session?: ShellSession;
  children: React.ReactNode;
}) {
  return (
    <div className="shell" style={brand ? ({ "--accent": brand.accentColor } as React.CSSProperties) : undefined}>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <MobileBar brand={brand} href={nav[0]?.href ?? "/"} productLabel={productLabel} session={session} />
      <Sidebar brand={brand} nav={nav} active={active} productLabel={productLabel} session={session} />
      <main className="main" id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
