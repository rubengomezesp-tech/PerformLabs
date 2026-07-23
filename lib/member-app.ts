import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  Activity,
  Apple,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Pill,
  Salad,
  Sparkles,
  Trophy,
  Users,
  UserRound,
} from "lucide-react";
import { listWorkspaceAppPages, type MemberAppPage } from "@/lib/repositories/member-experience";
import { getWorkspaceBrand, type WorkspaceBrand } from "@/lib/repositories/workspaces";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { isTenantHost, shouldBlockUnknownTenantHost } from "@/lib/tenant-host-guard";

const selectedWorkspaceCookie = "performlabs_workspace_id";

type MemberNavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: MemberNavItem[];
};

const primaryMemberPageTypes = ["dashboard", "workouts", "sessions", "nutrition", "progress", "habits", "support"];

const memberPageLabels: Record<string, string> = {
  dashboard: "Hoy",
  onboarding: "Mi ficha",
  workouts: "Entreno",
  sessions: "Sesiones",
  nutrition: "Comidas",
  progress: "Progreso",
  habits: "Hábitos",
  support: "Mensajes",
  content: "Guías",
};

const iconByPageType: Record<string, React.ComponentType<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  onboarding: ClipboardList,
  workouts: Dumbbell,
  sessions: CalendarDays,
  nutrition: Apple,
  supplements: Pill,
  foods: Salad,
  progress: BarChart3,
  habits: Flame,
  cardio: Activity,
  content: BookOpen,
  community: Users,
  challenges: Trophy,
  coach_ai: Sparkles,
  support: MessageSquare,
  profile: UserRound,
};

async function getSelectedWorkspaceId() {
  const cookieStore = await cookies();
  return cookieStore.get(selectedWorkspaceCookie)?.value;
}

async function getRequestHost() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
}

/**
 * A tenant host is a trainer's own subdomain/custom domain (e.g.
 * marca.performlabs.app or app.sumarca.com) — NOT the platform apex, localhost
 * or a Vercel preview URL. On a tenant host the brand is resolved from the host
 * so each trainer's domain shows their own app, regardless of any stale cookie.
 */
function toNavItem(page: MemberAppPage): MemberNavItem {
  return {
    label: memberPageLabels[page.pageType] ?? page.title,
    href: page.route,
    icon: iconByPageType[page.pageType] ?? LayoutDashboard,
  };
}

// Memoized per request (React cache): the layout (metadata, viewport, shell,
// requireMemberContext) and the page each resolve the brand, and under DB pool
// pressure an un-deduped extra lookup could transiently fail and yield the
// zero-UUID fallback brand — which then breaks member writes (isUuid). cache()
// collapses all calls in a request into one resolution, so every caller agrees.
export const getSelectedMemberAppBrand = cache(async (): Promise<WorkspaceBrand> => {
  const workspaceId = await getSelectedWorkspaceId();
  const host = await getRequestHost();
  const onTenantHost = isTenantHost(host);

  // On a trainer's own domain the host wins (the domain IS the tenant). Off a
  // tenant domain (platform apex, a *.vercel.app preview, localhost) the host
  // can never match a workspace, so resolving by it just yields the synthetic
  // zero-UUID fallback brand — fine to *show*, but fatal the moment its id is
  // used as a workspace_id (FK violation). Use the selected-workspace cookie, or
  // let getWorkspaceBrand pick the first real workspace, so brand.id is always a
  // real workspace the member app can write against.
  const reference = onTenantHost ? host : (workspaceId || "");
  const brand = await getWorkspaceBrand(reference);

  // L4: an unknown tenant host (a stranger's domain pointed at us) resolves to the
  // zero-UUID fallback. Refuse to serve it a generic look-alike brand — 404 instead.
  if (
    shouldBlockUnknownTenantHost({
      onTenantHost,
      brandId: brand.id,
      serviceEnvOk: getSupabaseServiceEnv().ok,
      isProduction: process.env.NODE_ENV === "production",
    })
  ) {
    notFound();
  }

  return brand;
});

export async function getSelectedMemberAppShell(): Promise<{
  brand: WorkspaceBrand;
  nav: MemberNavItem[];
}> {
  const brand = await getSelectedMemberAppBrand();
  const pages = await listWorkspaceAppPages(brand.id);
  const visiblePages = pages
    .filter((page) => page.menuArea === "main" && page.status === "active")
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const primaryPages = primaryMemberPageTypes.flatMap((pageType) => {
    const page = visiblePages.find((candidate) => candidate.pageType === pageType);
    return page ? [toNavItem(page)] : [];
  });
  const secondaryPages = visiblePages
    .filter((page) => !primaryMemberPageTypes.includes(page.pageType))
    .map(toNavItem);
  const nav: MemberNavItem[] = [
    ...primaryPages,
    ...(secondaryPages.length ? [{ label: "Más", icon: Menu, children: secondaryPages }] : []),
  ];

  return {
    brand,
    nav,
  };
}

export { selectedWorkspaceCookie };
