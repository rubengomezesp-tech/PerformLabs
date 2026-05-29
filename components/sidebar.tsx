import Link from "next/link";
import { Fragment } from "react";
import { CommandPalette } from "@/components/command-palette";
import { NavLink } from "@/components/nav-link";
import { platformBrand } from "@/lib/brand";
import type { ShellSession } from "@/components/page-shell";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  group?: string;
};

export function Sidebar({
  nav,
  productLabel,
  brand,
  session,
}: {
  nav: NavItem[];
  active: string;
  productLabel: string;
  brand?: WorkspaceBrand;
  session?: ShellSession;
}) {
  const displayBrand = brand ?? {
    appName: platformBrand.monogram,
    name: platformBrand.name,
    accentColor: platformBrand.accentColor,
  };
  const isPlatformShell = !brand;

  return (
    <aside className="sidebar">
      <Link className="brand" href={nav[0]?.href ?? "/"}>
        {isPlatformShell ? (
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
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
      <CommandPalette items={nav.map((item) => ({ label: item.label, href: item.href, group: item.group }))} />
      <nav className="nav">
        {nav.map((item, index) => {
          const Icon = item.icon;
          const showGroup = Boolean(item.group) && item.group !== nav[index - 1]?.group;

          return (
            <Fragment key={item.href}>
              {showGroup ? <p className="navGroupLabel">{item.group}</p> : null}
              <NavLink href={item.href}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            </Fragment>
          );
        })}
      </nav>
      {session ? (
        <div className="sessionBadge">
          <span>{session.mode === "authenticated" ? "Estás dentro" : "Modo local"}</span>
          <strong>{session.email}</strong>
          <small>{session.roleLabel}</small>
          {session.mode === "authenticated" ? <a href="/logout">Cerrar sesión</a> : null}
        </div>
      ) : null}
    </aside>
  );
}
