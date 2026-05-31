import { cookies, headers } from "next/headers";
import {
  Activity,
  Apple,
  BarChart3,
  BookOpen,
  ClipboardList,
  Dumbbell,
  Flame,
  LayoutDashboard,
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

const selectedWorkspaceCookie = "performlabs_workspace_id";

type MemberNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

const iconByPageType: Record<string, React.ComponentType<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  onboarding: ClipboardList,
  workouts: Dumbbell,
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
function isTenantHost(host: string): boolean {
  const value = host.split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!value || value === "performlabs.app" || value === "localhost" || value === "127.0.0.1") {
    return false;
  }
  if (value.endsWith(".vercel.app")) {
    return false;
  }
  return true;
}

function toNavItem(page: MemberAppPage): MemberNavItem {
  return {
    label: page.title,
    href: page.route,
    icon: iconByPageType[page.pageType] ?? LayoutDashboard,
  };
}

export async function getSelectedMemberAppBrand(): Promise<WorkspaceBrand> {
  const workspaceId = await getSelectedWorkspaceId();
  const host = await getRequestHost();

  // On a trainer's own domain the host wins (the domain IS the tenant). Off a
  // tenant domain (platform apex, a *.vercel.app preview, localhost) the host
  // can never match a workspace, so resolving by it just yields the synthetic
  // zero-UUID fallback brand — fine to *show*, but fatal the moment its id is
  // used as a workspace_id (FK violation). Use the selected-workspace cookie, or
  // let getWorkspaceBrand pick the first real workspace, so brand.id is always a
  // real workspace the member app can write against.
  const reference = isTenantHost(host) ? host : (workspaceId || "");
  return getWorkspaceBrand(reference);
}

export async function getSelectedMemberAppShell(): Promise<{
  brand: WorkspaceBrand;
  nav: MemberNavItem[];
}> {
  const brand = await getSelectedMemberAppBrand();
  const pages = await listWorkspaceAppPages(brand.id);
  const nav = pages
    .filter((page) => page.menuArea === "main")
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(toNavItem);

  return {
    brand,
    nav,
  };
}

export { selectedWorkspaceCookie };
