import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type ContentStatus = "draft" | "active" | "archived";

export type ManagedContentPage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  heading: string;
  notes: string;
  updatedAt: string;
};

export type ContentPageInput = {
  id?: string;
  workspaceId: string;
  title: string;
  slug: string;
  status: string;
  heading: string;
  notes: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function bodyValue(body: unknown, key: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "";
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function normalizeStatus(status: string): ContentStatus {
  return ["draft", "active", "archived"].includes(status) ? (status as ContentStatus) : "draft";
}

export async function listManagedContentPages(workspaceId?: string): Promise<ManagedContentPage[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !workspaceId) {
    return [];
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("content_pages")
    .select("id,title,slug,body,status,updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Unable to load managed content", error.message);
    return [];
  }

  return (data ?? []).map((page) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    heading: bodyValue(page.body, "title") || page.title,
    notes: bodyValue(page.body, "notes"),
    updatedAt: page.updated_at,
  }));
}

export async function saveManagedContentPage(input: ContentPageInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de guardar contenido.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("El titulo es obligatorio.");
  }

  const payload = {
    workspace_id: input.workspaceId,
    title,
    slug: slugify(input.slug || title),
    status: normalizeStatus(input.status),
    body: {
      title: input.heading.trim() || title,
      notes: input.notes.trim(),
    },
    updated_at: new Date().toISOString(),
  };

  const supabase = createServiceSupabaseClient();
  const query = input.id
    ? supabase.from("content_pages").update(payload).eq("id", input.id)
    : supabase.from("content_pages").insert(payload);

  const { error } = await query;

  if (error) {
    throw new Error(`No se pudo guardar el contenido: ${error.message}`);
  }
}
