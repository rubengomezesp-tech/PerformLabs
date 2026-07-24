import { getMemberContext } from "@/lib/auth/member-access";
import { createMemberNotification } from "@/lib/repositories/member-notifications";
import { getCheckinPhotoUrls, parseCheckinPhotoAngle, type CheckinPhotoAngle } from "@/lib/repositories/checkin-management";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type PhotoCheckin = {
  id: string;
  submittedAt: string;
  weightKg: number | null;
  photos: Array<{ path: string; url: string; angle: CheckinPhotoAngle | null }>;
};

export type PhotoConsentStatus = "pending" | "granted" | "denied" | "revoked";

export type PhotoConsent = {
  id: string;
  status: PhotoConsentStatus;
  beforeCheckinId: string;
  afterCheckinId: string;
  requestedAt: string;
  respondedAt: string | null;
};

function rowWeight(keyValues: unknown): number | null {
  const values = keyValues && typeof keyValues === "object" && !Array.isArray(keyValues)
    ? keyValues as Record<string, unknown>
    : {};
  return typeof values.weightKg === "number" ? values.weightKg : null;
}

function rowPaths(keyValues: unknown): string[] {
  const values = keyValues && typeof keyValues === "object" && !Array.isArray(keyValues)
    ? keyValues as Record<string, unknown>
    : {};
  return Array.isArray(values.photoPaths)
    ? values.photoPaths.filter((path): path is string => typeof path === "string")
    : [];
}

async function photoCheckinsFor(workspaceId: string, memberProfileId: string): Promise<PhotoCheckin[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_checkins")
    .select("id,submitted_at,key_values")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .order("submitted_at", { ascending: true });
  if (error || !data) return [];
  const withPhotos = data
    .map((row) => ({ id: row.id as string, submittedAt: (row.submitted_at as string) ?? "", weightKg: rowWeight(row.key_values), paths: rowPaths(row.key_values) }))
    .filter((row) => row.paths.length > 0);
  const results: PhotoCheckin[] = [];
  for (const row of withPhotos) {
    const urls = await getCheckinPhotoUrls(row.paths);
    results.push({
      id: row.id,
      submittedAt: row.submittedAt,
      weightKg: row.weightKg,
      photos: row.paths.map((path, index) => ({ path, url: urls[index] ?? "", angle: parseCheckinPhotoAngle(path) })).filter((photo) => photo.url),
    });
  }
  return results;
}

/** Check-ins con fotos del miembro AUTENTICADO (comparador del aula). */
export async function listMemberPhotoCheckins(workspaceId: string): Promise<PhotoCheckin[]> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return [];
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return [];
  return photoCheckinsFor(workspaceId, context.memberProfileId);
}

/** Check-ins con fotos de un miembro gestionado (lado coach; el caller valida acceso). */
export async function listManagedPhotoCheckins(workspaceId: string, memberProfileId: string): Promise<PhotoCheckin[]> {
  if (!getSupabaseServiceEnv().ok || !workspaceId || !memberProfileId) return [];
  return photoCheckinsFor(workspaceId, memberProfileId);
}

/**
 * El coach pide consentimiento para una tarjeta concreta (par de check-ins).
 * El cliente recibe el aviso en su bandeja y responde viendo la tarjeta
 * renderizada — consiente una preview, no una abstracción (D-7).
 */
export async function requestPhotoConsent(input: {
  workspaceId: string;
  memberProfileId: string;
  beforeCheckinId: string;
  afterCheckinId: string;
  requestedBy: string | null;
}): Promise<string> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("member_photo_consents").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    before_checkin_id: input.beforeCheckinId,
    after_checkin_id: input.afterCheckinId,
    requested_by: input.requestedBy,
  }).select("id").single();
  if (error) throw new Error(`No se pudo pedir el consentimiento: ${error.message}`);

  await createMemberNotification({
    workspaceId: input.workspaceId,
    memberProfileId: input.memberProfileId,
    kind: "consent_request",
    title: "Tu coach quiere compartir tu progreso",
    body: "Revisa la tarjeta de antes/después y decide si autorizas su uso. Nada se comparte sin tu permiso.",
    url: "/app/progress?tab=fotos",
  });

  return data.id as string;
}

function mapConsent(row: Record<string, unknown>): PhotoConsent {
  return {
    id: row.id as string,
    status: row.status as PhotoConsentStatus,
    beforeCheckinId: row.before_checkin_id as string,
    afterCheckinId: row.after_checkin_id as string,
    requestedAt: (row.requested_at as string) ?? "",
    respondedAt: (row.responded_at as string) ?? null,
  };
}

/** Consentimientos del miembro autenticado (aula). */
export async function listMemberPhotoConsents(workspaceId: string): Promise<PhotoConsent[]> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return [];
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return [];
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_photo_consents")
    .select("id,status,before_checkin_id,after_checkin_id,requested_at,responded_at")
    .eq("member_profile_id", context.memberProfileId)
    .order("requested_at", { ascending: false });
  return (data ?? []).map(mapConsent);
}

/** Consentimientos de un miembro gestionado (lado coach). */
export async function listManagedPhotoConsents(workspaceId: string, memberProfileId: string): Promise<PhotoConsent[]> {
  if (!getSupabaseServiceEnv().ok) return [];
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_photo_consents")
    .select("id,status,before_checkin_id,after_checkin_id,requested_at,responded_at")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .order("requested_at", { ascending: false });
  return (data ?? []).map(mapConsent);
}

/** El miembro autenticado responde (grant/deny) o revoca — solo lo suyo. */
export async function respondPhotoConsent(workspaceId: string, consentId: string, decision: "granted" | "denied" | "revoked"): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !workspaceId || !consentId) return;
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return;
  const allowedFrom: Record<string, PhotoConsentStatus[]> = {
    granted: ["pending"],
    denied: ["pending"],
    revoked: ["granted"],
  };
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("member_photo_consents")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", consentId)
    .eq("member_profile_id", context.memberProfileId)
    .in("status", allowedFrom[decision]);
  if (error) console.error("respondPhotoConsent failed", consentId, error.message);
}

export type ConsentCard = {
  consent: PhotoConsent;
  before: PhotoCheckin;
  after: PhotoCheckin;
  weightDeltaKg: number | null;
  weeks: number | null;
};

/** Datos de la tarjeta de un consentimiento (para preview y export). */
export async function getConsentCard(workspaceId: string, memberProfileId: string, consentId: string): Promise<ConsentCard | null> {
  if (!getSupabaseServiceEnv().ok) return null;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_photo_consents")
    .select("id,status,before_checkin_id,after_checkin_id,requested_at,responded_at")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .eq("id", consentId)
    .maybeSingle();
  if (!data) return null;
  const consent = mapConsent(data);
  const checkins = await photoCheckinsFor(workspaceId, memberProfileId);
  const before = checkins.find((checkin) => checkin.id === consent.beforeCheckinId);
  const after = checkins.find((checkin) => checkin.id === consent.afterCheckinId);
  if (!before || !after) return null;
  const weightDeltaKg = before.weightKg !== null && after.weightKg !== null ? after.weightKg - before.weightKg : null;
  const weeks = before.submittedAt && after.submittedAt
    ? Math.max(1, Math.round((new Date(after.submittedAt).getTime() - new Date(before.submittedAt).getTime()) / (7 * 24 * 3600 * 1000)))
    : null;
  return { consent, before, after, weightDeltaKg, weeks };
}

/** Empareja fotos por ángulo (frontal preferente); legacy sin etiqueta → por posición. */
export function pairPhotosByAngle(before: PhotoCheckin, after: PhotoCheckin): Array<{ angle: CheckinPhotoAngle | "sin etiqueta"; beforeUrl: string; afterUrl: string }> {
  const pairs: Array<{ angle: CheckinPhotoAngle | "sin etiqueta"; beforeUrl: string; afterUrl: string }> = [];
  for (const angle of ["frontal", "lateral", "espalda"] as const) {
    const beforePhoto = before.photos.find((photo) => photo.angle === angle);
    const afterPhoto = after.photos.find((photo) => photo.angle === angle);
    if (beforePhoto && afterPhoto) pairs.push({ angle, beforeUrl: beforePhoto.url, afterUrl: afterPhoto.url });
  }
  if (!pairs.length) {
    // Fallback SOLO para fotos legacy sin etiqueta de ángulo: emparejar por
    // posición. Fotos etiquetadas con ángulos distintos NUNCA se emparejan
    // entre sí (frontal contra espalda no es una comparativa).
    const beforeLegacy = before.photos.filter((photo) => photo.angle === null);
    const afterLegacy = after.photos.filter((photo) => photo.angle === null);
    const count = Math.min(beforeLegacy.length, afterLegacy.length);
    for (let index = 0; index < count; index += 1) {
      pairs.push({ angle: "sin etiqueta", beforeUrl: beforeLegacy[index].url, afterUrl: afterLegacy[index].url });
    }
  }
  return pairs;
}
