import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createCoachInquiry: vi.fn(),
  findCoachInquirySubmission: vi.fn(),
  resolveWorkspaceBrand: vi.fn(),
  sendRgCoachLeadEmails: vi.fn(),
}));

vi.mock("@/lib/rate-limit/shared", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));
vi.mock("@/lib/repositories/coach-inquiries", () => ({
  createCoachInquiry: mocks.createCoachInquiry,
  findCoachInquirySubmission: mocks.findCoachInquirySubmission,
}));
vi.mock("@/lib/repositories/workspaces", () => ({
  resolveWorkspaceBrand: mocks.resolveWorkspaceBrand,
}));
vi.mock("@/lib/email/rg-coach-leads", () => ({
  sendRgCoachLeadEmails: mocks.sendRgCoachLeadEmails,
}));

import { RG_COACH_WORKSPACE_ID } from "@/lib/workspace-brand-assets";
import { OPTIONS, POST } from "./route";

const origin = "https://rubengomezcoaching.com";
const workspace = {
  id: RG_COACH_WORKSPACE_ID,
  name: "RG Coach",
  appName: "RG Coach",
  supportEmail: "rubengomezesp@gmail.com",
  domain: "miembros.rubengomezcoaching.com",
  publicDomain: "rubengomezcoaching.com",
  memberDomain: "miembros.rubengomezcoaching.com",
  fallbackSubdomain: "rg-coach.performlabs.app",
  accentColor: "#2f6bff",
  isActive: true,
};

const validPayload = {
  slug: "rg-coach",
  submissionId: "rg-1783932000000-ab12cd34",
  fullName: "María Miami",
  email: "maria@example.com",
  phone: "+1 305 555 0199",
  website: "",
  consent: true,
  locale: "es",
  elapsedMs: 48_000,
  answers: {
    goal: "recomp",
    place: "condo",
    area: "Brickell",
    sessions: "3",
    schedule: "morning",
    level: "middle",
    obstacle: "progress",
  },
  attribution: {
    utmSource: "google",
    utmMedium: "organic",
    utmCampaign: "brickell",
    utmContent: "",
    utmTerm: "personal trainer brickell",
    landingPath: "/?utm_source=google",
    referrerHost: "google.com",
  },
};

function request(body: unknown = validPayload, headers: Record<string, string> = {}) {
  return new Request("https://miembros.rubengomezcoaching.com/api/public/coach-inquiries", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-Forwarded-For": "203.0.113.42",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as NextRequest;
}

describe("public RG coach inquiry API", () => {
  beforeEach(() => {
    process.env.RG_COACH_RATE_LIMIT_SECRET = "test-rate-limit-secret";
    mocks.consumeRateLimit.mockReset().mockResolvedValue(true);
    mocks.createCoachInquiry.mockReset().mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      duplicate: false,
      legacySchema: false,
    });
    mocks.findCoachInquirySubmission.mockReset().mockResolvedValue("");
    mocks.resolveWorkspaceBrand.mockReset().mockResolvedValue(workspace);
    mocks.sendRgCoachLeadEmails.mockReset().mockResolvedValue({
      configured: true,
      confirmation: "sent",
      notification: "sent",
    });
  });

  it("answers a valid preflight with the exact CORS origin", async () => {
    const response = await OPTIONS(new Request("https://miembros.example/api", {
      method: "OPTIONS",
      headers: { Origin: "https://www.rubengomezcoaching.com" },
    }) as NextRequest);

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://www.rubengomezcoaching.com");
    expect(response.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  });

  it("rejects an untrusted browser origin before any storage or limiter call", async () => {
    const response = await POST(request(validPayload, { Origin: "https://rubengomezcoaching.com.evil.test" }));

    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
    expect(mocks.createCoachInquiry).not.toHaveBeenCalled();
  });

  it("enforces JSON content type and a bounded body", async () => {
    const wrongType = await POST(request(validPayload, { "Content-Type": "text/plain" }));
    expect(wrongType.status).toBe(415);

    const tooLarge = await POST(request(validPayload, { "Content-Length": "20000" }));
    expect(tooLarge.status).toBe(413);
    expect(mocks.createCoachInquiry).not.toHaveBeenCalled();
  });

  it("returns a generic validation error for malformed or extra fields", async () => {
    const malformed = await POST(request("{not-json"));
    expect(malformed.status).toBe(400);

    const invalid = await POST(request({ ...validPayload, unexpected: "never stored" }));
    expect(invalid.status).toBe(422);
    await expect(invalid.json()).resolves.toEqual({ ok: false, error: "Revisa los datos del formulario." });
  });

  it("silently accepts the honeypot without resolving a tenant, storing PII or emailing", async () => {
    const response = await POST(request({ ...validPayload, website: "https://spam.example" }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.consumeRateLimit).toHaveBeenCalledOnce();
    expect(mocks.resolveWorkspaceBrand).not.toHaveBeenCalled();
    expect(mocks.createCoachInquiry).not.toHaveBeenCalled();
    expect(mocks.sendRgCoachLeadEmails).not.toHaveBeenCalled();
  });

  it("persists the exact diagnostic contract and uses only HMAC identifiers in shared limits", async () => {
    const response = await POST(request());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.resolveWorkspaceBrand).toHaveBeenCalledWith(RG_COACH_WORKSPACE_ID);
    expect(mocks.createCoachInquiry).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId: RG_COACH_WORKSPACE_ID,
      fullName: "María Miami",
      email: "maria@example.com",
      phone: "+1 305 555 0199",
      kind: "diagnostic",
      preferredContact: "whatsapp",
      answers: validPayload.answers,
      attribution: validPayload.attribution,
      submissionId: validPayload.submissionId,
      elapsedMs: 48_000,
      source: "google",
    }));
    const buckets = mocks.consumeRateLimit.mock.calls.map(([bucket]) => String(bucket));
    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatch(/:ip:[a-f0-9]{64}$/);
    expect(buckets[1]).toMatch(/:identity:[a-f0-9]{64}$/);
    expect(buckets.join(" ")).not.toContain("203.0.113.42");
    expect(buckets.join(" ")).not.toContain("maria@example.com");
    expect(mocks.sendRgCoachLeadEmails).toHaveBeenCalledWith({ workspace, inquiry: validPayload });
  });

  it("returns 429 with Retry-After when the identity bucket is exhausted", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(mocks.createCoachInquiry).not.toHaveBeenCalled();
  });

  it("makes repeat submission IDs idempotent and does not repeat emails", async () => {
    mocks.createCoachInquiry.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      duplicate: true,
      legacySchema: false,
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, duplicate: true });
    expect(mocks.sendRgCoachLeadEmails).not.toHaveBeenCalled();
  });

  it("answers an already persisted submission before consuming the identity quota", async () => {
    mocks.findCoachInquirySubmission.mockResolvedValue("11111111-1111-4111-8111-111111111111");

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, duplicate: true });
    expect(mocks.consumeRateLimit).toHaveBeenCalledOnce();
    expect(mocks.createCoachInquiry).not.toHaveBeenCalled();
    expect(mocks.sendRgCoachLeadEmails).not.toHaveBeenCalled();
  });

  it("fails closed when the fixed RG workspace cannot be resolved", async () => {
    mocks.resolveWorkspaceBrand.mockResolvedValue({ ...workspace, id: "00000000-0000-0000-0000-000000000000" });

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(mocks.createCoachInquiry).not.toHaveBeenCalled();
    expect(mocks.sendRgCoachLeadEmails).not.toHaveBeenCalled();
  });
});
