import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { sendRgCoachLeadEmails } from "@/lib/email/rg-coach-leads";
import {
  coachInquirySource,
  publicCoachInquirySchema,
  RG_DIAGNOSTIC_CONSENT_VERSION,
  structuredCoachInquiryMessage,
} from "@/lib/lead-capture/coach-inquiry";
import {
  coachInquiryCorsHeaders,
  isAllowedCoachInquiryOrigin,
} from "@/lib/lead-capture/public-origin";
import { consumeRateLimit } from "@/lib/rate-limit/shared";
import { createCoachInquiry, findCoachInquirySubmission } from "@/lib/repositories/coach-inquiries";
import { resolveWorkspaceBrand } from "@/lib/repositories/workspaces";
import { RG_COACH_WORKSPACE_ID } from "@/lib/workspace-brand-assets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const IP_RATE_LIMIT = { windowMs: 15 * 60_000, max: 12, failClosed: true } as const;
const IDENTITY_RATE_LIMIT = { windowMs: 60 * 60_000, max: 4, failClosed: true } as const;

class BodyTooLargeError extends Error {}

function jsonResponse(
  origin: string | null,
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  if (origin) {
    for (const [name, value] of Object.entries(coachInquiryCorsHeaders(origin))) {
      headers.set(name, value);
    }
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function requestIp(request: NextRequest) {
  const candidate = request.headers.get("x-forwarded-for")?.split(",")[0]
    || request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || "unknown";
  return candidate.trim().toLowerCase().slice(0, 80) || "unknown";
}

function privateDigest(value: string) {
  const key = process.env.RG_COACH_RATE_LIMIT_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || "rg-coach-public-rate-limit-v1";
  return createHmac("sha256", key).update(value).digest("hex");
}

async function readBoundedBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new BodyTooLargeError();
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!isAllowedCoachInquiryOrigin(origin)) {
    return jsonResponse(null, 403, { ok: false, error: "Origen no autorizado." });
  }
  return new Response(null, {
    status: 204,
    headers: coachInquiryCorsHeaders(origin!),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!isAllowedCoachInquiryOrigin(origin)) {
    return jsonResponse(null, 403, { ok: false, error: "Origen no autorizado." });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse(origin, 415, { ok: false, error: "El contenido debe ser JSON." });
  }

  const ipDigest = privateDigest(requestIp(request));
  const ipBucket = `coach-inquiry:${RG_COACH_WORKSPACE_ID}:ip:${ipDigest}`;
  if (!(await consumeRateLimit(ipBucket, IP_RATE_LIMIT))) {
    return jsonResponse(
      origin,
      429,
      { ok: false, error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { "Retry-After": "900" },
    );
  }

  let rawBody: string;
  try {
    rawBody = await readBoundedBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return jsonResponse(origin, 413, { ok: false, error: "La solicitud es demasiado grande." });
    }
    return jsonResponse(origin, 400, { ok: false, error: "JSON no válido." });
  }

  let unknownBody: unknown;
  try {
    unknownBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse(origin, 400, { ok: false, error: "JSON no válido." });
  }

  const parsed = publicCoachInquirySchema.safeParse(unknownBody);
  if (!parsed.success) {
    return jsonResponse(origin, 422, { ok: false, error: "Revisa los datos del formulario." });
  }
  const inquiry = parsed.data;

  // Deliberately indistinguishable success response: bots filling the trap do
  // not learn that the submission was discarded, and no PII reaches storage.
  if (inquiry.website) {
    return jsonResponse(origin, 201, { ok: true });
  }

  // A browser retry is answered before consuming the identity quota. The
  // durable marker lookup works on both the legacy and migrated schemas.
  const existingId = await findCoachInquirySubmission(
    RG_COACH_WORKSPACE_ID,
    inquiry.email,
    inquiry.submissionId,
  );
  if (existingId) {
    return jsonResponse(origin, 200, { ok: true, duplicate: true });
  }

  // Bind the identity bucket to the caller as well as the email. A third party
  // cannot exhaust a victim's global email quota from a different address.
  const identityBucket = `coach-inquiry:${RG_COACH_WORKSPACE_ID}:identity:${privateDigest(`${inquiry.email}\0${ipDigest}`)}`;
  if (!(await consumeRateLimit(identityBucket, IDENTITY_RATE_LIMIT))) {
    return jsonResponse(
      origin,
      429,
      { ok: false, error: "Ya hemos recibido varias solicitudes. Rubén te responderá pronto." },
      { "Retry-After": "3600" },
    );
  }

  try {
    const workspace = await resolveWorkspaceBrand(RG_COACH_WORKSPACE_ID);
    if (workspace.id !== RG_COACH_WORKSPACE_ID || !workspace.isActive) {
      return jsonResponse(origin, 503, { ok: false, error: "El formulario no está disponible ahora mismo." });
    }

    const contactConsentAt = new Date().toISOString();
    const created = await createCoachInquiry({
      workspaceId: RG_COACH_WORKSPACE_ID,
      fullName: inquiry.fullName,
      email: inquiry.email,
      phone: inquiry.phone,
      message: structuredCoachInquiryMessage(inquiry, {
        contactConsentAt,
        consentVersion: RG_DIAGNOSTIC_CONSENT_VERSION,
      }),
      kind: "diagnostic",
      preferredContact: inquiry.phone ? "whatsapp" : "email",
      locale: inquiry.locale,
      answers: inquiry.answers,
      attribution: inquiry.attribution,
      submissionId: inquiry.submissionId,
      elapsedMs: inquiry.elapsedMs,
      contactConsentAt,
      consentVersion: RG_DIAGNOSTIC_CONSENT_VERSION,
      priority: inquiry.answers.goal === "stage" ? "high" : "normal",
      source: coachInquirySource(inquiry.attribution),
    });

    if (!created.duplicate) {
      await sendRgCoachLeadEmails({ workspace, inquiry });
    }

    return jsonResponse(origin, created.duplicate ? 200 : 201, {
      ok: true,
      ...(created.duplicate ? { duplicate: true } : {}),
    });
  } catch {
    // Public responses and logs intentionally exclude form values and provider
    // details. The repository/provider have their own sanitized diagnostics.
    console.error("RG coach inquiry could not be persisted");
    return jsonResponse(origin, 503, { ok: false, error: "No se pudo guardar. Inténtalo de nuevo o usa WhatsApp." });
  }
}
