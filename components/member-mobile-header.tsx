"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ size?: number }>;
};

const TITLES: Record<string, string> = {
  "/app": "Panel",
  "/app/workouts": "Entreno",
  "/app/meals": "Comida",
  "/app/progress": "Progreso",
  "/app/support": "Soporte",
  "/app/habits": "Hábitos",
  "/app/recipes": "Recetas",
  "/app/diary": "Diario",
  "/app/cardio": "Cardio",
  "/app/guides": "Guías",
  "/app/profile": "Perfil",
  "/app/onboarding": "Inicio",
};

function titleFor(pathname: string, fallback: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((key) => key !== "/app")
    .find((key) => pathname.startsWith(key));
  return match ? TITLES[match] : fallback;
}

export function MemberMobileHeader({ brand, nav }: { brand?: WorkspaceBrand; nav: NavItem[] }) {
  const pathname = usePathname() || "/app";
  const [open, setOpen] = useState(false);
  const title = titleFor(pathname, brand?.name ?? "App");

  return (
    <header className="memberMobileHeader">
      <button className="memberHeaderBtn" type="button" aria-label="Abrir menú" onClick={() => setOpen(true)}>
        <Menu size={22} />
      </button>
      <strong className="memberHeaderTitle">{title}</strong>
      <Link className="memberHeaderBtn" href="/app/support" aria-label="Avisos y soporte">
        <Bell size={20} />
      </Link>

      {open ? (
        <div className="memberDrawer" role="dialog" aria-modal="true">
          <button className="memberDrawerBackdrop" type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
          <nav className="memberDrawerPanel">
            <div className="memberDrawerHead">
              <span className="memberHeaderTitle">{brand?.name ?? "App"}</span>
              <button className="memberHeaderBtn" type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {nav.map((item) => {
              const Icon = item.icon;
              const href = item.href ?? "/app";
              const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={active ? "memberDrawerItem active" : "memberDrawerItem"} onClick={() => setOpen(false)}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
