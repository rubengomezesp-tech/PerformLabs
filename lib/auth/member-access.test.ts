import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceSupabaseClient: vi.fn(),
  getConsoleSession: vi.fn(),
  getVerifiedUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/auth/access-control", () => ({
  getConsoleSession: mocks.getConsoleSession,
  getVerifiedUser: mocks.getVerifiedUser,
}));

vi.mock("@/lib/auth/auth-mode", () => ({
  isConsoleAuthRequired: () => true,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseServiceEnv: () => ({
    ok: true as const,
    url: "https://example.supabase.co",
    serviceRoleKey: "test-service-role-key",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabaseClient: mocks.createServiceSupabaseClient,
}));

import { getMemberContext } from "./member-access";

const WORKSPACE_A = "11111111-1111-4111-8111-111111111111";
const WORKSPACE_B = "22222222-2222-4222-8222-222222222222";

type Profile = {
  id: string;
  workspace_id: string;
  full_name: string;
  subscription_status: "active" | "trialing";
};

function supabaseWithProfiles(profiles: Profile[]) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: profiles, error: null }),
        })),
      })),
    })),
  };
}

describe("getMemberContext tenant isolation", () => {
  beforeEach(() => {
    mocks.createServiceSupabaseClient.mockReset();
    mocks.getConsoleSession.mockReset().mockResolvedValue(null);
    mocks.getVerifiedUser.mockReset().mockResolvedValue({
      id: "user-b",
      email: "member-b@example.com",
    });
    process.env.COACHOS_OWNER_EMAIL = "owner@example.com";
  });

  it("does not fall back to member B when tenant/workspace A is explicit", async () => {
    const profileB: Profile = {
      id: "profile-b",
      workspace_id: WORKSPACE_B,
      full_name: "Member B",
      subscription_status: "active",
    };
    mocks.createServiceSupabaseClient.mockReturnValue(supabaseWithProfiles([profileB]));

    await expect(getMemberContext(WORKSPACE_A)).resolves.toBeNull();
    await expect(getMemberContext(WORKSPACE_B)).resolves.toMatchObject({
      workspaceId: WORKSPACE_B,
      memberProfileId: "profile-b",
      fullName: "Member B",
    });
  });

  it("keeps the first-profile fallback only when there is no explicit workspace", async () => {
    const profileB: Profile = {
      id: "profile-b",
      workspace_id: WORKSPACE_B,
      full_name: "Member B",
      subscription_status: "trialing",
    };
    mocks.createServiceSupabaseClient.mockReturnValue(supabaseWithProfiles([profileB]));

    await expect(getMemberContext()).resolves.toMatchObject({
      workspaceId: WORKSPACE_B,
      memberProfileId: "profile-b",
      membershipActive: true,
    });
  });

  it("selects the legitimate matching profile when the user belongs to several workspaces", async () => {
    const profiles: Profile[] = [
      {
        id: "profile-b",
        workspace_id: WORKSPACE_B,
        full_name: "Member B",
        subscription_status: "active",
      },
      {
        id: "profile-a",
        workspace_id: WORKSPACE_A,
        full_name: "Member A",
        subscription_status: "active",
      },
    ];
    mocks.createServiceSupabaseClient.mockReturnValue(supabaseWithProfiles(profiles));

    await expect(getMemberContext(WORKSPACE_A)).resolves.toMatchObject({
      workspaceId: WORKSPACE_A,
      memberProfileId: "profile-a",
      fullName: "Member A",
    });
  });
});
