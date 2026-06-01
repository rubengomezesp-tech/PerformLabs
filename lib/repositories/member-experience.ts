import { contentPages } from "@/lib/data";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type MemberAppPage = {
  title: string;
  route: string;
  pageType: string;
  menuArea: string;
  sortOrder: number;
  status: string;
  isSystem: boolean;
};

export type MemberContentPage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  heading: string;
  notes: string;
};

export type MemberProduct = {
  id: string;
  name: string;
  description: string;
  includedModules: string[];
  status: string;
};

const defaultAppPages: MemberAppPage[] = [
  { title: "Panel", route: "/app", pageType: "dashboard", menuArea: "main", sortOrder: 10, status: "active", isSystem: true },
  { title: "Inicio", route: "/app/onboarding", pageType: "onboarding", menuArea: "main", sortOrder: 15, status: "active", isSystem: true },
  { title: "Entreno", route: "/app/workouts", pageType: "workouts", menuArea: "main", sortOrder: 20, status: "active", isSystem: true },
  { title: "Comida", route: "/app/meals", pageType: "nutrition", menuArea: "main", sortOrder: 30, status: "active", isSystem: true },
  { title: "Suplementos", route: "/app/supplements", pageType: "supplements", menuArea: "main", sortOrder: 32, status: "active", isSystem: true },
  { title: "Alimentos", route: "/app/foods", pageType: "foods", menuArea: "main", sortOrder: 34, status: "active", isSystem: true },
  { title: "Progreso", route: "/app/progress", pageType: "progress", menuArea: "main", sortOrder: 40, status: "active", isSystem: true },
  { title: "Hábitos", route: "/app/habits", pageType: "habits", menuArea: "main", sortOrder: 42, status: "active", isSystem: true },
  { title: "Cardio", route: "/app/cardio", pageType: "cardio", menuArea: "main", sortOrder: 45, status: "active", isSystem: true },
  { title: "Guías", route: "/app/guides", pageType: "content", menuArea: "main", sortOrder: 50, status: "active", isSystem: true },
  { title: "Comunidad", route: "/app/community", pageType: "community", menuArea: "main", sortOrder: 55, status: "active", isSystem: true },
  { title: "Retos", route: "/app/challenges", pageType: "challenges", menuArea: "main", sortOrder: 56, status: "active", isSystem: true },
  { title: "Coach IA", route: "/app/coach-ai", pageType: "coach_ai", menuArea: "main", sortOrder: 58, status: "active", isSystem: true },
  { title: "Soporte", route: "/app/support", pageType: "support", menuArea: "main", sortOrder: 60, status: "active", isSystem: true },
  { title: "Perfil", route: "/app/profile", pageType: "profile", menuArea: "main", sortOrder: 70, status: "active", isSystem: true },
];

function bodyValue(body: unknown, key: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "";
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function fallbackContentPages(): MemberContentPage[] {
  return contentPages.map((page, index) => ({
    id: `fallback-${index}`,
    title: page,
    slug: page.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    status: "active",
    heading: page,
    notes: "Contenido editable desde la consola del entrenador.",
  }));
}

export async function listWorkspaceAppPages(workspaceId?: string): Promise<MemberAppPage[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return defaultAppPages;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("app_pages")
    .select("title,route,page_type,menu_area,sort_order,status,is_system")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    if (error) {
      console.error("Unable to load member app pages", error.message);
    }

    return defaultAppPages;
  }

  const databasePages = data.map((page) => ({
    title: page.title,
    route: page.route,
    pageType: page.page_type,
    menuArea: page.menu_area,
    sortOrder: page.sort_order,
    status: page.status,
    isSystem: page.is_system,
  }));

  const databaseRoutes = new Set(databasePages.map((page) => page.route));
  const requiredDefaults = defaultAppPages.filter((page) => !databaseRoutes.has(page.route));

  return [...databasePages, ...requiredDefaults].sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function listWorkspaceContentPages(workspaceId?: string): Promise<MemberContentPage[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return fallbackContentPages();
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("content_pages")
    .select("id,title,slug,body,status,created_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "archived")
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    if (error) {
      console.error("Unable to load member content pages", error.message);
    }

    return fallbackContentPages();
  }

  return data.map((page) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    heading: bodyValue(page.body, "title") || page.title,
    notes: bodyValue(page.body, "notes") || "Contenido preparado por el equipo del entrenador.",
  }));
}

export async function listWorkspaceProducts(workspaceId?: string): Promise<MemberProduct[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return [];
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("product_catalog_items")
    .select("id,name,description,included_modules,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to load member products", error.message);
    return [];
  }

  return (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description ?? "Programa principal preparado por el equipo.",
    includedModules: product.included_modules,
    status: product.status,
  }));
}
