import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceSupabaseClient: vi.fn(),
  fetch: vi.fn(),
  generateLink: vi.fn(),
  listUsers: vi.fn(),
  membershipMaybeSingle: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabaseClient: mocks.createServiceSupabaseClient,
}));

import { sendTenantMagicLinkIfConfigured } from "./tenant-magic-link";

const RG_WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";
const workspace = {
  id: RG_WORKSPACE_ID,
  name: "RG Coach",
  appName: "RG Coach",
  supportEmail: "soporte@rubengomezcoaching.com",
  domain: "rubengomezcoaching.com",
  publicDomain: "rubengomezcoaching.com",
  memberDomain: "miembros.rubengomezcoaching.com",
  fallbackSubdomain: "rg-coach.performlabs.app",
  accentColor: "#00c8ff",
  isActive: true,
};

function serviceClient() {
  mocks.select.mockImplementation(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: mocks.membershipMaybeSingle,
      })),
    })),
  }));
  return {
    auth: {
      admin: {
        listUsers: mocks.listUsers,
        generateLink: mocks.generateLink,
      },
    },
    from: vi.fn(() => ({
      select: mocks.select,
    })),
  };
}

describe("sendTenantMagicLinkIfConfigured", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID = RG_WORKSPACE_ID;
    process.env.RG_COACH_RESEND_API_KEY = "test-rg-resend-key";
    process.env.RG_COACH_RESEND_FROM = "Rubén · RG Coach <acceso@auth.rubengomezcoaching.com>";
    mocks.listUsers.mockReset().mockResolvedValue({
      data: { users: [{ id: "user-rg", email: "member@example.com" }] },
      error: null,
    });
    mocks.membershipMaybeSingle.mockReset().mockResolvedValue({
      data: { id: "profile-rg", subscription_status: "active" },
      error: null,
    });
    mocks.select.mockReset();
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
    mocks.createServiceSupabaseClient.mockReset().mockReturnValue(serviceClient());
    mocks.fetch.mockReset().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("does not touch RG credentials for another tenant", async () => {
    await expect(sendTenantMagicLinkIfConfigured({
      workspace: { ...workspace, id: "11111111-1111-4111-8111-111111111111" },
      email: "member@example.com",
      callbackUrl: "https://other.example.com/auth/callback",
    })).resolves.toEqual({ handled: false });

    expect(mocks.createServiceSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("suppresses unknown emails without creating a user or calling Resend", async () => {
    mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null });

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "unknown@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toEqual({ handled: true, status: "suppressed" });

    expect(mocks.generateLink).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("suppresses users that do not have a profile in the RG workspace", async () => {
    mocks.membershipMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toEqual({ handled: true, status: "suppressed" });

    expect(mocks.generateLink).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("suppresses members whose RG subscription is not active or trialing", async () => {
    mocks.membershipMaybeSingle.mockResolvedValue({
      data: { id: "profile-rg", subscription_status: "paused" },
      error: null,
    });

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toEqual({ handled: true, status: "suppressed" });

    expect(mocks.generateLink).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects a generated action link from an unexpected origin", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    mocks.generateLink.mockResolvedValue({
      data: {
        properties: {
          action_link: "https://attacker.example/auth/v1/verify?type=magiclink&redirect_to=https%3A%2F%2Fmiembros.rubengomezcoaching.com%2Fauth%2Fcallback",
        },
      },
      error: null,
    });

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toMatchObject({
      handled: true,
      status: "failed",
      failure: { stage: "link", code: "invalid_action_link" },
    });

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects a generated action link whose redirect does not exactly match the callback", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    mocks.generateLink.mockResolvedValue({
      data: {
        properties: {
          action_link: "https://example.supabase.co/auth/v1/verify?type=magiclink&redirect_to=https%3A%2F%2Fevil.example%2Fauth%2Fcallback",
        },
      },
      error: null,
    });

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toMatchObject({
      handled: true,
      status: "failed",
      failure: { stage: "link", code: "invalid_action_link" },
    });

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("sends a tenant-branded message through the isolated Resend API", async () => {
    await expect(sendTenantMagicLinkIfConfigured({
      workspace: { ...workspace, appName: "RG <Coach>\r\nAuthentic" },
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toEqual({ handled: true, status: "sent" });

    expect(mocks.fetch).toHaveBeenCalledOnce();
    const [url, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-rg-resend-key",
      "User-Agent": "rg-coach-member-auth/1.0",
    });
    expect(body).toMatchObject({
      from: "Rubén · RG Coach <acceso@auth.rubengomezcoaching.com>",
      to: ["member@example.com"],
      reply_to: "soporte@rubengomezcoaching.com",
      subject: "Tu acceso a RG <Coach> Authentic",
    });
    const html = String(body.html);
    const text = String(body.text);
    expect(html).toContain("RG &lt;Coach&gt;");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("ACCESO PRIVADO");
    expect(html).toContain("Tu espacio<br>está listo.");
    expect(html).toContain("ABRIR MI APP RG");
    expect(html).toContain("UN MENSAJE DE RUBÉN");
    expect(html).toContain("ENTRENAMIENTO");
    expect(html).toContain("NUTRICIÓN");
    expect(html).toContain("PROGRESO");
    expect(html).toContain("#2f6bff");
    expect(html).toContain("#00d4ff");
    expect(html).toContain("soporte@rubengomezcoaching.com");
    expect(html.match(/<img\b/g)).toHaveLength(2);
    expect(html).toContain('src="https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-lockup-horizontal-white-1024.png"');
    expect(html).toContain('src="https://miembros.rubengomezcoaching.com/brand/rg-coach/ruben-gomez-signature-white-512.png"');
    expect(html).toContain("https://example.supabase.co/auth/v1/verify?");
    expect(html).toContain("token=opaque&amp;type=magiclink&amp;redirect_to=");
    expect(html.length).toBeLessThan(25_000);
    expect(html).not.toMatch(/<(?:script|form|iframe|svg)\b/i);
    expect(html).not.toMatch(/@import|url\(https?:/i);
    expect(html).not.toContain("PerformLabs");
    expect(html).not.toContain("FitControl");
    expect(text).toContain("Tu espacio está listo.");
    expect(text).toContain("https://example.supabase.co/auth/v1/verify?token=opaque&type=magiclink&redirect_to=");
    expect(text).toContain("Rubén Gómez · Tu coach");
    expect(mocks.select).toHaveBeenCalledWith("id,subscription_status");
  });

  it.each([
    ["wrong path", "https://example.supabase.co/auth/v1/token?type=magiclink&redirect_to=https%3A%2F%2Fmiembros.rubengomezcoaching.com%2Fauth%2Fcallback"],
    ["wrong type", "https://example.supabase.co/auth/v1/verify?type=recovery&redirect_to=https%3A%2F%2Fmiembros.rubengomezcoaching.com%2Fauth%2Fcallback"],
  ])("rejects a generated action link with %s", async (_label, actionLink) => {
    mocks.generateLink.mockResolvedValue({
      data: { properties: { action_link: actionLink } },
      error: null,
    });

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toMatchObject({
      handled: true,
      status: "failed",
      failure: { stage: "link", code: "invalid_action_link" },
    });

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("fails closed when RG is targeted but its secret configuration is incomplete", async () => {
    delete process.env.RG_COACH_RESEND_API_KEY;

    await expect(sendTenantMagicLinkIfConfigured({
      workspace,
      email: "member@example.com",
      callbackUrl: "https://miembros.rubengomezcoaching.com/auth/callback",
    })).resolves.toMatchObject({
      handled: true,
      status: "failed",
      failure: { stage: "configuration" },
    });

    expect(mocks.createServiceSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
