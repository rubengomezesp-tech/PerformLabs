import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicCoachInquiry } from "@/lib/lead-capture/coach-inquiry";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";
import { RG_COACH_WORKSPACE_ID } from "@/lib/workspace-brand-assets";
import {
  buildRgCoachLeadConfirmation,
  buildRgCoachLeadNotification,
  sendRgCoachLeadEmails,
} from "./rg-coach-leads";

const envKeys = [
  "RG_COACH_RESEND_API_KEY",
  "RG_COACH_RESEND_FROM",
  "RG_COACH_LEADS_TO",
] as const;
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

const workspace: WorkspaceBrand = {
  id: RG_COACH_WORKSPACE_ID,
  name: "Rubén Gómez Coaching",
  appName: "RG Coach",
  supportEmail: "soporte@rubengomezcoaching.com",
  domain: "miembros.rubengomezcoaching.com",
  publicDomain: "rubengomezcoaching.com",
  memberDomain: "miembros.rubengomezcoaching.com",
  fallbackSubdomain: "rg-coach.performlabs.app",
  accentColor: "#2f6bff",
  isActive: true,
};

function inquiry(overrides: Partial<PublicCoachInquiry> = {}): PublicCoachInquiry {
  return {
    slug: "rg-coach",
    submissionId: "rg-1783932000000-a1b2c3d4",
    fullName: "María Gómez",
    email: "maria@example.com",
    phone: "+1 305 555 0199",
    website: "",
    consent: true,
    locale: "es",
    elapsedMs: 21_500,
    answers: {
      goal: "recomp",
      place: "gym",
      area: "Brickell",
      sessions: "3",
      schedule: "morning",
      level: "middle",
      obstacle: "consistency",
    },
    attribution: {
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "miami-summer",
      utmContent: "reel-01",
      utmTerm: "coach-miami",
      landingPath: "/diagnostico",
      referrerHost: "instagram.com",
    },
    ...overrides,
  };
}

function requestBodies(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)) as {
    from: string;
    to: string[];
    reply_to: string;
    subject: string;
    html: string;
    text: string;
    tags: Array<{ name: string; value: string }>;
  });
}

function messageByTag(
  bodies: ReturnType<typeof requestBodies>,
  tag: "lead_confirmation" | "lead_notification",
) {
  return bodies.find((body) => body.tags.some((item) => item.name === "message_type" && item.value === tag));
}

describe("RG Coach lead email templates", () => {
  it.each([
    ["confirmation", buildRgCoachLeadConfirmation],
    ["notification", buildRgCoachLeadNotification],
  ] as const)("renders the %s with exactly the approved logo and signature images", (_name, build) => {
    const message = build(inquiry());

    expect(message.html.match(/<img\b/g)).toHaveLength(2);
    expect(message.html).toContain('src="https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-lockup-horizontal-white-1024.png"');
    expect(message.html).toContain('src="https://miembros.rubengomezcoaching.com/brand/rg-coach/ruben-gomez-signature-white-512.png"');
    expect(message.html).not.toContain("PerformLabs");
    expect(message.html).not.toContain("FitControl");
  });

  it("escapes lead-controlled HTML in both customer and internal templates", () => {
    const malicious = inquiry({
      fullName: '<img src=x onerror=alert(1)> & "Ruben"',
      phone: "",
      submissionId: "rg-1783932000000-deadbeef",
      attribution: {
        ...inquiry().attribution,
        utmSource: '<script>alert("x")</script>',
      },
    });
    const confirmation = buildRgCoachLeadConfirmation(malicious);
    const notification = buildRgCoachLeadNotification(malicious);

    for (const html of [confirmation.html, notification.html]) {
      expect(html).not.toContain("<img src=x onerror=alert(1)>");
      expect(html).not.toContain('<script>alert("x")</script>');
      expect(html).toContain("&lt;img");
    }
    expect(notification.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
});

describe("sendRgCoachLeadEmails", () => {
  beforeEach(() => {
    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    process.env.RG_COACH_RESEND_FROM = "Rubén · RG Coach <hola@contacto.rubengomezcoaching.com>";
    process.env.RG_COACH_LEADS_TO = "leads@rubengomezcoaching.com";
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends one branded confirmation to the lead and one internal notification", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendRgCoachLeadEmails({ workspace, inquiry: inquiry() })).resolves.toEqual({
      configured: true,
      confirmation: "sent",
      notification: "sent",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, init] of fetchMock.mock.calls as Array<[string, RequestInit]>) {
      expect(url).toBe("https://api.resend.com/emails");
      expect(init.headers).toMatchObject({
        Authorization: "Bearer test-rg-resend-key",
        "Content-Type": "application/json",
        "User-Agent": "rg-coach-lead-capture/1.0",
      });
    }

    const bodies = requestBodies(fetchMock);
    expect(messageByTag(bodies, "lead_confirmation")).toMatchObject({
      from: "Rubén · RG Coach <hola@contacto.rubengomezcoaching.com>",
      to: ["maria@example.com"],
      reply_to: "leads@rubengomezcoaching.com",
    });
    expect(messageByTag(bodies, "lead_notification")).toMatchObject({
      from: "Rubén · RG Coach <hola@contacto.rubengomezcoaching.com>",
      to: ["leads@rubengomezcoaching.com"],
      reply_to: "maria@example.com",
    });
  });

  it.each([undefined, "not-an-email"])('uses the protected internal fallback when RG_COACH_LEADS_TO is %s', async (leadsTo) => {
    if (leadsTo === undefined) delete process.env.RG_COACH_LEADS_TO;
    else process.env.RG_COACH_LEADS_TO = leadsTo;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await sendRgCoachLeadEmails({ workspace, inquiry: inquiry() });

    const bodies = requestBodies(fetchMock);
    expect(messageByTag(bodies, "lead_confirmation")?.reply_to).toBe("rubengomezesp@gmail.com");
    expect(messageByTag(bodies, "lead_notification")?.to).toEqual(["rubengomezesp@gmail.com"]);
  });

  it("reports provider failures without throwing or cancelling the other message", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendRgCoachLeadEmails({ workspace, inquiry: inquiry() })).resolves.toEqual({
      configured: true,
      confirmation: "failed",
      notification: "sent",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      "RG lead email provider rejected a message",
      { type: "lead_confirmation", status: 503 },
    );
  });

  it("skips delivery when configuration is incomplete or the workspace is not RG", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.RG_COACH_RESEND_API_KEY;

    await expect(sendRgCoachLeadEmails({ workspace, inquiry: inquiry() })).resolves.toEqual({
      configured: false,
      confirmation: "skipped",
      notification: "skipped",
    });

    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    await expect(sendRgCoachLeadEmails({
      workspace: { ...workspace, id: "11111111-1111-4111-8111-111111111111" },
      inquiry: inquiry(),
    })).resolves.toEqual({
      configured: false,
      confirmation: "skipped",
      notification: "skipped",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
