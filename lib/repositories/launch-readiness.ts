import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type LaunchReadinessCheck = {
  key: string;
  title: string;
  description: string;
  status: "ready" | "warning" | "missing";
  value: string;
};

export type LaunchReadiness = {
  score: number;
  checks: LaunchReadinessCheck[];
};

function checkStatus(condition: boolean, warningCondition = false): LaunchReadinessCheck["status"] {
  if (condition) return "ready";
  if (warningCondition) return "warning";
  return "missing";
}

async function countRows(supabase: any, table: string, workspaceId: string, extra?: (query: any) => any) {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (extra) {
    query = extra(query);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`Unable to count ${table}`, error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getLaunchReadiness(workspaceId?: string): Promise<LaunchReadiness> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !workspaceId) {
    return {
      score: 0,
      checks: [],
    };
  }

  const supabase = createServiceSupabaseClient();
  const workspaceResult = await supabase
    .from("workspaces")
    .select("name,app_name,custom_domain,support_email,logo_url,accent_color,is_active")
    .eq("id", workspaceId)
    .maybeSingle();

  const workspace = workspaceResult.data;
  const [activeContent, appPages, exercises, workoutTemplates, dietTemplates, products] = await Promise.all([
    countRows(supabase, "content_pages", workspaceId, (query) => query.eq("status", "active")),
    countRows(supabase, "app_pages", workspaceId),
    countRows(supabase, "exercises", workspaceId),
    countRows(supabase, "workout_templates", workspaceId),
    countRows(supabase, "diet_templates", workspaceId),
    countRows(supabase, "product_catalog_items", workspaceId),
  ]);

  const checks: LaunchReadinessCheck[] = [
    {
      key: "brand",
      title: "Marca configurada",
      description: "Nombre de app, color principal y estado activo.",
      status: checkStatus(Boolean(workspace?.app_name && workspace?.accent_color && workspace?.is_active)),
      value: workspace?.app_name ?? "Pendiente",
    },
    {
      key: "domain",
      title: "Dominio profesional",
      description: "URL personalizada o dominio temporal aprobado para salir.",
      status: checkStatus(Boolean(workspace?.custom_domain), Boolean(workspace)),
      value: workspace?.custom_domain ?? "Sin dominio",
    },
    {
      key: "support",
      title: "Soporte visible",
      description: "Email o canal de soporte configurado para el cliente final.",
      status: checkStatus(Boolean(workspace?.support_email)),
      value: workspace?.support_email ?? "Pendiente",
    },
    {
      key: "navigation",
      title: "Navegación de app",
      description: "Páginas base de la experiencia cliente creadas.",
      status: checkStatus(appPages >= 5, appPages > 0),
      value: `${appPages} páginas`,
    },
    {
      key: "content",
      title: "Contenido activo",
      description: "Guías, bienvenida o soporte publicados para la marca.",
      status: checkStatus(activeContent >= 2, activeContent > 0),
      value: `${activeContent} páginas activas`,
    },
    {
      key: "exercises",
      title: "Biblioteca de ejercicios",
      description: "Ejercicios propios o base suficiente para crear rutinas.",
      status: checkStatus(exercises >= 8, exercises > 0),
      value: `${exercises} ejercicios`,
    },
    {
      key: "workouts",
      title: "Rutinas iniciales",
      description: "Plantillas de entrenamiento listas para asignar o mostrar.",
      status: checkStatus(workoutTemplates >= 1),
      value: `${workoutTemplates} rutinas`,
    },
    {
      key: "nutrition",
      title: "Nutrición inicial",
      description: "Plantillas alimenticias o sistemas base cargados.",
      status: checkStatus(dietTemplates >= 1),
      value: `${dietTemplates} plantillas`,
    },
    {
      key: "products",
      title: "Oferta principal",
      description: "Producto o programa principal definido para venta.",
      status: checkStatus(products >= 1),
      value: `${products} productos`,
    },
  ];

  const readyWeight = checks.reduce((total, check) => {
    if (check.status === "ready") return total + 1;
    if (check.status === "warning") return total + 0.5;
    return total;
  }, 0);

  return {
    score: Math.round((readyWeight / checks.length) * 100),
    checks,
  };
}
