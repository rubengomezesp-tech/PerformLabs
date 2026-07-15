import Link from "next/link";
import { Fragment } from "react";
import { signOutAction } from "@/app/auth/actions";
import { CommandPalette } from "@/components/command-palette";
import { NavLink } from "@/components/nav-link";
import { platformBrand } from "@/lib/brand";
import type { ShellSession } from "@/components/page-shell";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";
import { workspaceBrandMarkUrl } from "@/lib/workspace-brand-assets";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/lib/i18n/config";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ size?: number }>;
  group?: string;
  children?: NavItem[];
};

export function Sidebar({
  nav,
  productLabel,
  brand,
  session,
  locale,
  i18nLabels,
}: {
  nav: NavItem[];
  active: string;
  productLabel: string;
  brand?: WorkspaceBrand;
  session?: ShellSession;
  locale?: Locale;
  i18nLabels?: { language: string; changeLanguage: string; signedIn: string; localMode: string; signOut: string };
}) {
  const displayBrand = brand ?? {
    appName: platformBrand.monogram,
    name: platformBrand.name,
    accentColor: platformBrand.accentColor,
  };
  const isPlatformShell = !brand;
  const markUrl = brand ? workspaceBrandMarkUrl(brand) : null;

  return (
    <aside className="sidebar">
      <Link className="brand" href={nav[0]?.href ?? "/"}>
        {isPlatformShell ? (
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
        ) : markUrl ? (
          <img className="brandLogoMark" src={markUrl} alt="" />
        ) : (
          <span className="brandMark" style={{ borderColor: displayBrand.accentColor, color: displayBrand.accentColor }}>
            {displayBrand.appName.slice(0, 3).toUpperCase()}
          </span>
        )}
        <span>
          <small>{productLabel}</small>
          <strong>{displayBrand.name}</strong>
        </span>
      </Link>
      {locale ? <LocaleSwitcher className="sidebarLocale" current={locale} label={i18nLabels?.language ?? "Idioma"} changeLabel={i18nLabels?.changeLanguage ?? "Cambiar idioma"} supportedLocales={["es", "en"]} /> : null}
      <CommandPalette
        items={nav.flatMap((item) =>
          item.children?.length
            ? item.children.filter((child) => child.href).map((child) => ({ label: child.label, href: child.href as string, group: item.label }))
            : item.href
              ? [{ label: item.label, href: item.href, group: item.group }]
              : [],
        )}
      />
      <nav className="nav">
        {nav.map((item, index) => {
          const Icon = item.icon;

          if (item.children?.length) {
            return (
              <details className="navFolder" key={item.label} open>
                <summary>
                  <Icon size={18} />
                  {item.label}
                </summary>
                <div className="navFolderItems">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink href={child.href ?? "#"} key={child.href}>
                        <ChildIcon size={16} />
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
              </details>
            );
          }

          const showGroup = Boolean(item.group) && item.group !== nav[index - 1]?.group;
          return (
            <Fragment key={item.href}>
              {showGroup ? <p className="navGroupLabel">{item.group}</p> : null}
              <NavLink href={item.href ?? "#"}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            </Fragment>
          );
        })}
      </nav>
      {session ? (
        <div className="sessionBadge">
          <span>{session.mode === "authenticated" ? (i18nLabels?.signedIn ?? "Estás dentro") : (i18nLabels?.localMode ?? "Modo local")}</span>
          <strong>{session.email}</strong>
          <small>{session.roleLabel}</small>
          {session.mode === "authenticated" ? (
            <form action={signOutAction}>
              <button type="submit">{i18nLabels?.signOut ?? "Cerrar sesión"}</button>
            </form>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
