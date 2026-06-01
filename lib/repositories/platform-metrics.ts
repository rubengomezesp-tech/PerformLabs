import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type PlatformMetric = {
  label: string;
  value: string;
  detail: string;
};

export type OperationsQueueItem = {
  title: string;
  detail: string;
  status: string;
};

// The table name is resolved at runtime, so the client stays schema-loose here.
async function countRows(supabase: SupabaseClient, table: string, extra?: (query: any) => any) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (extra) query = extra(query);
  const { count, error } = await query;
  if (error) {
    console.error(`Unable to count ${table}`, error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getPlatformMetrics(): Promise<{
  metrics: PlatformMetric[];
  queue: OperationsQueueItem[];
}> {
  const env = getSupabaseServiceEnv();

  if (!env.ok) {
    return {
      metrics: [
        { label: "Marcas activas", value: "0", detail: "Configura Supabase para datos reales" },
        { label: "Leads", value: "0", detail: "Sin conexión" },
        { label: "Proyectos", value: "0", detail: "Sin conexión" },
        { label: "Readiness", value: "0%", detail: "Pendiente" },
      ],
      queue: [],
    };
  }

  const supabase = createServiceSupabaseClient();
  const [workspaces, activeWorkspaces, leads, projects, activeContent, workoutTemplates, dietTemplates] = await Promise.all([
    countRows(supabase, "workspaces"),
    countRows(supabase, "workspaces", (query) => query.eq("is_active", true)),
    countRows(supabase, "sales_leads"),
    countRows(supabase, "implementation_projects"),
    countRows(supabase, "content_pages", (query) => query.eq("status", "active")),
    countRows(supabase, "workout_templates"),
    countRows(supabase, "diet_templates"),
  ]);

  const projectResult = await supabase
    .from("implementation_projects")
    .select("project_name,client_name,status,launch_target_date,created_at")
    .order("created_at", { ascending: false })
    .limit(4);

  const queue: OperationsQueueItem[] = (projectResult.data ?? []).map((project: any) => ({
    title: project.project_name,
    detail: `${project.client_name} · lanzamiento ${project.launch_target_date ?? "pendiente"}`,
    status: project.status,
  }));

  const readiness = workspaces
    ? Math.min(100, Math.round(((activeContent + workoutTemplates + dietTemplates) / Math.max(workspaces * 3, 1)) * 100))
    : 0;

  return {
    metrics: [
      { label: "Marcas activas", value: String(activeWorkspaces), detail: `${workspaces} marcas totales` },
      { label: "Leads", value: String(leads), detail: "Consultas comerciales capturadas" },
      { label: "Proyectos", value: String(projects), detail: "Implantaciones abiertas o históricas" },
      { label: "Readiness medio", value: `${readiness}%`, detail: "Contenido, entreno y nutrición base" },
    ],
    queue,
  };
}
