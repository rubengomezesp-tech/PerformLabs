import { MemberMobileHeader } from "@/components/member-mobile-header";
import { MobileBar } from "@/components/mobile-bar";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Sidebar } from "@/components/sidebar";
import type { Locale } from "@/lib/i18n/config";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ size?: number }>;
  group?: string;
  children?: NavItem[];
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
  variant,
  locale,
  i18nLabels,
  children,
}: {
  nav: NavItem[];
  active: string;
  productLabel: string;
  brand?: WorkspaceBrand;
  session?: ShellSession;
  variant?: "coach" | "console" | "app";
  locale?: Locale;
  i18nLabels?: { skip: string; language: string; changeLanguage: string; signedIn: string; localMode: string; signOut: string };
  children: React.ReactNode;
}) {
  return (
    <div
      className={variant ? `shell shell--${variant}` : "shell"}
      style={brand ? ({ "--accent": brand.accentColor } as React.CSSProperties) : undefined}
    >
      <a className="skip-link" href="#main">
        {i18nLabels?.skip ?? "Saltar al contenido"}
      </a>
      {variant === "app" ? (
        <MemberMobileHeader brand={brand} />
      ) : (
        <MobileBar brand={brand} href={nav[0]?.href ?? "/"} productLabel={productLabel} session={session} />
      )}
      <Sidebar brand={brand} nav={nav} active={active} productLabel={productLabel} session={session} locale={locale} i18nLabels={i18nLabels} />
      <main className="main" id="main" tabIndex={-1}>
        {children}
      </main>
      {variant === "app" ? <MobileTabBar /> : null}
    </div>
  );
}
