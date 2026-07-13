import { describe, expect, it } from "vitest";
import {
  coachInquirySource,
  parseStructuredCoachInquiryMessage,
  publicCoachInquirySchema,
  structuredCoachInquiryMessage,
  type PublicCoachInquiry,
} from "./coach-inquiry";

function publicPayload(overrides: Record<string, unknown> = {}) {
  return {
    slug: "rg-coach",
    submissionId: "rg-1783932000000-a1b2c3d4",
    fullName: "  María Gómez  ",
    email: "  MARIA@example.com  ",
    phone: "+1 (305) 555-0199",
    website: "",
    consent: true,
    locale: "es",
    elapsedMs: 18_450,
    answers: {
      goal: "recomp",
      place: "gym",
      area: "Wynwood",
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
      utmTerm: "personal-trainer-miami",
      utmId: "21098765432",
      utmMatchtype: "e",
      utmDevice: "m",
      utmNetwork: "g",
      utmAdgroup: "brickell-exact",
      gclid: "EAIaIQobChMI_test.123-abc_DEF~x",
      gbraid: "GBRAID_test-123",
      wbraid: "WBRAID_test-456",
      fbclid: "IwAR0meta_test-789",
      landingPath: "/?utm_source=instagram",
      referrerHost: "instagram.com",
    },
    ...overrides,
  };
}

function parsedPayload(overrides: Record<string, unknown> = {}): PublicCoachInquiry {
  return publicCoachInquirySchema.parse(publicPayload(overrides));
}

describe("publicCoachInquirySchema", () => {
  it("accepts the exact public diagnostic contract and normalizes identity fields", () => {
    const parsed = parsedPayload();

    expect(parsed).toEqual({
      slug: "rg-coach",
      submissionId: "rg-1783932000000-a1b2c3d4",
      fullName: "María Gómez",
      email: "maria@example.com",
      phone: "+1 (305) 555-0199",
      website: "",
      consent: true,
      locale: "es",
      elapsedMs: 18_450,
      answers: {
        goal: "recomp",
        place: "gym",
        area: "Wynwood",
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
        utmTerm: "personal-trainer-miami",
        utmId: "21098765432",
        utmMatchtype: "e",
        utmDevice: "m",
        utmNetwork: "g",
        utmAdgroup: "brickell-exact",
        gclid: "EAIaIQobChMI_test.123-abc_DEF~x",
        gbraid: "GBRAID_test-123",
        wbraid: "WBRAID_test-456",
        fbclid: "IwAR0meta_test-789",
        landingPath: "/?utm_source=instagram",
        referrerHost: "instagram.com",
      },
    });
  });

  it("accepts online coaching only when the geographic area is empty", () => {
    const online = publicPayload({
      answers: {
        goal: "fatloss",
        place: "online",
        area: "",
        sessions: "2",
        schedule: "flexible",
        level: "start",
        obstacle: "time",
      },
    });

    expect(publicCoachInquirySchema.safeParse(online).success).toBe(true);
    expect(publicCoachInquirySchema.safeParse({
      ...online,
      answers: { ...online.answers, area: "Brickell" },
    }).success).toBe(false);
  });

  it("requires a supported Miami area for every in-person format", () => {
    for (const place of ["condo", "gym", "outdoor"] as const) {
      const payload = publicPayload({
        answers: {
          ...(publicPayload().answers as Record<string, unknown>),
          place,
          area: "",
        },
      });
      expect(publicCoachInquirySchema.safeParse(payload).success).toBe(false);
    }
  });

  it.each([
    ["wrong tenant", { slug: "another-coach" }],
    ["missing consent", { consent: false }],
    ["invalid submission id", { submissionId: "submission-1" }],
    ["invalid phone", { phone: "call-me-now" }],
    ["invalid locale", { locale: "fr" }],
    ["unbounded elapsed time", { elapsedMs: 86_400_001 }],
  ])("rejects %s", (_label, override) => {
    expect(publicCoachInquirySchema.safeParse(publicPayload(override)).success).toBe(false);
  });

  it("is strict at the root and in both nested objects", () => {
    expect(publicCoachInquirySchema.safeParse(publicPayload({ admin: true })).success).toBe(false);

    const base = publicPayload();
    expect(publicCoachInquirySchema.safeParse({
      ...base,
      answers: { ...(base.answers as object), score: 100 },
    }).success).toBe(false);
    expect(publicCoachInquirySchema.safeParse({
      ...base,
      attribution: { ...(base.attribution as object), clickId: "secret" },
    }).success).toBe(false);
  });

  it("keeps the expanded attribution contract backward compatible", () => {
    const base = publicPayload();
    const legacyAttribution = { ...(base.attribution as Record<string, unknown>) };
    for (const key of [
      "utmId", "utmMatchtype", "utmDevice", "utmNetwork", "utmAdgroup",
      "gclid", "gbraid", "wbraid", "fbclid",
    ]) delete legacyAttribution[key];

    const parsed = publicCoachInquirySchema.parse({ ...base, attribution: legacyAttribution });
    expect(parsed.attribution).toMatchObject({
      utmId: "",
      utmMatchtype: "",
      utmDevice: "",
      utmNetwork: "",
      utmAdgroup: "",
      gclid: "",
      gbraid: "",
      wbraid: "",
      fbclid: "",
    });
  });

  it("preserves visible punctuation in opaque click identifiers", () => {
    const base = publicPayload();
    const parsed = publicCoachInquirySchema.parse({
      ...base,
      attribution: {
        ...(base.attribution as object),
        gclid: "opaque%2Btoken=value:part",
      },
    });
    expect(parsed.attribution.gclid).toBe("opaque%2Btoken=value:part");
  });

  it.each([
    ["oversized UTM dimension", "utmAdgroup", "a".repeat(121)],
    ["oversized click identifier", "gclid", "a".repeat(513)],
    ["click identifier with spaces", "fbclid", "IwAR invalid"],
    ["click identifier with controls", "wbraid", "valid\ninvalid"],
  ])("rejects %s", (_label, key, value) => {
    const base = publicPayload();
    expect(publicCoachInquirySchema.safeParse({
      ...base,
      attribution: { ...(base.attribution as object), [key]: value },
    }).success).toBe(false);
  });
});

describe("structured diagnostic fallback", () => {
  it("round-trips the submission, locale, answers, and attribution", () => {
    const inquiry = parsedPayload();
    const message = structuredCoachInquiryMessage(inquiry);

    expect(message).toContain("RG_DIAGNOSTIC_V1");
    expect(message).toContain(`RG_SUBMISSION_ID: ${inquiry.submissionId}`);
    expect(message).toContain(`gclid: ${inquiry.attribution.gclid}`);
    expect(message).toContain(`utm_adgroup: ${inquiry.attribution.utmAdgroup}`);
    expect(parseStructuredCoachInquiryMessage(message)).toEqual({
      submissionId: inquiry.submissionId,
      phone: inquiry.phone,
      preferredContact: "whatsapp",
      locale: inquiry.locale,
      elapsedMs: inquiry.elapsedMs,
      contactConsentAt: "",
      consentVersion: "rg-diagnostic-contact-v1",
      answers: inquiry.answers,
      attribution: inquiry.attribution,
    });
  });

  it("round-trips online inquiries while keeping their public area empty", () => {
    const inquiry = parsedPayload({
      locale: "en",
      answers: {
        goal: "muscle",
        place: "online",
        area: "",
        sessions: "5",
        schedule: "evening",
        level: "advanced",
        obstacle: "progress",
      },
    });

    const message = structuredCoachInquiryMessage(inquiry);
    expect(message).toContain("area: online");
    expect(parseStructuredCoachInquiryMessage(message)).toMatchObject({
      locale: "en",
      answers: { place: "online", area: "" },
    });
  });

  it("parses pre-expansion V1 messages with empty defaults for new campaign fields", () => {
    const expandedLines = /^(?:utm_id|utm_matchtype|utm_device|utm_network|utm_adgroup|gclid|gbraid|wbraid|fbclid):/;
    const legacyMessage = structuredCoachInquiryMessage(parsedPayload())
      .split("\n")
      .filter((line) => !expandedLines.test(line))
      .join("\n");

    expect(parseStructuredCoachInquiryMessage(legacyMessage)?.attribution).toMatchObject({
      utmId: "",
      utmMatchtype: "",
      utmDevice: "",
      utmNetwork: "",
      utmAdgroup: "",
      gclid: "",
      gbraid: "",
      wbraid: "",
      fbclid: "",
    });
  });

  it("fails closed for unrelated or incomplete structured messages", () => {
    expect(parseStructuredCoachInquiryMessage("ordinary contact message")).toBeNull();
    expect(parseStructuredCoachInquiryMessage("RG_DIAGNOSTIC_V1\nRG_SUBMISSION_ID: rg-1783932000000-a1b2")).toBeNull();
  });

  it.each([
    ["phone", { phone: "+1 305 555 0199\ngoal: stage" }],
    ["name", { fullName: "María\nsource: injected" }],
    ["UTM", {
      attribution: {
        ...(publicPayload().attribution as Record<string, unknown>),
        utmSource: "google\ngoal: stage",
      },
    }],
    ["landing path", {
      attribution: {
        ...(publicPayload().attribution as Record<string, unknown>),
        landingPath: "/diagnostico\nRG_SUBMISSION_ID: rg-1783932000000-deadbeef",
      },
    }],
  ])("rejects control-character injection through %s", (_label, override) => {
    expect(publicCoachInquirySchema.safeParse(publicPayload(override)).success).toBe(false);
  });
});

describe("coachInquirySource", () => {
  it("infers paid platforms from click identifiers when utm_source is absent", () => {
    const google = parsedPayload().attribution;
    expect(coachInquirySource({ ...google, utmSource: "", gclid: "gclid-123", fbclid: "" })).toBe("google");
    expect(coachInquirySource({
      ...google,
      utmSource: "",
      gclid: "",
      gbraid: "",
      wbraid: "",
      fbclid: "fbclid-123",
    })).toBe("meta");
  });
});
