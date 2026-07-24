import { afterEach, describe, expect, it } from "vitest";
import { memberNeedsIntake, type MemberContext } from "./member-access";
import { buildIntakeEmailSubject } from "@/lib/notifications/intake-notify";

function context(overrides: Partial<MemberContext> = {}): MemberContext {
  return {
    mode: "authenticated",
    userId: "u1",
    workspaceId: "ws-1",
    memberProfileId: "m1",
    fullName: "Cliente Nuevo",
    membershipActive: true,
    isAdmin: false,
    onboardingStatus: "not_started",
    intakeGateExempt: false,
    ...overrides,
  };
}

describe("memberNeedsIntake (gate de valoración, Lote B)", () => {
  afterEach(() => {
    delete process.env.INTAKE_GATE_DISABLED;
  });

  it("miembro nuevo sin intake → gated", () => {
    expect(memberNeedsIntake(context())).toBe(true);
    expect(memberNeedsIntake(context({ onboardingStatus: "invited" }))).toBe(true);
  });

  it("intake completado (cualquier estado posterior) → pasa", () => {
    for (const status of ["plan_brief_submitted", "coach_reviewed", "plans_applied"]) {
      expect(memberNeedsIntake(context({ onboardingStatus: status }))).toBe(false);
    }
  });

  it("grandfathering / override del coach (intake_gate_exempt) → pasa", () => {
    expect(memberNeedsIntake(context({ intakeGateExempt: true }))).toBe(false);
  });

  it("admin en preview → nunca gated (E-4)", () => {
    expect(memberNeedsIntake(context({ isAdmin: true }))).toBe(false);
  });

  it("modo open/demo → nunca gated (E-4)", () => {
    expect(memberNeedsIntake(context({ mode: "open" }))).toBe(false);
  });

  it("sin contexto → el gate no decide (lo maneja requireMemberContext)", () => {
    expect(memberNeedsIntake(null)).toBe(false);
  });

  it("kill-switch INTAKE_GATE_DISABLED=1 → todo pasa", () => {
    process.env.INTAKE_GATE_DISABLED = "1";
    expect(memberNeedsIntake(context())).toBe(false);
  });
});

describe("buildIntakeEmailSubject", () => {
  it("sin alertas", () => {
    expect(buildIntakeEmailSubject("Marina López", 0)).toBe("[Valoración] Marina López completó su cuestionario");
  });

  it("con alertas de seguridad, visibles en el asunto", () => {
    expect(buildIntakeEmailSubject("Marina López", 2)).toBe("[Valoración] Marina López completó su cuestionario · ⚠ 2 alertas de salud");
    expect(buildIntakeEmailSubject("Marina López", 1)).toBe("[Valoración] Marina López completó su cuestionario · ⚠ 1 alerta de salud");
  });
});
