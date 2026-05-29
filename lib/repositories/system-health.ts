import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const FALLBACK_BRAND_ID = "00000000-0000-0000-0000-000000000000";

function isUuid(value?: string): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export type CoachDataHealth = {
  /** true only when the coach console is reading/writing real database data. */
  ok: boolean;
  level: "ok" | "warn" | "error";
  code: "connected" | "missing_env" | "schema_missing" | "no_workspace" | "mock_brand" | "probe_failed";
  title: string;
  detail: string;
  steps: string[];
};

const CONNECTED: CoachDataHealth = {
  ok: true,
  level: "ok",
  code: "connected",
  title: "Conectado a la base de datos",
  detail: "",
  steps: [],
};

/**
 * Probes whether the coach console is actually talking to Supabase (and to a
 * real workspace), so the UI can stop silently showing mock data. This is the
 * difference between "le doy al generador y no pasa nada" and a clear message.
 */
export async function getCoachDataHealth(brandId?: string): Promise<CoachDataHealth> {
  const env = getSupabaseServiceEnv();

  if (!env.ok) {
    return {
      ok: false,
      level: "error",
      code: "missing_env",
      title: "Este despliegue no está conectado a la base de datos.",
      detail: `Falta la variable de entorno ${env.missing.join(", ")}. Mientras falte, verás ejercicios y rutinas de ejemplo y nada de lo que crees se guardará (el generador fallará).`,
      steps: [
        "Vercel → tu proyecto → Settings → Environment Variables.",
        "Añade SUPABASE_SERVICE_ROLE_KEY (cópiala de Supabase → Project Settings → API → service_role).",
        "Activa los entornos Production y Preview (si pruebas en una URL de rama, necesita Preview).",
        "Vuelve a desplegar (Redeploy) la URL que estás usando.",
      ],
    };
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { count, error } = await supabase
      .from("workspaces")
      .select("id", { count: "exact", head: true });

    if (error) {
      return {
        ok: false,
        level: "error",
        code: "schema_missing",
        title: "La base de datos está conectada pero le faltan las tablas.",
        detail: `No se pudo leer la tabla "workspaces" (${error.message}). Lo más probable es que este proyecto de Supabase no tenga el esquema creado.`,
        steps: [
          "Supabase → SQL Editor → ejecuta el esquema del repo (scripts/sql).",
          "Crea tu marca en /console/apps.",
          "Vuelve aquí y ya podrás generar y guardar programas.",
        ],
      };
    }

    if (!count) {
      return {
        ok: false,
        level: "warn",
        code: "no_workspace",
        title: "Aún no existe ninguna marca.",
        detail: "La base de datos está conectada, pero no hay ninguna marca (workspace) creada. Sin una marca real, los programas no tienen dónde guardarse.",
        steps: [
          "Crea tu marca en /console/apps.",
          "Vuelve a esta pantalla: el generador empezará a guardar de verdad.",
        ],
      };
    }
  } catch (probeError) {
    return {
      ok: false,
      level: "error",
      code: "probe_failed",
      title: "No se pudo comprobar la conexión con la base de datos.",
      detail: probeError instanceof Error ? probeError.message : "Error desconocido al consultar Supabase.",
      steps: [
        "Revisa que SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL sean correctas.",
        "Vuelve a desplegar y recarga la página.",
      ],
    };
  }

  if (!isUuid(brandId) || brandId === FALLBACK_BRAND_ID) {
    return {
      ok: false,
      level: "warn",
      code: "mock_brand",
      title: "No hay una marca real seleccionada.",
      detail: "Hay base de datos y marcas, pero esta sesión no ha resuelto ninguna marca concreta, así que ves datos de ejemplo.",
      steps: [
        "Entra desde el dominio de tu marca o selecciónala en /console/apps.",
        "Después vuelve a /coach: el generador y los ejercicios usarán tu marca real.",
      ],
    };
  }

  return CONNECTED;
}
