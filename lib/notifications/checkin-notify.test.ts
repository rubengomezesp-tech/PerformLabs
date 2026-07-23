import { describe, expect, it } from "vitest";
import { shouldSendCoachEmails } from "./coach-email";
import { buildCheckinEmailBody, buildCheckinEmailSubject, type CheckinEmailFacts } from "./checkin-notify";

function facts(overrides: Partial<CheckinEmailFacts> = {}): CheckinEmailFacts {
  return {
    memberName: "Marina López",
    weightKg: 82.4,
    weightDeltaKg: -0.6,
    photoCount: 3,
    trainingAdherence: "85",
    nutritionAdherence: "90",
    notes: "",
    checkinId: "chk-1",
    ...overrides,
  };
}

describe("buildCheckinEmailSubject (triage en el inbox)", () => {
  it("lleva nombre, peso con delta y fotos", () => {
    expect(buildCheckinEmailSubject(facts())).toBe("[Check-in] Marina López — 82.4kg (-0.6) · 3 fotos");
  });

  it("primer check-in: sin delta, lo dice explícitamente", () => {
    expect(buildCheckinEmailSubject(facts({ weightDeltaKg: null, photoCount: 0 }))).toBe("[Check-in] Marina López — 82.4kg · primer registro");
  });

  it("delta positivo lleva signo +", () => {
    expect(buildCheckinEmailSubject(facts({ weightDeltaKg: 1.2, photoCount: 0 }))).toBe("[Check-in] Marina López — 82.4kg (+1.2)");
  });

  it("solo notas/fotos (sin peso) sigue siendo un asunto válido", () => {
    expect(buildCheckinEmailSubject(facts({ weightKg: null, weightDeltaKg: null, photoCount: 1 }))).toBe("[Check-in] Marina López — 1 foto");
    expect(buildCheckinEmailSubject(facts({ weightKg: null, weightDeltaKg: null, photoCount: 0 }))).toBe("[Check-in] Marina López");
  });
});

describe("buildCheckinEmailBody", () => {
  it("incluye el deep-link con ancla del check-in", () => {
    const body = buildCheckinEmailBody(facts());
    expect(body.html).toContain("#checkin-chk-1");
    expect(body.text).toContain("#checkin-chk-1");
  });

  it("escapa HTML en nombre y notas (sin inyección en el email)", () => {
    const body = buildCheckinEmailBody(facts({ memberName: "<img src=x>", notes: "<script>alert(1)</script>" }));
    expect(body.html).not.toContain("<img src=x>");
    expect(body.html).not.toContain("<script>");
    expect(body.html).toContain("&lt;script&gt;");
  });
});

describe("shouldSendCoachEmails (gating por entorno)", () => {
  it("producción de Vercel: envía", () => {
    expect(shouldSendCoachEmails({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("preview de Vercel: NUNCA envía (comparte env vars con prod)", () => {
    expect(shouldSendCoachEmails({ VERCEL_ENV: "preview" })).toBe(false);
    expect(shouldSendCoachEmails({ VERCEL_ENV: "development" })).toBe(false);
  });

  it("local (sin VERCEL_ENV): permite (las claves solo viven en Vercel)", () => {
    expect(shouldSendCoachEmails({})).toBe(true);
  });
});
