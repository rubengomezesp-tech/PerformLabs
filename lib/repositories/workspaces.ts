import { childApps } from "@/lib/data";
import { tenant } from "@/lib/data";
import { appSettingDefinitions, defaultMemberAppPages } from "@/lib/domain/platform-logic";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type WorkspaceSummary = {
  id: string;
  name: string;
  appName: string;
  owner: string;
  supportEmail: string;
  domain: string;
  status: string;
  isActive: boolean;
  accentColor: string;
  members: number;
  mrr: string;
};

export type WorkspaceInput = {
  id?: string;
  name: string;
  appName: string;
  customDomain: string;
  supportEmail: string;
  accentColor: string;
};

export type WorkspaceBrand = {
  id: string;
  name: string;
  appName: string;
  supportEmail: string;
  domain: string;
  accentColor: string;
  isActive: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function cleanOptional(value: string) {
  return value.trim() || null;
}

function normalizeHexColor(value: string) {
  const color = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#d8bd6b";
}

function fallbackWorkspaces(): WorkspaceSummary[] {
  return childApps.map((app) => ({
    id: app.name,
    name: app.name,
    appName: app.name,
    owner: app.owner,
    supportEmail: app.owner,
    domain: app.domain,
    status: app.status,
    isActive: app.status === "Activa",
    accentColor: "#d8bd6b",
    members: app.members,
    mrr: app.mrr,
  }));
}

function fallbackBrand(): WorkspaceBrand {
  return {
    id: tenant.slug,
    name: tenant.name,
    appName: tenant.appName,
    supportEmail: tenant.supportEmail,
    domain: "rubengomezelite.com",
    accentColor: tenant.accent,
    isActive: true,
  };
}

function isInternalWorkspace(workspace: { name: string; slug: string }) {
  return workspace.slug === "coachos-mother-platform" || workspace.name.toLowerCase().includes("mother platform");
}

async function seedBaseWorkspaceApp(
  supabase: any,
  input: {
    workspaceId: string;
    workspaceName: string;
    customDomain: string | null;
    accentColor: string;
  },
) {
  const publicUrl = input.customDomain ? `https://${input.customDomain}` : "";
  const settingOverrides: Record<string, string | boolean | number | Record<string, unknown>> = {
    "pwa.short_name": input.workspaceName.slice(0, 24),
    "pwa.description": `${input.workspaceName} app de coaching, entrenamiento y nutricion.`,
    "pwa.theme_color": input.accentColor,
    "support.website_url": publicUrl,
  };

  const settingsPayload = appSettingDefinitions.map((setting) => ({
    workspace_id: input.workspaceId,
    key: setting.key,
    value: settingOverrides[setting.key] ?? setting.defaultValue,
    updated_at: new Date().toISOString(),
  }));

  const settingsResult = await (supabase as any)
    .from("app_settings")
    .upsert(settingsPayload, { onConflict: "workspace_id,key" });

  if (settingsResult.error) {
    throw new Error(`No se pudo preparar la configuracion base: ${settingsResult.error.message}`);
  }

  const contentResult = await (supabase as any)
    .from("content_pages")
    .upsert([
      {
        workspace_id: input.workspaceId,
        title: "Bienvenida",
        slug: "bienvenida",
        status: "draft",
        body: {
          title: `Bienvenido a ${input.workspaceName}`,
          notes: "Preparar bienvenida, normas de uso y primeros pasos del cliente.",
        },
      },
      {
        workspace_id: input.workspaceId,
        title: "Soporte",
        slug: "soporte",
        status: "draft",
        body: {
          title: "Soporte",
          notes: "Definir canales, tiempos de respuesta y mensajes iniciales.",
        },
      },
    ], { onConflict: "workspace_id,slug" })
    .select("id,slug");

  if (contentResult.error) {
    throw new Error(`No se pudo crear el contenido base: ${contentResult.error.message}`);
  }

  const contentPageBySlug = new Map((contentResult.data ?? []).map((page: any) => [page.slug, page.id]));
  const appPages = defaultMemberAppPages.map((page) => ({
    workspace_id: input.workspaceId,
    title: page.title,
    route: page.route,
    page_type: page.pageType,
    menu_area: page.menuArea,
    sort_order: page.sortOrder,
    is_system: page.isSystem,
    status: "draft",
    content_page_id: page.route === "/app/guides"
      ? contentPageBySlug.get("bienvenida") ?? null
      : page.route === "/app/support"
        ? contentPageBySlug.get("soporte") ?? null
        : null,
  }));

  const appPagesResult = await (supabase as any)
    .from("app_pages")
    .upsert(appPages, { onConflict: "workspace_id,route" });

  if (appPagesResult.error) {
    throw new Error(`No se pudo crear la navegacion base: ${appPagesResult.error.message}`);
  }

  const existingProduct = await (supabase as any)
    .from("product_catalog_items")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .limit(1)
    .maybeSingle();

  if (!existingProduct.data?.id) {
    const productResult = await (supabase as any).from("product_catalog_items").insert({
      workspace_id: input.workspaceId,
      name: `Programa ${input.workspaceName}`,
      description: "Oferta principal pendiente de definir.",
      included_modules: ["entrenamiento", "nutricion", "contenido", "soporte"],
      status: "draft",
    });

    if (productResult.error) {
      throw new Error(`No se pudo crear el producto base: ${productResult.error.message}`);
    }
  }
}

export async function listWorkspaceSummaries(): Promise<{
  source: "supabase" | "mock";
  workspaces: WorkspaceSummary[];
}> {
  const env = getSupabaseServiceEnv();

  if (!env.ok) {
    return {
      source: "mock",
      workspaces: fallbackWorkspaces(),
    };
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,name,slug,app_name,custom_domain,support_email,is_active,accent_color,created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to load workspaces", error.message);
    return {
      source: "mock",
      workspaces: fallbackWorkspaces(),
    };
  }

  const visibleWorkspaces = data.filter((workspace) => !isInternalWorkspace(workspace));

  return {
    source: "supabase",
    workspaces: visibleWorkspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      appName: workspace.app_name,
      owner: workspace.support_email ?? "Sin owner asignado",
      supportEmail: workspace.support_email ?? "",
      domain: workspace.custom_domain ?? `${workspace.name.toLowerCase().replace(/\s+/g, "-")}.coachos.local`,
      status: workspace.is_active ? "Activa" : "Pausada",
      isActive: workspace.is_active,
      accentColor: workspace.accent_color,
      members: 0,
      mrr: "0€",
    })),
  };
}

export async function createWorkspace(input: WorkspaceInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre de la marca es obligatorio.");
  }

  const slugBase = slugify(name);
  if (!slugBase) {
    throw new Error("El nombre necesita letras o numeros para crear el slug.");
  }

  const supabase = createServiceSupabaseClient();
  const customDomain = cleanOptional(input.customDomain);
  const accentColor = normalizeHexColor(input.accentColor);
  const { data, error } = await supabase.from("workspaces").insert({
    name,
    slug: `${slugBase}-${Date.now().toString(36)}`,
    app_name: input.appName.trim() || name,
    custom_domain: customDomain,
    support_email: cleanOptional(input.supportEmail),
    accent_color: accentColor,
  }).select("id").single();

  if (error || !data) {
    throw new Error(`No se pudo crear la marca: ${error?.message ?? "error desconocido"}`);
  }

  await seedBaseWorkspaceApp(supabase, {
    workspaceId: data.id,
    workspaceName: input.appName.trim() || name,
    customDomain,
    accentColor,
  });

  return data.id as string;
}

export async function getWorkspaceBrand(workspaceId?: string): Promise<WorkspaceBrand> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !workspaceId) {
    return fallbackBrand();
  }

  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("workspaces")
    .select("id,name,app_name,custom_domain,support_email,is_active,accent_color,created_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (result.error || !result.data) {
    return fallbackBrand();
  }

  const workspace = result.data;

  return {
    id: workspace.id,
    name: workspace.name,
    appName: workspace.app_name,
    supportEmail: workspace.support_email ?? tenant.supportEmail,
    domain: workspace.custom_domain ?? `${workspace.name.toLowerCase().replace(/\s+/g, "-")}.coachos.local`,
    accentColor: workspace.accent_color,
    isActive: workspace.is_active,
  };
}

export async function updateWorkspace(input: WorkspaceInput) {
  if (!input.id) {
    throw new Error("Falta el ID de la marca.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre de la marca es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("workspaces")
    .update({
      name,
      app_name: input.appName.trim() || name,
      custom_domain: cleanOptional(input.customDomain),
      support_email: cleanOptional(input.supportEmail),
      accent_color: normalizeHexColor(input.accentColor),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar la marca: ${error.message}`);
  }
}

export async function setWorkspaceActive(id: string, isActive: boolean) {
  if (!id) {
    throw new Error("Falta el ID de la marca.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("workspaces")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo cambiar el estado de la marca: ${error.message}`);
  }
}
