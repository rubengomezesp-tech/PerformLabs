"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, Home, LineChart, MessageSquare, Utensils } from "lucide-react";

type Tab = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { label: "Hoy", href: "/app", icon: Home, match: (p) => p === "/app" },
  { label: "Entreno", href: "/app/workouts", icon: Dumbbell, match: (p) => p.startsWith("/app/workouts") || p.startsWith("/app/sessions") || p.startsWith("/app/cardio") || p.startsWith("/app/recovery") },
  { label: "Comidas", href: "/app/meals", icon: Utensils, match: (p) => p.startsWith("/app/meals") || p.startsWith("/app/recipes") || p.startsWith("/app/diary") },
  { label: "Progreso", href: "/app/progress", icon: LineChart, match: (p) => p.startsWith("/app/progress") },
  { label: "Soporte", href: "/app/support", icon: MessageSquare, match: (p) => p.startsWith("/app/support") || p.startsWith("/app/guides") },
];

export function MobileTabBar() {
  const pathname = usePathname() || "/app";
  const tabs = pathname.startsWith("/app/sessions")
    ? TABS.map((tab) => tab.label === "Entreno" ? { ...tab, label: "Sesiones", href: "/app/sessions", icon: CalendarDays } : tab)
    : TABS;

  return (
    <nav className="mobileTabBar" aria-label="Navegación principal">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "mobileTab active" : "mobileTab"} aria-current={active ? "page" : undefined}>
            <Icon size={21} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
