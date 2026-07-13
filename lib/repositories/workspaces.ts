import { cache } from "react";
import { childApps } from "@/lib/data";
import { tenant } from "@/lib/data";
import { appSettingDefinitions, defaultMemberAppPages } from "@/lib/domain/platform-logic";
import type { EntitlementModule, EntitlementStatus, WorkspaceEntitlement } from "@/lib/repositories/entitlements";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Json, TablesInsert } from "@/lib/supabase/types";
import { isUuid } from "@/lib/utils/uuid";

export type WorkspaceSummary = {
  id: string;
  name: string;
  appName: string;
  owner: string;
  supportEmail: string;
  domain: string;
  publicDomain: string;
  memberDomain: string;
  fallbackSubdomain: string;
  status: string;
  isActive: boolean;
  accentColor: string;
  members: number;
  mrr: string;
  entitlement: Pick<WorkspaceEntitlement, "status" | "reason" | "contractRef" | "enforcedAt" | "modules">;
};

export type WorkspaceInput = {
  id?: string;
  name: string;
  appName: string;
  /** Existing marketing website; it is never registered on the app project. */
  publicDomain: string;
  /** Dedicated client-app host; this is the only custom host registered in Vercel. */
  memberDomain: string;
  supportEmail: string;
  accentColor: string;
  /** Provisional subdomain label or full host; stored as fallback_subdomain. */
  subdomain?: string;
};

/** Turn an operator-typed value into a full `<sub>.performlabs.app` host. */
function toSubdomainHost(value?: string): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw.includes(".")) return normalizeDomain(raw) || null;
  const label = slugify(raw);
  return label ? `${label}.performlabs.app` : null;
}

export type WorkspaceBrand = {
  id: string;
  name: string;
  appName: string;
  supportEmail: string;
  domain: string;
  publicDomain: string;
  memberDomain: string;
  fallbackSubdomain: string;
  accentColor: string;
  isActive: boolean;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  signatureUrl?: string | null;
  backgroundColor?: string | null;
  heroHeadline?: string | null;
  heroSubtext?: string | null;
  heroImageUrl?: string | null;
  welcomeMessage?: string | null;
  pwaShortName?: string | null;
  pwaDescription?: string | null;
  pwaThemeColor?: string | null;
  pwaIconUrl?: string | null;
  pwaMaskableIconUrl?: string | null;
};

/** Editable brand fields persisted as per-workspace app_settings (brand.*). */
export type WorkspaceBrandingInput = {
  accentColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  heroHeadline?: string;
  heroSubtext?: string;
  heroImageUrl?: string;
  welcomeMessage?: string;
};

const BRAND_SETTING_KEYS = {
  accentColor: "brand.accent_color",
  backgroundColor: "brand.background_color",
  logoUrl: "brand.logo_url",
  faviconUrl: "brand.favicon_url",
  signatureUrl: "brand.signature_url",
  heroHeadline: "brand.hero_headline",
  heroSubtext: "brand.hero_subtext",
  heroImageUrl: "brand.hero_image_url",
  welcomeMessage: "brand.welcome_message",
  pwaShortName: "pwa.short_name",
  pwaDescription: "pwa.description",
  pwaThemeColor: "pwa.theme_color",
  pwaIconUrl: "pwa.icon_url",
  pwaMaskableIconUrl: "pwa.maskable_icon_url",
} as const;

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
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#078df2";
}

function normalizeDomain(value?: string | null) {
  return value
    ?.trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/g, "")
    .replace(/:\d+$/g, "")
    .toLowerCase() || "";
}

function memberDomainFor(publicDomain: string) {
  return publicDomain ? `miembros.${publicDomain}` : "";
}

export function resolveWorkspaceDomains(publicInput?: string | null, memberInput?: string | null) {
  const publicDomain = normalizeDomain(publicInput);
  const memberDomain = normalizeDomain(memberInput) || memberDomainFor(publicDomain);
  if (publicDomain && memberDomain === publicDomain) {
    throw new Error("El dominio de la app debe ser un subdominio distinto de la web pública.");
  }
  return { publicDomain, memberDomain };
}

type WorkspaceDomainRegistryRow = {
  workspace_id: string;
  domain: string;
};

export function findWorkspaceDomainCollision(
  requestedDomains: Array<string | null | undefined>,
  registryRows: WorkspaceDomainRegistryRow[],
  currentWorkspaceId?: string,
): string | null {
  const requested = new Set(requestedDomains.map(normalizeDomain).filter(Boolean));
  return registryRows.find((row) =>
    row.workspace_id !== currentWorkspaceId && requested.has(normalizeDomain(row.domain)))?.domain ?? null;
}

export function workspaceDomainWriteError(error: { code?: string; message?: string } | null | undefined, fallback: string) {
  const message = error?.message ?? "error desconocido";
  if (error?.code === "23505" && /domain|workspace_domains/i.test(message)) {
    return new Error("Ese dominio ya está asignado a otra marca. Libéralo primero o utiliza otro dominio.");
  }
  return new Error(`${fallback}: ${message}`);
}

async function assertWorkspaceDomainsAvailable(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  domains: Array<string | null | undefined>,
  currentWorkspaceId?: string,
) {
  const requested = [...new Set(domains.map(normalizeDomain).filter(Boolean))];
  if (!requested.length) return;

  let query = supabase
    .from("workspace_domains")
    .select("workspace_id,domain")
    .in("domain", requested);
  if (currentWorkspaceId) query = query.neq("workspace_id", currentWorkspaceId);

  const { data, error } = await query.limit(10);
  if (error) {
    throw new Error(`No se pudo comprobar la disponibilidad del dominio: ${error.message}`);
  }

  const collision = findWorkspaceDomainCollision(requested, data ?? [], currentWorkspaceId);
  if (collision) {
    throw new Error(`El dominio ${collision} ya está asignado a otra marca. Libéralo primero o utiliza otro dominio.`);
  }
}

function fallbackSubdomainFor(slugOrName: string) {
  const slug = slugify(slugOrName) || "app";
  return `${slug}.performlabs.app`;
}

function fallbackWorkspaces(): WorkspaceSummary[] {
  return childApps.map((app) => ({
    id: app.name,
    name: app.name,
    appName: app.name,
    owner: app.owner,
    supportEmail: app.owner,
    domain: app.domain,
    publicDomain: app.domain,
    memberDomain: memberDomainFor(app.domain),
    fallbackSubdomain: fallbackSubdomainFor(app.name),
    status: app.status,
    isActive: app.status === "Activa",
    accentColor: "#078df2",
    members: app.members,
    mrr: app.mrr,
    entitlement: {
      status: "active",
      reason: "",
      contractRef: "",
      enforcedAt: "",
      modules: {
        member_app: true,
        coach_console: true,
        training: true,
        nutrition: true,
        checkins: true,
        content: true,
        notifications: true,
        billing: true,
      },
    },
  }));
}

function fallbackBrand(): WorkspaceBrand {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name: tenant.name,
    appName: tenant.appName,
    supportEmail: tenant.supportEmail,
    domain: "tumarca.com",
    publicDomain: "tumarca.com",
    memberDomain: "miembros.tumarca.com",
    fallbackSubdomain: "marca-blanca.performlabs.app",
    accentColor: tenant.accent,
    isActive: true,
  };
}

function isInternalWorkspace(workspace: { name: string; slug: string }) {
  const name = workspace.name.toLowerCase();
  return workspace.slug === "platform" || name.includes("operativa") || name.includes("mother platform");
}

export function normalizeWorkspaceReference(value?: string | null) {
  const reference = normalizeDomain(value);
  if (!reference || reference === "localhost" || reference === "127.0.0.1") {
    return "";
  }

  // Reject anything outside a slug/domain/uuid charset before it reaches the
  // PostgREST .or() filter below: commas and parentheses are or() syntax, so a
  // crafted Host header or `performlabs_workspace_id` cookie like
  // `x,id.eq.<uuid>` could otherwise inject extra OR conditions. An invalid
  // reference resolves to the default brand (same as an unknown host), never a
  // chosen/internal one.
  if (!/^[a-z0-9.-]+$/.test(reference)) {
    return "";
  }

  return reference;
}

function domainsFor(workspace: {
  custom_domain: string | null;
  public_domain?: string | null;
  member_domain?: string | null;
  fallback_subdomain?: string | null;
  slug: string;
  name: string;
}) {
  const publicDomain = normalizeDomain(workspace.public_domain || workspace.custom_domain);
  const memberDomain = normalizeDomain(workspace.member_domain) || memberDomainFor(publicDomain);
  const fallbackSubdomain = normalizeDomain(workspace.fallback_subdomain) || fallbackSubdomainFor(workspace.slug || workspace.name);

  return {
    publicDomain,
    memberDomain,
    fallbackSubdomain,
    primaryDomain: publicDomain || fallbackSubdomain,
  };
}

function mapSummaryEntitlement(row?: {
  status: EntitlementStatus;
  modules: unknown;
  reason: string | null;
  contract_ref: string | null;
  enforced_at: string | null;
} | null): WorkspaceSummary["entitlement"] {
  const defaultModules: Record<EntitlementModule, boolean> = {
    member_app: true,
    coach_console: true,
    training: true,
    nutrition: true,
    checkins: true,
    content: true,
    notifications: true,
    billing: true,
  };
  const source = row?.modules && typeof row.modules === "object" ? row.modules as Record<string, unknown> : {};

  return {
    status: row?.status ?? "active",
    reason: row?.reason ?? "",
    contractRef: row?.contract_ref ?? "",
    enforcedAt: row?.enforced_at ?? "",
    modules: Object.fromEntries(
      Object.entries(defaultModules).map(([key, defaultValue]) => [key, typeof source[key] === "boolean" ? source[key] : defaultValue]),
    ) as Record<EntitlementModule, boolean>,
  };
}

async function seedBaseWorkspaceApp(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  input: {
    workspaceId: string;
    workspaceName: string;
    publicDomain: string | null;
    accentColor: string;
  },
) {
  const publicUrl = input.publicDomain ? `https://${input.publicDomain}` : "";
  const settingOverrides: Record<string, string | boolean | number | Record<string, unknown>> = {
    "pwa.short_name": input.workspaceName.slice(0, 24),
    "pwa.description": `${input.workspaceName} app de coaching, entrenamiento y nutricion.`,
    "pwa.theme_color": input.accentColor,
    "support.website_url": publicUrl,
  };

  const settingsPayload: TablesInsert<"app_settings">[] = appSettingDefinitions.map((setting) => ({
    workspace_id: input.workspaceId,
    key: setting.key,
    value: (settingOverrides[setting.key] ?? setting.defaultValue) as Json,
    updated_at: new Date().toISOString(),
  }));

  const settingsResult = await supabase
    .from("app_settings")
    .upsert(settingsPayload, { onConflict: "workspace_id,key" });

  if (settingsResult.error) {
    throw new Error(`No se pudo preparar la configuracion base: ${settingsResult.error.message}`);
  }

  const contentPages: TablesInsert<"content_pages">[] = [
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
  ];

  const contentResult = await supabase
    .from("content_pages")
    .upsert(contentPages, { onConflict: "workspace_id,slug" })
    .select("id,slug");

  if (contentResult.error) {
    throw new Error(`No se pudo crear el contenido base: ${contentResult.error.message}`);
  }

  const contentPageBySlug = new Map((contentResult.data ?? []).map((page) => [page.slug, page.id]));
  const appPages: TablesInsert<"app_pages">[] = defaultMemberAppPages.map((page) => ({
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

  const appPagesResult = await supabase
    .from("app_pages")
    .upsert(appPages, { onConflict: "workspace_id,route" });

  if (appPagesResult.error) {
    throw new Error(`No se pudo crear la navegacion base: ${appPagesResult.error.message}`);
  }

  const existingProduct = await supabase
    .from("product_catalog_items")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .limit(1)
    .maybeSingle();

  if (!existingProduct.data?.id) {
    const productResult = await supabase.from("product_catalog_items").insert({
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

function formatEuros(cents: number): string {
  return `${Math.round(cents / 100).toLocaleString("es-ES")} €`;
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
    .select("id,name,slug,app_name,custom_domain,public_domain,member_domain,fallback_subdomain,support_email,is_active,accent_color,created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to load workspaces", error.message);
    return {
      source: "mock",
      workspaces: fallbackWorkspaces(),
    };
  }

  const visibleWorkspaces = data.filter((workspace) => !isInternalWorkspace(workspace));
  const workspaceIds = visibleWorkspaces.map((workspace) => workspace.id);
  const entitlementResult = workspaceIds.length
    ? await supabase
        .from("workspace_entitlements")
        .select("workspace_id,status,modules,reason,contract_ref,enforced_at")
        .in("workspace_id", workspaceIds)
    : { data: [], error: null };
  const entitlementsByWorkspace = new Map(
    (entitlementResult.data ?? []).map((entitlement) => [entitlement.workspace_id, entitlement]),
  );

  // Real per-workspace member count + MRR (were hardcoded 0 / "0€"). member_subscriptions
  // is service-role only and post-dates the generated types, hence the cast.
  const membersByWorkspace = new Map<string, number>();
  const mrrCentsByWorkspace = new Map<string, number>();
  if (workspaceIds.length) {
    const [memberRows, subRows] = await Promise.all([
      supabase.from("member_profiles").select("workspace_id").in("workspace_id", workspaceIds),
      supabase.from("member_subscriptions").select("workspace_id,amount,status").in("workspace_id", workspaceIds),
    ]);
    for (const row of (memberRows.data ?? []) as Array<{ workspace_id: string }>) {
      membersByWorkspace.set(row.workspace_id, (membersByWorkspace.get(row.workspace_id) ?? 0) + 1);
    }
    for (const row of (subRows.data ?? []) as Array<{ workspace_id: string; amount: number | null; status: string | null }>) {
      if ((row.status ?? "").toLowerCase() !== "active") continue;
      mrrCentsByWorkspace.set(row.workspace_id, (mrrCentsByWorkspace.get(row.workspace_id) ?? 0) + (row.amount ?? 0));
    }
  }

  return {
    source: "supabase",
    workspaces: visibleWorkspaces.map((workspace) => {
      const { publicDomain, memberDomain, fallbackSubdomain, primaryDomain } = domainsFor(workspace);

      return {
        id: workspace.id,
        name: workspace.name,
        appName: workspace.app_name,
        owner: workspace.support_email ?? "Sin owner asignado",
        supportEmail: workspace.support_email ?? "",
        domain: primaryDomain,
        publicDomain,
        memberDomain,
        fallbackSubdomain,
        status: workspace.is_active ? "Activa" : "Pausada",
        isActive: workspace.is_active,
        accentColor: workspace.accent_color,
        members: membersByWorkspace.get(workspace.id) ?? 0,
        mrr: formatEuros(mrrCentsByWorkspace.get(workspace.id) ?? 0),
        entitlement: mapSummaryEntitlement(entitlementsByWorkspace.get(workspace.id)),
      };
    }),
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
  const { publicDomain, memberDomain } = resolveWorkspaceDomains(input.publicDomain, input.memberDomain);
  const accentColor = normalizeHexColor(input.accentColor);
  const slug = `${slugBase}-${Date.now().toString(36)}`;
  const fallbackSubdomain = fallbackSubdomainFor(slug);
  await assertWorkspaceDomainsAvailable(supabase, [publicDomain, memberDomain, fallbackSubdomain]);
  const { data, error } = await supabase.from("workspaces").insert({
    name,
    slug,
    app_name: input.appName.trim() || name,
    // Kept in sync for backward compatibility with pre-domain-split rows.
    custom_domain: publicDomain || null,
    public_domain: publicDomain || null,
    member_domain: memberDomain || null,
    fallback_subdomain: fallbackSubdomain,
    support_email: cleanOptional(input.supportEmail),
    accent_color: accentColor,
  }).select("id").single();

  if (error || !data) {
    throw workspaceDomainWriteError(error, "No se pudo crear la marca");
  }

  await seedBaseWorkspaceApp(supabase, {
    workspaceId: data.id,
    workspaceName: input.appName.trim() || name,
    publicDomain: publicDomain || null,
    accentColor,
  });

  const entitlementResult = await supabase
    .from("workspace_entitlements")
    .insert({
      workspace_id: data.id,
      status: "suspended",
      reason: "Pendiente de pago y activacion comercial.",
    });

  if (entitlementResult.error) {
    throw new Error(`No se pudo crear la licencia base: ${entitlementResult.error.message}`);
  }

  return data.id as string;
}

export function applyWorkspaceBrandSettings(
  brand: WorkspaceBrand,
  rows: Array<{ key: string; value: unknown }>,
): WorkspaceBrand {
  if (!rows.length) return brand;
  const map = new Map<string, string>();
  for (const row of rows) {
    const value = typeof row.value === "string" ? row.value : row.value == null ? "" : String(row.value);
    if (value.trim()) map.set(row.key, value.trim());
  }

  const accent = map.get(BRAND_SETTING_KEYS.accentColor);
  const background = map.get(BRAND_SETTING_KEYS.backgroundColor);

  return {
    ...brand,
    accentColor: accent ? normalizeHexColor(accent) : brand.accentColor,
    backgroundColor: background && /^#[0-9a-fA-F]{6}$/.test(background) ? background : brand.backgroundColor ?? null,
    logoUrl: map.get(BRAND_SETTING_KEYS.logoUrl) ?? brand.logoUrl ?? null,
    faviconUrl: map.get(BRAND_SETTING_KEYS.faviconUrl) ?? brand.faviconUrl ?? null,
    signatureUrl: map.get(BRAND_SETTING_KEYS.signatureUrl) ?? brand.signatureUrl ?? null,
    heroHeadline: map.get(BRAND_SETTING_KEYS.heroHeadline) ?? brand.heroHeadline ?? null,
    heroSubtext: map.get(BRAND_SETTING_KEYS.heroSubtext) ?? brand.heroSubtext ?? null,
    heroImageUrl: map.get(BRAND_SETTING_KEYS.heroImageUrl) ?? brand.heroImageUrl ?? null,
    welcomeMessage: map.get(BRAND_SETTING_KEYS.welcomeMessage) ?? brand.welcomeMessage ?? null,
    pwaShortName: map.get(BRAND_SETTING_KEYS.pwaShortName) ?? brand.pwaShortName ?? null,
    pwaDescription: map.get(BRAND_SETTING_KEYS.pwaDescription) ?? brand.pwaDescription ?? null,
    pwaThemeColor: map.get(BRAND_SETTING_KEYS.pwaThemeColor) ?? brand.pwaThemeColor ?? null,
    pwaIconUrl: map.get(BRAND_SETTING_KEYS.pwaIconUrl) ?? brand.pwaIconUrl ?? null,
    pwaMaskableIconUrl: map.get(BRAND_SETTING_KEYS.pwaMaskableIconUrl) ?? brand.pwaMaskableIconUrl ?? null,
  };
}

async function applyBrandingSettings(supabase: ReturnType<typeof createServiceSupabaseClient>, brand: WorkspaceBrand): Promise<WorkspaceBrand> {
  if (!isUuid(brand.id)) return brand;

  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .eq("workspace_id", brand.id)
    .in("key", Object.values(BRAND_SETTING_KEYS));

  return applyWorkspaceBrandSettings(brand, (data ?? []) as Array<{ key: string; value: unknown }>);
}

/** Persists editable brand fields as per-workspace app_settings rows. */
export async function updateWorkspaceBranding(workspaceId: string, fields: WorkspaceBrandingInput) {
  if (!isUuid(workspaceId)) {
    throw new Error("No se pudo identificar la marca.");
  }

  const now = new Date().toISOString();
  const payload = (Object.entries(fields) as Array<[keyof WorkspaceBrandingInput, string | undefined]>)
    .filter(([, value]) => typeof value === "string")
    .map(([field, value]) => ({
      workspace_id: workspaceId,
      key: BRAND_SETTING_KEYS[field],
      value: (value as string).trim(),
      updated_at: now,
    }));

  if (!payload.length) return;

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "workspace_id,key" });
  if (error) {
    throw new Error(`No se pudo guardar la marca: ${error.message}`);
  }
}

/** The workspace's public slug — used to build the /c/[slug] sales-page URL. */
export async function getWorkspaceSlug(workspaceId: string): Promise<string | null> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return null;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase.from("workspaces").select("slug").eq("id", workspaceId).maybeSingle();
  return (data as { slug: string | null } | null)?.slug ?? null;
}

/** Set the dedicated member-app domain without touching the marketing domain. */
export async function setWorkspaceMemberDomain(workspaceId: string, domain: string): Promise<string> {
  if (!isUuid(workspaceId)) throw new Error("No se pudo identificar la marca.");
  const normalized = normalizeDomain(domain);
  if (!normalized) throw new Error("El dominio de la app es obligatorio.");
  const supabase = createServiceSupabaseClient();
  const current = await supabase
    .from("workspaces")
    .select("public_domain,custom_domain")
    .eq("id", workspaceId)
    .maybeSingle();
  if (current.error) throw new Error(`No se pudo comprobar el dominio público: ${current.error.message}`);
  const publicDomain = normalizeDomain(current.data?.public_domain || current.data?.custom_domain);
  if (normalized === publicDomain) {
    throw new Error("No se puede mover la web pública al proyecto de la app. Usa un subdominio como app.tudominio.com.");
  }
  await assertWorkspaceDomainsAvailable(supabase, [normalized], workspaceId);
  const { error } = await supabase
    .from("workspaces")
    .update({ member_domain: normalized, updated_at: new Date().toISOString() })
    .eq("id", workspaceId);
  if (error) throw workspaceDomainWriteError(error, "No se pudo guardar el dominio");
  return normalized;
}

export async function resolveWorkspaceBrand(workspaceReference?: string): Promise<WorkspaceBrand> {
  const env = getSupabaseServiceEnv();

  const reference = normalizeWorkspaceReference(workspaceReference);
  if (!env.ok) {
    return fallbackBrand();
  }

  const supabase = createServiceSupabaseClient();
  const query = supabase
    .from("workspaces")
    .select("id,name,slug,app_name,custom_domain,public_domain,member_domain,fallback_subdomain,support_email,is_active,accent_color,created_at");

  if (!reference) {
    const defaultResult = await query.order("created_at", { ascending: true });
    const workspace = defaultResult.data?.find((item) => !isInternalWorkspace(item));
    if (defaultResult.error || !workspace) {
      return fallbackBrand();
    }

    const { publicDomain, memberDomain, fallbackSubdomain, primaryDomain } = domainsFor(workspace);

    return applyBrandingSettings(supabase, {
      id: workspace.id,
      name: workspace.name,
      appName: workspace.app_name,
      supportEmail: workspace.support_email ?? tenant.supportEmail,
      domain: primaryDomain,
      publicDomain,
      memberDomain,
      fallbackSubdomain,
      accentColor: workspace.accent_color,
      isActive: workspace.is_active,
    });
  }

  const filters = [
    `slug.eq.${reference}`,
    `public_domain.eq.${reference}`,
    `member_domain.eq.${reference}`,
    `fallback_subdomain.eq.${reference}`,
    `custom_domain.eq.${reference}`,
  ];

  if (isUuid(reference)) {
    filters.unshift(`id.eq.${reference}`);
  }

  const runLookup = () =>
    supabase
      .from("workspaces")
      .select("id,name,slug,app_name,custom_domain,public_domain,member_domain,fallback_subdomain,support_email,is_active,accent_color,created_at")
      .or(filters.join(","))
      .limit(1)
      .maybeSingle();

  let result = await runLookup();
  if (result.error || !result.data) {
    // A transient pool/timeout hiccup can yield a spurious miss. Retry once
    // before the synthetic fallback brand — whose zero-UUID id would otherwise
    // break member-app writes (isUuid) on a perfectly valid tenant host.
    result = await runLookup();
  }

  if (result.error || !result.data) {
    console.error("getWorkspaceBrand: fell back to default brand", { reference, error: result.error?.message });
    return fallbackBrand();
  }

  const workspace = result.data;
  const { publicDomain, memberDomain, fallbackSubdomain, primaryDomain } = domainsFor(workspace);

  return applyBrandingSettings(supabase, {
    id: workspace.id,
    name: workspace.name,
    appName: workspace.app_name,
    supportEmail: workspace.support_email ?? tenant.supportEmail,
    domain: primaryDomain,
    publicDomain,
    memberDomain,
    fallbackSubdomain,
    accentColor: workspace.accent_color,
    isActive: workspace.is_active,
  });
}

export const getWorkspaceBrand = cache(resolveWorkspaceBrand);

export async function updateWorkspace(input: WorkspaceInput) {
  if (!input.id) {
    throw new Error("Falta el ID de la marca.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre de la marca es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { publicDomain, memberDomain } = resolveWorkspaceDomains(input.publicDomain, input.memberDomain);
  const subdomainHost = toSubdomainHost(input.subdomain);
  await assertWorkspaceDomainsAvailable(
    supabase,
    [publicDomain, memberDomain, subdomainHost],
    input.id,
  );
  const base = {
    name,
    app_name: input.appName.trim() || name,
    // Legacy mirror: public_domain is the canonical marketing host.
    custom_domain: publicDomain || null,
    public_domain: publicDomain || null,
    member_domain: memberDomain || null,
    support_email: cleanOptional(input.supportEmail),
    accent_color: normalizeHexColor(input.accentColor),
    updated_at: new Date().toISOString(),
  };
  // Only touch the provisional subdomain when the operator typed one.
  const patch = subdomainHost ? { ...base, fallback_subdomain: subdomainHost } : base;
  const { error } = await supabase
    .from("workspaces")
    .update(patch)
    .eq("id", input.id);

  if (error) {
    throw workspaceDomainWriteError(error, "No se pudo actualizar la marca");
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
