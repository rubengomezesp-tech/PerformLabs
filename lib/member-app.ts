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
  progress: BarChart3,
  habits: Flame,
  cardio: Activity,
  content: BookOpen,
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

  return getWorkspaceBrand(workspaceId || host);
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
