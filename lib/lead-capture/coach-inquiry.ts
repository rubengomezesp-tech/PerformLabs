import { z } from "zod";

export const COACH_INQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "booked",
  "won",
  "nurture",
  "lost",
] as const;

export const COACH_INQUIRY_PRIORITIES = ["low", "normal", "high"] as const;
export const DIAGNOSTIC_GOALS = ["fatloss", "muscle", "recomp", "stage"] as const;
export const DIAGNOSTIC_PLACES = ["condo", "gym", "outdoor", "online"] as const;
export const DIAGNOSTIC_AREAS = ["Wynwood", "Brickell", "Midtown", "Edgewater"] as const;
export const DIAGNOSTIC_SESSIONS = ["2", "3", "4", "5"] as const;
export const DIAGNOSTIC_SCHEDULES = ["morning", "midday", "evening", "flexible"] as const;
export const DIAGNOSTIC_LEVELS = ["start", "middle", "advanced"] as const;
export const DIAGNOSTIC_OBSTACLES = ["consistency", "clarity", "time", "progress"] as const;
export const RG_DIAGNOSTIC_CONSENT_VERSION = "rg-diagnostic-contact-v1";

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

const submissionIdSchema = z.string()
  .trim()
  .min(12)
  .max(80)
  .regex(
    /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|rg-[0-9]{10,}-[0-9a-f]+)$/i,
    "Identificador de envío no válido.",
  );

const phoneSchema = z.string()
  .trim()
  .max(32)
  .regex(/^[+()0-9.\- ]*$/, "Teléfono no válido.")
  .refine((value) => !CONTROL_CHARACTERS.test(value), "Teléfono no válido.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 0 || (digits.length >= 7 && digits.length <= 15);
  }, "Teléfono no válido.");

const attributionValue = z.string()
  .trim()
  .max(120)
  .refine((value) => !CONTROL_CHARACTERS.test(value), "El valor contiene caracteres no válidos.")
  .default("");

// Advertising click identifiers are opaque and can be materially longer than
// UTM values. Keep any visible ASCII token verbatim (including percent/base64
// punctuation), while excluding spaces and controls that could corrupt the
// durable line-based fallback.
const clickIdValue = z.string()
  .max(512)
  .regex(/^[\x21-\x7e]*$/, "Identificador publicitario no válido.")
  .default("");

export const coachDiagnosticAnswersSchema = z.object({
  goal: z.enum(DIAGNOSTIC_GOALS),
  place: z.enum(DIAGNOSTIC_PLACES),
  area: z.union([z.enum(DIAGNOSTIC_AREAS), z.literal("")]),
  sessions: z.enum(DIAGNOSTIC_SESSIONS),
  schedule: z.enum(DIAGNOSTIC_SCHEDULES),
  level: z.enum(DIAGNOSTIC_LEVELS),
  obstacle: z.enum(DIAGNOSTIC_OBSTACLES),
}).strict().superRefine((answers, context) => {
  if (answers.place === "online" && answers.area !== "") {
    context.addIssue({
      code: "custom",
      path: ["area"],
      message: "La zona debe estar vacía para coaching online.",
    });
  }
  if (answers.place !== "online" && answers.area === "") {
    context.addIssue({
      code: "custom",
      path: ["area"],
      message: "Selecciona una zona para entrenamiento presencial.",
    });
  }
});

export const coachInquiryAttributionSchema = z.object({
  utmSource: attributionValue,
  utmMedium: attributionValue,
  utmCampaign: attributionValue,
  utmContent: attributionValue,
  utmTerm: attributionValue,
  utmId: attributionValue,
  utmMatchtype: attributionValue,
  utmDevice: attributionValue,
  utmNetwork: attributionValue,
  utmAdgroup: attributionValue,
  gclid: clickIdValue,
  gbraid: clickIdValue,
  wbraid: clickIdValue,
  fbclid: clickIdValue,
  landingPath: z.string().trim().max(240)
    .refine((value) => !CONTROL_CHARACTERS.test(value), "Ruta no válida.")
    .refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")), "Ruta no válida.")
    .default(""),
  referrerHost: z.string().trim().max(160).default("")
    .refine((value) => !value || /^[a-z0-9.-]+$/i.test(value), "Origen no válido."),
}).strict();

export const publicCoachInquirySchema = z.object({
  slug: z.literal("rg-coach"),
  submissionId: submissionIdSchema,
  fullName: z.string().trim().min(2).max(80)
    .refine((value) => !CONTROL_CHARACTERS.test(value), "Nombre no válido."),
  email: z.string().trim().toLowerCase().email().max(160),
  phone: phoneSchema.default(""),
  website: z.string().trim().max(200).default(""),
  consent: z.literal(true),
  locale: z.enum(["es", "en"]).default("es"),
  elapsedMs: z.number().int().min(0).max(86_400_000).default(0),
  answers: coachDiagnosticAnswersSchema,
  attribution: coachInquiryAttributionSchema,
}).strict();

export const coachInquiryUpdateSchema = z.object({
  workspaceId: z.string().uuid(),
  inquiryId: z.string().uuid(),
  status: z.enum(COACH_INQUIRY_STATUSES),
  priority: z.enum(COACH_INQUIRY_PRIORITIES),
  nextActionDate: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ]),
  qualificationNotes: z.string().trim().max(2_000),
}).strict();

export type PublicCoachInquiry = z.infer<typeof publicCoachInquirySchema>;
export type CoachDiagnosticAnswers = z.infer<typeof coachDiagnosticAnswersSchema>;
export type CoachInquiryAttribution = z.infer<typeof coachInquiryAttributionSchema>;
export type CoachInquiryStatus = typeof COACH_INQUIRY_STATUSES[number];
export type CoachInquiryPriority = typeof COACH_INQUIRY_PRIORITIES[number];
export type CoachInquiryUpdate = z.infer<typeof coachInquiryUpdateSchema>;

const ANSWER_LABELS = {
  es: {
    goal: { fatloss: "Bajar grasa", muscle: "Ganar músculo", recomp: "Recomposición", stage: "Competición" },
    place: { condo: "Gym de condo", gym: "Gimnasio", outdoor: "Outdoor", online: "Online" },
    area: { Wynwood: "Wynwood", Brickell: "Brickell", Midtown: "Midtown", Edgewater: "Edgewater", online: "Online" },
    sessions: { "2": "2 días", "3": "3 días", "4": "4 días", "5": "5 días" },
    schedule: { morning: "6:00–10:00", midday: "10:00–15:00", evening: "15:00–20:00", flexible: "Flexible" },
    level: { start: "Está empezando", middle: "Ya entrena", advanced: "Avanzado" },
    obstacle: { consistency: "Constancia", clarity: "No sabe qué hacer", time: "Falta de tiempo", progress: "No ve progreso" },
  },
  en: {
    goal: { fatloss: "Lose body fat", muscle: "Build muscle", recomp: "Body recomposition", stage: "Competition prep" },
    place: { condo: "Condo gym", gym: "Gym", outdoor: "Outdoors", online: "Online" },
    area: { Wynwood: "Wynwood", Brickell: "Brickell", Midtown: "Midtown", Edgewater: "Edgewater", online: "Online" },
    sessions: { "2": "2 days", "3": "3 days", "4": "4 days", "5": "5 days" },
    schedule: { morning: "6:00–10:00 a.m.", midday: "10:00 a.m.–3:00 p.m.", evening: "3:00–8:00 p.m.", flexible: "Flexible" },
    level: { start: "Getting started", middle: "Already trains", advanced: "Advanced" },
    obstacle: { consistency: "Consistency", clarity: "Not sure what to do", time: "Lack of time", progress: "Not seeing progress" },
  },
} as const;

export function diagnosticAnswerLabel(
  group: keyof typeof ANSWER_LABELS.es,
  value: string,
  locale: "es" | "en" = "es",
) {
  const labels = ANSWER_LABELS[locale][group] as Record<string, string>;
  return labels[value] ?? (value || "—");
}

export function normalizedDiagnosticZone(answers: CoachDiagnosticAnswers) {
  return answers.place === "online" ? "online" : answers.area.toLowerCase();
}

export function coachInquirySource(attribution: CoachInquiryAttribution) {
  if (attribution.utmSource) return attribution.utmSource;
  if (attribution.gclid || attribution.gbraid || attribution.wbraid) return "google";
  if (attribution.fbclid) return "meta";
  return attribution.referrerHost || "direct";
}

/** Durable, human-readable fallback used before the additive CRM migration lands. */
export function structuredCoachInquiryMessage(
  input: PublicCoachInquiry,
  metadata: { contactConsentAt?: string; consentVersion?: string } = {},
) {
  const area = input.answers.place === "online" ? "online" : input.answers.area;
  return [
    "RG_DIAGNOSTIC_V1",
    `RG_SUBMISSION_ID: ${input.submissionId}`,
    `phone: ${input.phone}`,
    `preferred_contact: ${input.phone ? "whatsapp" : "email"}`,
    `goal: ${input.answers.goal}`,
    `place: ${input.answers.place}`,
    `area: ${area}`,
    `sessions: ${input.answers.sessions}`,
    `schedule: ${input.answers.schedule}`,
    `level: ${input.answers.level}`,
    `obstacle: ${input.answers.obstacle}`,
    `locale: ${input.locale}`,
    `elapsed_ms: ${input.elapsedMs}`,
    "contact_consent: true",
    `contact_consent_at: ${metadata.contactConsentAt ?? ""}`,
    `consent_version: ${metadata.consentVersion ?? RG_DIAGNOSTIC_CONSENT_VERSION}`,
    `utm_source: ${input.attribution.utmSource}`,
    `utm_medium: ${input.attribution.utmMedium}`,
    `utm_campaign: ${input.attribution.utmCampaign}`,
    `utm_content: ${input.attribution.utmContent}`,
    `utm_term: ${input.attribution.utmTerm}`,
    `utm_id: ${input.attribution.utmId}`,
    `utm_matchtype: ${input.attribution.utmMatchtype}`,
    `utm_device: ${input.attribution.utmDevice}`,
    `utm_network: ${input.attribution.utmNetwork}`,
    `utm_adgroup: ${input.attribution.utmAdgroup}`,
    `gclid: ${input.attribution.gclid}`,
    `gbraid: ${input.attribution.gbraid}`,
    `wbraid: ${input.attribution.wbraid}`,
    `fbclid: ${input.attribution.fbclid}`,
    `landing_path: ${input.attribution.landingPath}`,
    `referrer_host: ${input.attribution.referrerHost}`,
  ].join("\n");
}

export function parseStructuredCoachInquiryMessage(message: string): {
  submissionId: string;
  phone: string;
  preferredContact: "email" | "whatsapp";
  locale: "es" | "en";
  elapsedMs: number | null;
  contactConsentAt: string;
  consentVersion: string;
  answers: CoachDiagnosticAnswers;
  attribution: CoachInquiryAttribution;
} | null {
  if (!message.startsWith("RG_DIAGNOSTIC_V1\n")) return null;
  const fields = new Map<string, string>();
  for (const line of message.split("\n").slice(1)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }

  const answers = coachDiagnosticAnswersSchema.safeParse({
    goal: fields.get("goal") ?? "",
    place: fields.get("place") ?? "",
    area: fields.get("area") === "online" ? "" : (fields.get("area") ?? ""),
    sessions: fields.get("sessions") ?? "",
    schedule: fields.get("schedule") ?? "",
    level: fields.get("level") ?? "",
    obstacle: fields.get("obstacle") ?? "",
  });
  const attribution = coachInquiryAttributionSchema.safeParse({
    utmSource: fields.get("utm_source") ?? "",
    utmMedium: fields.get("utm_medium") ?? "",
    utmCampaign: fields.get("utm_campaign") ?? "",
    utmContent: fields.get("utm_content") ?? "",
    utmTerm: fields.get("utm_term") ?? "",
    utmId: fields.get("utm_id") ?? "",
    utmMatchtype: fields.get("utm_matchtype") ?? "",
    utmDevice: fields.get("utm_device") ?? "",
    utmNetwork: fields.get("utm_network") ?? "",
    utmAdgroup: fields.get("utm_adgroup") ?? "",
    gclid: fields.get("gclid") ?? "",
    gbraid: fields.get("gbraid") ?? "",
    wbraid: fields.get("wbraid") ?? "",
    fbclid: fields.get("fbclid") ?? "",
    landingPath: fields.get("landing_path") ?? "",
    referrerHost: fields.get("referrer_host") ?? "",
  });
  const submissionId = fields.get("RG_SUBMISSION_ID") ?? "";
  const phone = phoneSchema.safeParse(fields.get("phone") ?? "");
  const rawElapsedMs = fields.get("elapsed_ms") ?? "";
  const elapsedMs = /^\d{1,8}$/.test(rawElapsedMs) ? Number(rawElapsedMs) : null;
  const rawConsentAt = fields.get("contact_consent_at") ?? "";
  const contactConsentAt = rawConsentAt && !Number.isNaN(Date.parse(rawConsentAt)) ? rawConsentAt : "";
  const consentVersion = (fields.get("consent_version") ?? "").slice(0, 80);
  if (!answers.success || !attribution.success || !phone.success || !submissionId) return null;

  return {
    submissionId,
    phone: phone.data,
    preferredContact: fields.get("preferred_contact") === "whatsapp" || phone.data ? "whatsapp" : "email",
    locale: fields.get("locale") === "en" ? "en" : "es",
    elapsedMs: elapsedMs !== null && elapsedMs <= 86_400_000 ? elapsedMs : null,
    contactConsentAt,
    consentVersion,
    answers: answers.data,
    attribution: attribution.data,
  };
}
