"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicCoachContactSchema } from "@/lib/lead-capture/public-coach-contact";
import { consumeRateLimit } from "@/lib/rate-limit/shared";
import {
  createCoachInquiry,
  findCoachInquirySubmission,
} from "@/lib/repositories/coach-inquiries";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function privateDigest(value: string) {
  const key = process.env.RG_COACH_RATE_LIMIT_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || "public-coach-contact-rate-limit-v1";
  return createHmac("sha256", key).update(value).digest("hex");
}

async function requestIp() {
  const requestHeaders = await headers();
  const candidate = requestHeaders.get("x-forwarded-for")?.split(",")[0]
    || requestHeaders.get("cf-connecting-ip")
    || requestHeaders.get("x-real-ip")
    || "unknown";
  return candidate.trim().toLowerCase().slice(0, 80) || "unknown";
}

/**
 * Contact / 1-1 coaching application from a coach's public site. Resolves the workspace
 * from the slug (never trusts a posted id), captures the inquiry, and redirects back with
 * a status. redirect() is called outside the try so its control-flow throw isn't swallowed.
 */
export async function submitCoachInquiryAction(formData: FormData): Promise<void> {
  const rawSlug = readText(formData, "slug").toLowerCase();
  const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawSlug) && rawSlug.length <= 80
    ? rawSlug
    : "";
  const kind = readText(formData, "kind") === "coaching" ? "coaching" : "contact";
  const basePath = safeSlug
    ? (kind === "coaching" ? `/c/${safeSlug}/1-1-coaching` : `/c/${safeSlug}/contacto`)
    : "/";

  const parsed = publicCoachContactSchema.safeParse({
    slug: rawSlug,
    kind,
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    message: readText(formData, "message"),
    website: readText(formData, "website"),
    submissionId: readText(formData, "submissionId"),
  });

  let ok = false;
  if (parsed.success) {
    const inquiry = parsed.data;
    const brand = await getWorkspaceBrand(inquiry.slug);

    // Return the same success state for the hidden bot trap without persisting
    // or revealing that the submission was discarded.
    if (brand.id !== ZERO_UUID && inquiry.website) {
      redirect(`${basePath}?status=sent`);
    }

    if (brand.id !== ZERO_UUID) {
      try {
        const ipDigest = privateDigest(await requestIp());
        const existingId = await findCoachInquirySubmission(
          brand.id,
          inquiry.email,
          inquiry.submissionId,
        );

        if (existingId) {
          ok = true;
        } else {
          const ipAllowed = await consumeRateLimit(
            `coach-contact:${brand.id}:ip:${ipDigest}`,
            { windowMs: 15 * 60_000, max: 10, failClosed: true },
          );
          const identityAllowed = ipAllowed && await consumeRateLimit(
            `coach-contact:${brand.id}:identity:${privateDigest(`${inquiry.email}\0${ipDigest}`)}`,
            { windowMs: 60 * 60_000, max: 4, failClosed: true },
          );

          if (ipAllowed && identityAllowed) {
            await createCoachInquiry({
              workspaceId: brand.id,
              fullName: inquiry.fullName,
              email: inquiry.email,
              message: inquiry.message,
              kind: inquiry.kind,
              locale: "es",
              submissionId: inquiry.submissionId,
              source: "coach_public_page",
            });
            ok = true;
          }
        }
      } catch {
        ok = false;
      }
    }
  }

  redirect(`${basePath}?status=${ok ? "sent" : "error"}`);
}
