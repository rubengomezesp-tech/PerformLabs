import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkLoginRateLimit: vi.fn(),
  createClient: vi.fn(),
  recordSecurityAuditEvent: vi.fn(),
  redirect: vi.fn(),
  resolveMemberAccessWorkspace: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => ({
      "x-forwarded-for": "203.0.113.10",
      "x-forwarded-host": "miembros.rubengomezcoaching.com",
      "x-forwarded-proto": "https",
      "user-agent": "vitest",
    })[name] ?? null,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/auth/login-rate-limit", () => ({
  checkLoginRateLimit: mocks.checkLoginRateLimit,
  clearLoginRateLimit: vi.fn(),
  recordFailedLogin: vi.fn(),
}));

vi.mock("@/lib/auth/member-workspace", () => ({
  resolveMemberAccessWorkspace: mocks.resolveMemberAccessWorkspace,
}));

vi.mock("@/lib/auth/session", () => ({
  clearAuthCookies: vi.fn(),
  setAuthCookies: vi.fn(),
}));

vi.mock("@/lib/repositories/security-management", () => ({
  acceptPendingTeamInvitationsForUser: vi.fn(),
  recordSecurityAuditEvent: mocks.recordSecurityAuditEvent,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicEnv: () => ({
    ok: true as const,
    url: "https://example.supabase.co",
    anonKey: "test-anon-key",
  }),
}));

import { requestMemberAccessLinkAction } from "./actions";

describe("requestMemberAccessLinkAction", () => {
  beforeEach(() => {
    mocks.checkLoginRateLimit.mockReset().mockResolvedValue({ allowed: true });
    mocks.recordSecurityAuditEvent.mockReset().mockResolvedValue(undefined);
    mocks.redirect.mockReset().mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
    mocks.resolveMemberAccessWorkspace.mockReset().mockResolvedValue({
      id: "83a83c28-7baa-48b5-9ca3-22634e030fd4",
    });
    mocks.signInWithOtp.mockReset().mockResolvedValue({
      data: { user: null, session: null },
      error: {
        code: "unexpected_failure",
        message: "Error sending magic link email",
        status: 500,
      },
    });
    mocks.createClient.mockReset().mockReturnValue({
      auth: { signInWithOtp: mocks.signInWithOtp },
    });
  });

  it("shows a technical error when the email provider rejects the magic link", async () => {
    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("w", "83a83c28-7baa-48b5-9ca3-22634e030fd4");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/acceso?error=No%20hemos%20podido%20enviar%20el%20enlace%20ahora.%20Int%C3%A9ntalo%20de%20nuevo%20en%20unos%20minutos.",
    );
  });
});
