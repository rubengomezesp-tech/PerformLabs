import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkLoginRateLimit: vi.fn(),
  consumeRateLimit: vi.fn(),
  createClient: vi.fn(),
  createServiceSupabaseClient: vi.fn(),
  generateLink: vi.fn(),
  headerValues: {
    "x-forwarded-for": "203.0.113.10",
    "x-forwarded-host": "miembros.rubengomezcoaching.com",
    "x-forwarded-proto": "https",
    "user-agent": "vitest",
  } as Record<string, string>,
  listUsers: vi.fn(),
  recordSecurityAuditEvent: vi.fn(),
  redirect: vi.fn(),
  resolveMemberAccessWorkspace: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => mocks.headerValues[name] ?? null,
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

vi.mock("@/lib/rate-limit/shared", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
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

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabaseClient: mocks.createServiceSupabaseClient,
}));

import { requestMemberAccessLinkAction } from "./actions";

describe("requestMemberAccessLinkAction", () => {
  beforeEach(() => {
    Object.assign(mocks.headerValues, {
      "x-forwarded-for": "203.0.113.10",
      "x-forwarded-host": "miembros.rubengomezcoaching.com",
      "x-forwarded-proto": "https",
      "user-agent": "vitest",
    });
    mocks.checkLoginRateLimit.mockReset().mockResolvedValue({ allowed: true });
    mocks.recordSecurityAuditEvent.mockReset().mockResolvedValue(undefined);
    mocks.redirect.mockReset().mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
    mocks.resolveMemberAccessWorkspace.mockReset().mockResolvedValue({
      id: "83a83c28-7baa-48b5-9ca3-22634e030fd4",
      name: "RG Coach",
      appName: "RG Coach",
      supportEmail: "soporte@rubengomezcoaching.com",
      accentColor: "#00c8ff",
      memberDomain: "miembros.rubengomezcoaching.com",
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
    mocks.generateLink.mockReset().mockImplementation(async (params: {
      options: { redirectTo: string };
    }) => {
      const actionLink = new URL("https://example.supabase.co/auth/v1/verify");
      actionLink.searchParams.set("token", "opaque");
      actionLink.searchParams.set("type", "magiclink");
      actionLink.searchParams.set("redirect_to", params.options.redirectTo);
      return {
        data: { properties: { action_link: actionLink.toString() } },
        error: null,
      };
    });
    mocks.createServiceSupabaseClient.mockReset().mockReturnValue({
      auth: {
        admin: {
          generateLink: mocks.generateLink,
          listUsers: mocks.listUsers,
        },
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "profile-rg", subscription_status: "active" },
                error: null,
              }),
            })),
          })),
        })),
      })),
    });
    mocks.consumeRateLimit.mockReset().mockResolvedValue(true);
    mocks.listUsers.mockReset().mockResolvedValue({
      data: {
        users: [{ id: "user-rg", email: "member@example.com" }],
      },
      error: null,
    });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID;
    delete process.env.RG_COACH_RESEND_API_KEY;
    delete process.env.RG_COACH_RESEND_FROM;
  });

  it("shows a technical error when the email provider rejects the magic link", async () => {
    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("w", "83a83c28-7baa-48b5-9ca3-22634e030fd4");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/acceso?error=No%20hemos%20podido%20enviar%20el%20enlace%20ahora.%20Int%C3%A9ntalo%20de%20nuevo%20en%20unos%20minutos.",
    );
  });

  it("uses RG Coach's own provider instead of the global SMTP transport", async () => {
    process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";
    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    process.env.RG_COACH_RESEND_FROM = "RG Coach <acceso@auth.rubengomezcoaching.com>";
    mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("w", "83a83c28-7baa-48b5-9ca3-22634e030fd4");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/acceso?success=Si%20tu%20email%20tiene%20acceso%2C%20te%20hemos%20enviado%20un%20enlace%20para%20entrar.%20Revisa%20tu%20correo.",
    );

    expect(mocks.generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "member@example.com",
      options: {
        redirectTo: "https://miembros.rubengomezcoaching.com/auth/callback",
      },
    });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("uses the workspace member domain as the HTTPS callback instead of the request host", async () => {
    process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";
    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    process.env.RG_COACH_RESEND_FROM = "RG Coach <acceso@auth.rubengomezcoaching.com>";
    mocks.resolveMemberAccessWorkspace.mockResolvedValue({
      id: "83a83c28-7baa-48b5-9ca3-22634e030fd4",
      name: "RG Coach",
      appName: "RG Coach",
      supportEmail: "soporte@rubengomezcoaching.com",
      accentColor: "#00c8ff",
      memberDomain: "clientes.rubengomezcoaching.com",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const formData = new FormData();
    formData.set("email", "member@example.com");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow("NEXT_REDIRECT:/acceso?success=");

    expect(mocks.generateLink).toHaveBeenCalledWith(expect.objectContaining({
      options: {
        redirectTo: "https://clientes.rubengomezcoaching.com/auth/callback",
      },
    }));
  });

  it("consumes the workspace-scoped member-link limit even for an unknown email", async () => {
    process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";
    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    process.env.RG_COACH_RESEND_FROM = "RG Coach <acceso@auth.rubengomezcoaching.com>";
    mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null });

    const formData = new FormData();
    formData.set("email", "unknown@example.com");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow("NEXT_REDIRECT:/acceso?success=");

    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(
        /^member_link:83a83c28-7baa-48b5-9ca3-22634e030fd4:[a-f0-9]{64}:[a-f0-9]{64}$/,
      ),
      { windowMs: 900_000, max: 5 },
    );
    expect(mocks.generateLink).not.toHaveBeenCalled();
  });

  it("returns the same generic response when the member-link bucket is exhausted", async () => {
    process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";
    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    process.env.RG_COACH_RESEND_FROM = "RG Coach <acceso@auth.rubengomezcoaching.com>";
    mocks.consumeRateLimit.mockResolvedValue(false);

    const formData = new FormData();
    formData.set("email", "member@example.com");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/acceso?success=Si%20tu%20email%20tiene%20acceso%2C%20te%20hemos%20enviado%20un%20enlace%20para%20entrar.%20Revisa%20tu%20correo.",
    );

    expect(mocks.generateLink).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("rejects an invalid fallback Host when a non-production workspace has no member domain", async () => {
    mocks.headerValues["x-forwarded-host"] = "local..invalid";
    mocks.headerValues["x-forwarded-proto"] = "http";
    mocks.resolveMemberAccessWorkspace.mockResolvedValue({
      id: "83a83c28-7baa-48b5-9ca3-22634e030fd4",
      name: "RG Coach",
      appName: "RG Coach",
      supportEmail: "soporte@rubengomezcoaching.com",
      accentColor: "#00c8ff",
      memberDomain: "",
    });

    const formData = new FormData();
    formData.set("email", "member@example.com");

    await expect(requestMemberAccessLinkAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/acceso?success=Si%20tu%20email%20tiene%20acceso%2C%20te%20hemos%20enviado%20un%20enlace%20para%20entrar.%20Revisa%20tu%20correo.",
    );

    expect(mocks.generateLink).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });
});
