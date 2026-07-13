"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, BookOpen, ChefHat, ClipboardList, Dumbbell, Flame, Home, LineChart, Menu, MessageSquare, Moon, NotebookPen, Pill, Salad, Sparkles, Trophy, UserRound, Users, Utensils, X } from "lucide-react";
import { useModalA11y } from "@/components/use-modal-a11y";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";
import { workspaceBrandMarkUrl } from "@/lib/workspace-brand-assets";

const MENU = [
  { label: "Panel", href: "/app", icon: Home },
  { label: "Entreno", href: "/app/workouts", icon: Dumbbell },
  { label: "Comida", href: "/app/meals", icon: Utensils },
  { label: "Suplementos", href: "/app/supplements", icon: Pill },
  { label: "Alimentos", href: "/app/foods", icon: Salad },
  { label: "Recetas", href: "/app/recipes", icon: ChefHat },
  { label: "Diario", href: "/app/diary", icon: NotebookPen },
  { label: "Progreso", href: "/app/progress", icon: LineChart },
  { label: "Hábitos", href: "/app/habits", icon: Flame },
  { label: "Cardio", href: "/app/cardio", icon: Activity },
  { label: "Descanso", href: "/app/recovery", icon: Moon },
  { label: "Guías", href: "/app/guides", icon: BookOpen },
  { label: "Comunidad", href: "/app/community", icon: Users },
  { label: "Retos", href: "/app/challenges", icon: Trophy },
  { label: "Coach IA", href: "/app/coach-ai", icon: Sparkles },
  { label: "Soporte", href: "/app/support", icon: MessageSquare },
  { label: "Perfil", href: "/app/profile", icon: UserRound },
  { label: "Inicio", href: "/app/onboarding", icon: ClipboardList },
];

const TITLES: Record<string, string> = Object.fromEntries(MENU.map((item) => [item.href, item.label]));

function titleFor(pathname: string, fallback: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((key) => key !== "/app")
    .find((key) => pathname.startsWith(key));
  return match ? TITLES[match] : fallback;
}

export function MemberMobileHeader({ brand }: { brand?: WorkspaceBrand }) {
  const pathname = usePathname() || "/app";
  const [open, setOpen] = useState(false);
  const title = titleFor(pathname, brand?.name ?? "App");
  const markUrl = brand ? workspaceBrandMarkUrl(brand) : null;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useModalA11y({ open, onClose: () => setOpen(false), panelRef, triggerRef });

  return (
    <header className="memberMobileHeader">
      <button ref={triggerRef} className="memberHeaderBtn" type="button" aria-label="Abrir menú" onClick={() => setOpen(true)}>
        <Menu size={22} />
      </button>
      <span className="memberHeaderIdentity">
        {markUrl ? <img className="memberHeaderMark" src={markUrl} alt="" /> : null}
        <strong className="memberHeaderTitle">{title}</strong>
      </span>
      <Link className="memberHeaderBtn" href="/app/support" aria-label="Avisos y soporte">
        <Bell size={20} />
      </Link>

      {open ? (
        <div className="memberDrawer" role="dialog" aria-modal="true" aria-label={brand?.name ?? "Menú"}>
          <button className="memberDrawerBackdrop" type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
          <nav className="memberDrawerPanel" ref={panelRef} tabIndex={-1}>
            <div className="memberDrawerHead">
              <span className="memberHeaderIdentity">
                {markUrl ? <img className="memberHeaderMark" src={markUrl} alt="" /> : null}
                <span className="memberHeaderTitle">{brand?.name ?? "App"}</span>
              </span>
              <button className="memberHeaderBtn" type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {MENU.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={active ? "memberDrawerItem active" : "memberDrawerItem"} onClick={() => setOpen(false)}>
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
