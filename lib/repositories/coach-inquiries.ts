import {
  COACH_INQUIRY_PRIORITIES,
  COACH_INQUIRY_STATUSES,
  RG_DIAGNOSTIC_CONSENT_VERSION,
  coachDiagnosticAnswersSchema,
  coachInquiryAttributionSchema,
  coachInquirySource,
  parseStructuredCoachInquiryMessage,
  type CoachDiagnosticAnswers,
  type CoachInquiryAttribution,
  type CoachInquiryPriority,
  type CoachInquiryStatus,
} from "@/lib/lead-capture/coach-inquiry";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export type CoachInquiryInput = {
  workspaceId: string;
  fullName: string;
  email: string;
  message?: string;
  kind?: "contact" | "coaching" | "diagnostic";
  phone?: string;
  preferredContact?: "email" | "whatsapp" | "phone";
  locale?: "es" | "en";
  answers?: CoachDiagnosticAnswers;
  attribution?: CoachInquiryAttribution;
  submissionId?: string;
  elapsedMs?: number;
  contactConsentAt?: string;
  consentVersion?: string;
  marketingConsentAt?: string;
  priority?: CoachInquiryPriority;
  source?: string;
};

export type CoachInquiryCreateResult = {
  id: string;
  duplicate: boolean;
  legacySchema: boolean;
};

export type CoachInquirySummary = {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  kind: string;
  preferredContact: string;
  locale: "es" | "en";
  answers: CoachDiagnosticAnswers | null;
  attribution: CoachInquiryAttribution;
  status: CoachInquiryStatus;
  priority: CoachInquiryPriority;
  qualificationNotes: string;
  nextActionAt: string;
  contactedAt: string;
  elapsedMs: number | null;
  contactConsentAt: string;
  consentVersion: string;
  marketingConsentAt: string;
  source: string;
  submissionId: string;
  createdAt: string;
  updatedAt: string;
};

export type CoachInquiryUpdateInput = {
  workspaceId: string;
  inquiryId: string;
  status: CoachInquiryStatus;
  priority: CoachInquiryPriority;
  nextActionAt?: string | null;
  qualificationNotes?: string;
};

export type CoachInquiryListOptions = {
  limit?: number;
  offset?: number;
  status?: CoachInquiryStatus;
  priority?: CoachInquiryPriority;
};

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

type ExtendedInquiryRow = {
  id: string;
  workspace_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  kind: string;
  preferred_contact: string;
  locale: string;
  answers: Json;
  status: string;
  priority: string;
  qualification_notes: string | null;
  next_action_at: string | null;
  contacted_at: string | null;
  elapsed_ms: number | null;
  contact_consent_at: string | null;
  consent_version: string | null;
  marketing_consent_at: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id?: string | null;
  utm_matchtype?: string | null;
  utm_device?: string | null;
  utm_network?: string | null;
  utm_adgroup?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  landing_path: string | null;
  referrer_host: string | null;
  submission_id: string | null;
  created_at: string;
  updated_at: string;
};

type LegacyInquiryRow = Pick<
  ExtendedInquiryRow,
  "id" | "workspace_id" | "full_name" | "email" | "message" | "kind" | "created_at"
>;

const EMPTY_ATTRIBUTION: CoachInquiryAttribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  utmId: "",
  utmMatchtype: "",
  utmDevice: "",
  utmNetwork: "",
  utmAdgroup: "",
  gclid: "",
  gbraid: "",
  wbraid: "",
  fbclid: "",
  landingPath: "",
  referrerHost: "",
};

function isSchemaCompatibilityError(error: DatabaseError | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return error?.code === "PGRST204"
    || error?.code === "42703"
    || (message.includes("column") && message.includes("schema cache"));
}

function isDuplicateError(error: DatabaseError | null | undefined) {
  return error?.code === "23505" || /duplicate key|unique constraint/i.test(error?.message ?? "");
}

function safeStatus(value: string | null | undefined): CoachInquiryStatus {
  return COACH_INQUIRY_STATUSES.includes(value as CoachInquiryStatus)
    ? value as CoachInquiryStatus
    : "new";
}

function safePriority(value: string | null | undefined): CoachInquiryPriority {
  return COACH_INQUIRY_PRIORITIES.includes(value as CoachInquiryPriority)
    ? value as CoachInquiryPriority
    : "normal";
}

function cleanOptional(value?: string) {
  return value?.trim() || null;
}

async function findBySubmissionId(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  submissionId: string,
) {
  const result = await supabase
    .from("coach_inquiries")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("submission_id", submissionId)
    .limit(1)
    .maybeSingle();
  return result.error ? "" : result.data?.id ?? "";
}

async function findLegacyBySubmissionId(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  email: string,
  submissionId: string,
) {
  const result = await supabase
    .from("coach_inquiries")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("email", email)
    .ilike("message", `%RG_SUBMISSION_ID: ${submissionId}%`)
    .limit(1)
    .maybeSingle();
  return result.error ? "" : result.data?.id ?? "";
}

/** Schema-compatible idempotency lookup for diagnostic and generic public forms. */
export async function findCoachInquirySubmission(
  workspaceId: string,
  email: string,
  submissionId: string,
) {
  if (!workspaceId || workspaceId === ZERO_UUID || !submissionId || !getSupabaseServiceEnv().ok) return "";
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return "";
  const supabase = createServiceSupabaseClient();
  const extendedId = await findBySubmissionId(supabase, workspaceId, submissionId);
  if (extendedId) return extendedId;
  return findLegacyBySubmissionId(
    supabase,
    workspaceId,
    normalizedEmail,
    submissionId,
  );
}

/**
 * Writes a tenant-scoped contact/coaching inquiry. The extended insert is tried
 * first. If Vercel deploys a few moments before the additive migration, only a
 * missing-column/schema-cache error falls back to the original six-column table;
 * every diagnostic answer and attribution value is already preserved in message.
 */
export async function createCoachInquiry(input: CoachInquiryInput): Promise<CoachInquiryCreateResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message?.trim() || "";

  if (!input.workspaceId || input.workspaceId === ZERO_UUID) throw new Error("Marca no válida.");
  if (!fullName) throw new Error("Escribe tu nombre.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Introduce un email válido.");
  if (!getSupabaseServiceEnv().ok) throw new Error("El formulario no está disponible ahora mismo.");

  const answers = input.answers ?? null;
  const attribution = input.attribution ?? EMPTY_ATTRIBUTION;
  const now = new Date().toISOString();
  const supabase = createServiceSupabaseClient();

  // Check the durable message marker before touching migration-only columns.
  // This keeps a submission idempotent across the exact deploy-order race:
  // legacy insert -> migration -> browser retry.
  if (input.submissionId) {
    const existingId = await findLegacyBySubmissionId(supabase, input.workspaceId, email, input.submissionId);
    if (existingId) return { id: existingId, duplicate: true, legacySchema: false };
  }

  const basePayload = {
    workspace_id: input.workspaceId,
    full_name: fullName,
    email,
    phone: cleanOptional(input.phone),
    message,
    kind: input.kind === "coaching" || input.kind === "diagnostic" ? input.kind : "contact",
    preferred_contact: input.preferredContact ?? (input.phone ? "whatsapp" : "email"),
    locale: input.locale === "en" ? "en" : "es",
    goal: answers?.goal ?? null,
    service_mode: answers?.place ?? null,
    zone: answers ? (answers.place === "online" ? "online" : answers.area.toLowerCase()) : null,
    sessions_per_week: answers ? Number(answers.sessions) : null,
    schedule: answers?.schedule ?? null,
    training_level: answers?.level ?? null,
    obstacle: answers?.obstacle ?? null,
    answers: (answers ?? {}) as Json,
    status: "new",
    priority: input.priority ?? "normal",
    source: cleanOptional(input.source)
      || cleanOptional(attribution.utmSource)
      || cleanOptional(attribution.referrerHost)
      || "direct",
    utm_source: cleanOptional(attribution.utmSource),
    utm_medium: cleanOptional(attribution.utmMedium),
    utm_campaign: cleanOptional(attribution.utmCampaign),
    utm_content: cleanOptional(attribution.utmContent),
    utm_term: cleanOptional(attribution.utmTerm),
    landing_path: cleanOptional(attribution.landingPath),
    referrer_host: cleanOptional(attribution.referrerHost),
    submission_id: cleanOptional(input.submissionId),
    elapsed_ms: typeof input.elapsedMs === "number" ? input.elapsedMs : null,
    contact_consent_at: cleanOptional(input.contactConsentAt),
    consent_version: cleanOptional(input.consentVersion),
    marketing_consent_at: cleanOptional(input.marketingConsentAt),
    updated_at: now,
  };
  const payload = {
    ...basePayload,
    utm_id: cleanOptional(attribution.utmId),
    utm_matchtype: cleanOptional(attribution.utmMatchtype),
    utm_device: cleanOptional(attribution.utmDevice),
    utm_network: cleanOptional(attribution.utmNetwork),
    utm_adgroup: cleanOptional(attribution.utmAdgroup),
    gclid: cleanOptional(attribution.gclid),
    gbraid: cleanOptional(attribution.gbraid),
    wbraid: cleanOptional(attribution.wbraid),
    fbclid: cleanOptional(attribution.fbclid),
  };

  const inserted = await supabase
    .from("coach_inquiries")
    .insert(payload)
    .select("id")
    .single();

  if (!inserted.error && inserted.data?.id) {
    return { id: inserted.data.id, duplicate: false, legacySchema: false };
  }

  if (input.submissionId && isDuplicateError(inserted.error)) {
    const id = await findBySubmissionId(supabase, input.workspaceId, input.submissionId);
    if (id) return { id, duplicate: true, legacySchema: false };
  }

  if (!isSchemaCompatibilityError(inserted.error)) {
    throw new Error(`No se pudo enviar tu mensaje: ${inserted.error?.message ?? "error desconocido"}`);
  }

  // During the attribution migration rollout, retain the already-migrated CRM
  // fields and only defer the new campaign columns to the durable message.
  const baseInserted = await supabase
    .from("coach_inquiries")
    .insert(basePayload)
    .select("id")
    .single();

  if (!baseInserted.error && baseInserted.data?.id) {
    return { id: baseInserted.data.id, duplicate: false, legacySchema: true };
  }

  if (input.submissionId && isDuplicateError(baseInserted.error)) {
    const id = await findBySubmissionId(supabase, input.workspaceId, input.submissionId);
    if (id) return { id, duplicate: true, legacySchema: true };
  }

  if (!isSchemaCompatibilityError(baseInserted.error)) {
    throw new Error(`No se pudo enviar tu mensaje: ${baseInserted.error?.message ?? "error desconocido"}`);
  }

  if (input.submissionId) {
    const existingId = await findLegacyBySubmissionId(supabase, input.workspaceId, email, input.submissionId);
    if (existingId) return { id: existingId, duplicate: true, legacySchema: true };
  }

  const legacyInsert = await supabase
    .from("coach_inquiries")
    .insert({
      workspace_id: input.workspaceId,
      full_name: fullName,
      email,
      message,
      kind: input.kind === "coaching" || input.kind === "diagnostic" ? input.kind : "contact",
    })
    .select("id")
    .single();

  if (legacyInsert.error || !legacyInsert.data?.id) {
    throw new Error(`No se pudo enviar tu mensaje: ${legacyInsert.error?.message ?? "error desconocido"}`);
  }

  return { id: legacyInsert.data.id, duplicate: false, legacySchema: true };
}

function mapExtendedInquiry(row: ExtendedInquiryRow): CoachInquirySummary {
  const legacy = parseStructuredCoachInquiryMessage(row.message);
  const answers = coachDiagnosticAnswersSchema.safeParse(row.answers);
  const storedAttribution = {
    utmSource: row.utm_source ?? "",
    utmMedium: row.utm_medium ?? "",
    utmCampaign: row.utm_campaign ?? "",
    utmContent: row.utm_content ?? "",
    utmTerm: row.utm_term ?? "",
    utmId: row.utm_id ?? "",
    utmMatchtype: row.utm_matchtype ?? "",
    utmDevice: row.utm_device ?? "",
    utmNetwork: row.utm_network ?? "",
    utmAdgroup: row.utm_adgroup ?? "",
    gclid: row.gclid ?? "",
    gbraid: row.gbraid ?? "",
    wbraid: row.wbraid ?? "",
    fbclid: row.fbclid ?? "",
    landingPath: row.landing_path ?? "",
    referrerHost: row.referrer_host ?? "",
  };
  const attribution = coachInquiryAttributionSchema.safeParse(storedAttribution);
  const validStoredAttribution = attribution.success ? attribution.data : EMPTY_ATTRIBUTION;
  const resolvedAttribution = coachInquiryAttributionSchema.parse(Object.fromEntries(
    Object.keys(EMPTY_ATTRIBUTION).map((key) => {
      const attributionKey = key as keyof CoachInquiryAttribution;
      return [
        attributionKey,
        validStoredAttribution[attributionKey] || legacy?.attribution[attributionKey] || "",
      ];
    }),
  ));
  const phone = row.phone ?? legacy?.phone ?? "";
  const isMigratedLegacy = Boolean(legacy && !row.submission_id);
  const storedSource = row.source?.trim() ?? "";

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    fullName: row.full_name,
    email: row.email,
    phone,
    message: legacy ? "" : row.message,
    kind: row.kind,
    preferredContact: phone ? "whatsapp" : (row.preferred_contact || legacy?.preferredContact || "email"),
    locale: isMigratedLegacy ? legacy!.locale : (row.locale === "en" ? "en" : "es"),
    answers: answers.success ? answers.data : legacy?.answers ?? null,
    attribution: resolvedAttribution,
    status: safeStatus(row.status),
    priority: safePriority(row.priority),
    qualificationNotes: row.qualification_notes ?? "",
    nextActionAt: row.next_action_at ?? "",
    contactedAt: row.contacted_at ?? "",
    elapsedMs: row.elapsed_ms ?? legacy?.elapsedMs ?? null,
    contactConsentAt: row.contact_consent_at ?? legacy?.contactConsentAt ?? (legacy ? row.created_at : ""),
    consentVersion: row.consent_version ?? legacy?.consentVersion ?? (legacy ? RG_DIAGNOSTIC_CONSENT_VERSION : ""),
    marketingConsentAt: row.marketing_consent_at ?? "",
    source: storedSource && !(isMigratedLegacy && storedSource === "website")
      ? storedSource
      : coachInquirySource(resolvedAttribution),
    submissionId: row.submission_id ?? legacy?.submissionId ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLegacyInquiry(row: LegacyInquiryRow): CoachInquirySummary {
  const legacy = parseStructuredCoachInquiryMessage(row.message);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    fullName: row.full_name,
    email: row.email,
    phone: legacy?.phone ?? "",
    message: legacy ? "" : row.message,
    kind: row.kind,
    preferredContact: legacy?.preferredContact ?? "email",
    locale: legacy?.locale ?? "es",
    answers: legacy?.answers ?? null,
    attribution: legacy?.attribution ?? EMPTY_ATTRIBUTION,
    status: "new",
    priority: "normal",
    qualificationNotes: "",
    nextActionAt: "",
    contactedAt: "",
    elapsedMs: legacy?.elapsedMs ?? null,
    contactConsentAt: legacy?.contactConsentAt || (legacy ? row.created_at : ""),
    consentVersion: legacy?.consentVersion || (legacy ? RG_DIAGNOSTIC_CONSENT_VERSION : ""),
    marketingConsentAt: "",
    source: legacy ? coachInquirySource(legacy.attribution) : "direct",
    submissionId: legacy?.submissionId ?? "",
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

/** Lists only the selected coach's inquiries; never performs a workspace-wide read. */
export async function listCoachInquiries(
  workspaceId: string,
  input: number | CoachInquiryListOptions = 100,
): Promise<CoachInquirySummary[]> {
  if (!workspaceId || workspaceId === ZERO_UUID || !getSupabaseServiceEnv().ok) return [];
  const supabase = createServiceSupabaseClient();
  const options = typeof input === "number" ? { limit: input } : input;
  const safeLimit = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const safeOffset = Math.min(Math.max(options.offset ?? 0, 0), 100_000);
  let extendedQuery = supabase
    .from("coach_inquiries")
    .select("id,workspace_id,full_name,email,phone,message,kind,preferred_contact,locale,answers,status,priority,qualification_notes,next_action_at,contacted_at,elapsed_ms,contact_consent_at,consent_version,marketing_consent_at,source,utm_source,utm_medium,utm_campaign,utm_content,utm_term,utm_id,utm_matchtype,utm_device,utm_network,utm_adgroup,gclid,gbraid,wbraid,fbclid,landing_path,referrer_host,submission_id,created_at,updated_at")
    .eq("workspace_id", workspaceId);
  if (options.status) extendedQuery = extendedQuery.eq("status", options.status);
  if (options.priority) extendedQuery = extendedQuery.eq("priority", options.priority);
  extendedQuery = extendedQuery.order("created_at", { ascending: false });
  const extended = safeOffset
    ? await extendedQuery.range(safeOffset, safeOffset + safeLimit - 1)
    : await extendedQuery.limit(safeLimit);

  if (!extended.error) {
    return ((extended.data ?? []) as unknown as ExtendedInquiryRow[]).map(mapExtendedInquiry);
  }
  if (isSchemaCompatibilityError(extended.error)) {
    // A deploy can briefly precede the additive attribution migration. Retry
    // the already-live CRM projection so status, notes and qualification never
    // disappear from the coach view during that window.
    let preAttributionQuery = supabase
      .from("coach_inquiries")
      .select("id,workspace_id,full_name,email,phone,message,kind,preferred_contact,locale,answers,status,priority,qualification_notes,next_action_at,contacted_at,elapsed_ms,contact_consent_at,consent_version,marketing_consent_at,source,utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_path,referrer_host,submission_id,created_at,updated_at")
      .eq("workspace_id", workspaceId);
    if (options.status) preAttributionQuery = preAttributionQuery.eq("status", options.status);
    if (options.priority) preAttributionQuery = preAttributionQuery.eq("priority", options.priority);
    preAttributionQuery = preAttributionQuery.order("created_at", { ascending: false });
    const preAttribution = safeOffset
      ? await preAttributionQuery.range(safeOffset, safeOffset + safeLimit - 1)
      : await preAttributionQuery.limit(safeLimit);

    if (!preAttribution.error) {
      return ((preAttribution.data ?? []) as unknown as ExtendedInquiryRow[]).map(mapExtendedInquiry);
    }
    if (!isSchemaCompatibilityError(preAttribution.error)) {
      console.error("Unable to load coach inquiries", preAttribution.error.message);
      return [];
    }
  }
  if (!isSchemaCompatibilityError(extended.error)) {
    console.error("Unable to load coach inquiries", extended.error.message);
    return [];
  }

  // Before the additive migration every legacy row has the effective defaults.
  if ((options.status && options.status !== "new") || (options.priority && options.priority !== "normal")) {
    return [];
  }

  const legacyQuery = supabase
    .from("coach_inquiries")
    .select("id,workspace_id,full_name,email,message,kind,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  const legacy = safeOffset
    ? await legacyQuery.range(safeOffset, safeOffset + safeLimit - 1)
    : await legacyQuery.limit(safeLimit);
  if (legacy.error) {
    console.error("Unable to load legacy coach inquiries", legacy.error.message);
    return [];
  }
  return ((legacy.data ?? []) as unknown as LegacyInquiryRow[]).map(mapLegacyInquiry);
}

export async function updateCoachInquiry(input: CoachInquiryUpdateInput) {
  if (!input.workspaceId || !input.inquiryId) throw new Error("Falta la consulta.");
  if (!COACH_INQUIRY_STATUSES.includes(input.status)) throw new Error("Estado no válido.");
  if (!COACH_INQUIRY_PRIORITIES.includes(input.priority)) throw new Error("Prioridad no válida.");

  const now = new Date().toISOString();
  const contacted = ["contacted", "qualified", "booked", "won"].includes(input.status);
  const supabase = createServiceSupabaseClient();
  const update = {
    status: input.status,
    priority: input.priority,
    next_action_at: input.nextActionAt || null,
    qualification_notes: cleanOptional(input.qualificationNotes),
    updated_at: now,
  };
  const result = await supabase
    .from("coach_inquiries")
    .update(update)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.inquiryId)
    .select("id")
    .maybeSingle();

  if (result.error) throw new Error(`No se pudo actualizar el lead: ${result.error.message}`);
  if (!result.data) throw new Error("La consulta no existe en esta marca.");

  if (contacted) {
    const firstContact = await supabase
      .from("coach_inquiries")
      .update({ contacted_at: now, updated_at: now })
      .eq("workspace_id", input.workspaceId)
      .eq("id", input.inquiryId)
      .is("contacted_at", null);
    if (firstContact.error) throw new Error(`No se pudo registrar el primer contacto: ${firstContact.error.message}`);
  }
}
