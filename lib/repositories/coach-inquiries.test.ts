import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceSupabaseClient: vi.fn(),
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

import {
  createCoachInquiry,
  findCoachInquirySubmission,
  listCoachInquiries,
  updateCoachInquiry,
  type CoachInquiryInput,
} from "./coach-inquiries";
import {
  publicCoachInquirySchema,
  structuredCoachInquiryMessage,
} from "@/lib/lead-capture/coach-inquiry";

const WORKSPACE_ID = "83a83c28-7baa-48b5-9ca3-22634e030fd4";
const OTHER_WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const INQUIRY_ID = "22222222-2222-4222-8222-222222222222";
const SUBMISSION_ID = "rg-1783932000000-a1b2c3d4";

const answers = {
  goal: "recomp",
  place: "gym",
  area: "Brickell",
  sessions: "3",
  schedule: "morning",
  level: "middle",
  obstacle: "consistency",
} as const;

const attribution = {
  utmSource: "instagram",
  utmMedium: "social",
  utmCampaign: "miami-summer",
  utmContent: "reel-01",
  utmTerm: "coach-miami",
  landingPath: "/diagnostico",
  referrerHost: "instagram.com",
} as const;

function createInput(overrides: Partial<CoachInquiryInput> = {}): CoachInquiryInput {
  return {
    workspaceId: WORKSPACE_ID,
    fullName: "  María Gómez  ",
    email: "  MARIA@example.com  ",
    phone: "+1 305 555 0199",
    message: "RG_DIAGNOSTIC_V1\nfull diagnostic",
    kind: "diagnostic",
    preferredContact: "whatsapp",
    locale: "es",
    answers,
    attribution,
    submissionId: SUBMISSION_ID,
    elapsedMs: 18_450,
    contactConsentAt: "2026-07-13T04:00:00.000Z",
    priority: "high",
    ...overrides,
  };
}

function publicInquiryMessage() {
  return structuredCoachInquiryMessage(publicCoachInquirySchema.parse({
    slug: "rg-coach",
    submissionId: SUBMISSION_ID,
    fullName: "María Gómez",
    email: "maria@example.com",
    phone: "",
    website: "",
    consent: true,
    locale: "es",
    elapsedMs: 18_450,
    answers,
    attribution,
  }));
}

function useClient(client: unknown) {
  mocks.createServiceSupabaseClient.mockReturnValue(client as never);
}

function lookupBuilder(...responses: Array<{ data: { id: string } | null; error: null }>) {
  const maybeSingle = vi.fn();
  for (const response of responses) maybeSingle.mockResolvedValueOnce(response);
  if (!responses.length) maybeSingle.mockResolvedValue({ data: null, error: null });
  const chain: {
    eq: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  } = {} as never;
  chain.eq = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.limit = vi.fn(() => ({ maybeSingle }));
  return { select: vi.fn(() => chain), chain, maybeSingle };
}

describe("createCoachInquiry", () => {
  beforeEach(() => {
    mocks.createServiceSupabaseClient.mockReset();
  });

  it("writes the complete extended CRM payload with normalized identity and attribution", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: INQUIRY_ID }, error: null });
    const insertSelect = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    const lookup = lookupBuilder({ data: null, error: null });
    const from = vi.fn(() => ({ insert, select: lookup.select }));
    useClient({ from });

    await expect(createCoachInquiry(createInput())).resolves.toEqual({
      id: INQUIRY_ID,
      duplicate: false,
      legacySchema: false,
    });

    expect(from).toHaveBeenCalledWith("coach_inquiries");
    expect(insert).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: WORKSPACE_ID,
      full_name: "María Gómez",
      email: "maria@example.com",
      phone: "+1 305 555 0199",
      kind: "diagnostic",
      preferred_contact: "whatsapp",
      locale: "es",
      goal: "recomp",
      service_mode: "gym",
      zone: "brickell",
      sessions_per_week: 3,
      schedule: "morning",
      training_level: "middle",
      obstacle: "consistency",
      answers,
      status: "new",
      priority: "high",
      source: "instagram",
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "miami-summer",
      utm_content: "reel-01",
      utm_term: "coach-miami",
      landing_path: "/diagnostico",
      referrer_host: "instagram.com",
      submission_id: SUBMISSION_ID,
      elapsed_ms: 18_450,
      contact_consent_at: "2026-07-13T04:00:00.000Z",
      consent_version: null,
      updated_at: expect.any(String),
    }));
    expect(insertSelect).toHaveBeenCalledWith("id");
  });

  it("resolves a durable marker duplicate before inserting again", async () => {
    const insert = vi.fn();
    const lookup = lookupBuilder({ data: { id: INQUIRY_ID }, error: null });
    useClient({ from: vi.fn(() => ({ insert, select: lookup.select })) });

    await expect(createCoachInquiry(createInput())).resolves.toEqual({
      id: INQUIRY_ID,
      duplicate: true,
      legacySchema: false,
    });

    expect(insert).not.toHaveBeenCalled();
    expect(lookup.chain.eq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(lookup.chain.eq).toHaveBeenCalledWith("email", "maria@example.com");
    expect(lookup.chain.ilike).toHaveBeenCalledWith("message", `%RG_SUBMISSION_ID: ${SUBMISSION_ID}%`);
    expect(lookup.chain.limit).toHaveBeenCalledWith(1);
  });

  it("resolves a concurrent duplicate through the unique submission index", async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "duplicate key violates unique constraint" },
        }),
      })),
    }));
    const lookup = lookupBuilder(
      { data: null, error: null },
      { data: { id: INQUIRY_ID }, error: null },
    );
    useClient({ from: vi.fn(() => ({ insert, select: lookup.select })) });

    await expect(createCoachInquiry(createInput())).resolves.toEqual({
      id: INQUIRY_ID,
      duplicate: true,
      legacySchema: false,
    });
    expect(insert).toHaveBeenCalledOnce();
    expect(lookup.chain.eq).toHaveBeenCalledWith("submission_id", SUBMISSION_ID);
  });

  it("uses the six-column legacy insert only for a schema compatibility error", async () => {
    const insert = vi.fn()
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST204", message: "column not found in schema cache" },
          }),
        })),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: INQUIRY_ID }, error: null }),
        })),
      }));
    useClient({ from: vi.fn(() => ({ insert })) });

    await expect(createCoachInquiry(createInput({ submissionId: undefined }))).resolves.toEqual({
      id: INQUIRY_ID,
      duplicate: false,
      legacySchema: true,
    });

    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[1]?.[0]).toEqual({
      workspace_id: WORKSPACE_ID,
      full_name: "María Gómez",
      email: "maria@example.com",
      message: "RG_DIAGNOSTIC_V1\nfull diagnostic",
      kind: "diagnostic",
    });
  });

  it("does not hide an operational insert error behind a legacy fallback", async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "42501", message: "permission denied" },
        }),
      })),
    }));
    const lookup = lookupBuilder({ data: null, error: null });
    useClient({ from: vi.fn(() => ({ insert, select: lookup.select })) });

    await expect(createCoachInquiry(createInput())).rejects.toThrow(
      "No se pudo enviar tu mensaje: permission denied",
    );
    expect(insert).toHaveBeenCalledOnce();
  });
});

describe("findCoachInquirySubmission", () => {
  beforeEach(() => {
    mocks.createServiceSupabaseClient.mockReset();
  });

  it("finds generic public-form submissions through the CRM column", async () => {
    const lookup = lookupBuilder({ data: { id: INQUIRY_ID }, error: null });
    useClient({ from: vi.fn(() => ({ select: lookup.select })) });

    await expect(findCoachInquirySubmission(
      WORKSPACE_ID,
      "maria@example.com",
      SUBMISSION_ID,
    )).resolves.toBe(INQUIRY_ID);

    expect(lookup.chain.eq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(lookup.chain.eq).toHaveBeenCalledWith("submission_id", SUBMISSION_ID);
    expect(lookup.chain.ilike).not.toHaveBeenCalled();
  });

  it("falls back to the durable diagnostic marker during schema rollout", async () => {
    const lookup = lookupBuilder(
      { data: null, error: null },
      { data: { id: INQUIRY_ID }, error: null },
    );
    useClient({ from: vi.fn(() => ({ select: lookup.select })) });

    await expect(findCoachInquirySubmission(
      WORKSPACE_ID,
      "MARIA@example.com",
      SUBMISSION_ID,
    )).resolves.toBe(INQUIRY_ID);

    expect(lookup.chain.eq).toHaveBeenCalledWith("email", "maria@example.com");
    expect(lookup.chain.ilike).toHaveBeenCalledWith("message", `%RG_SUBMISSION_ID: ${SUBMISSION_ID}%`);
  });
});

describe("listCoachInquiries", () => {
  beforeEach(() => {
    mocks.createServiceSupabaseClient.mockReset();
  });

  it("filters the extended query by workspace_id and maps CRM fields", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{
        id: INQUIRY_ID,
        workspace_id: WORKSPACE_ID,
        full_name: "María Gómez",
        email: "maria@example.com",
        phone: "+13055550199",
        message: "Quiero una valoración.",
        kind: "diagnostic",
        preferred_contact: "whatsapp",
        locale: "es",
        answers,
        status: "qualified",
        priority: "high",
        qualification_notes: "Lista para comenzar",
        next_action_at: "2026-07-15T16:00:00.000Z",
        contacted_at: "2026-07-13T05:00:00.000Z",
        source: "instagram",
        utm_source: "instagram",
        utm_medium: "social",
        utm_campaign: "miami-summer",
        utm_content: "reel-01",
        utm_term: "coach-miami",
        landing_path: "/diagnostico",
        referrer_host: "instagram.com",
        submission_id: SUBMISSION_ID,
        created_at: "2026-07-13T04:00:00.000Z",
        updated_at: "2026-07-13T05:00:00.000Z",
      }],
      error: null,
    });
    const order = vi.fn(() => ({ limit }));
    const workspaceEq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq: workspaceEq }));
    const from = vi.fn(() => ({ select }));
    useClient({ from });

    const result = await listCoachInquiries(WORKSPACE_ID, 999);

    expect(workspaceEq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(200);
    expect(result).toEqual([expect.objectContaining({
      id: INQUIRY_ID,
      workspaceId: WORKSPACE_ID,
      fullName: "María Gómez",
      phone: "+13055550199",
      answers,
      attribution,
      status: "qualified",
      priority: "high",
      qualificationNotes: "Lista para comenzar",
      source: "instagram",
      submissionId: SUBMISSION_ID,
    })]);
  });

  it("falls back on a missing-column error, scopes the legacy query, and restores structured fields", async () => {
    const extendedLimit = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42703", message: "column phone does not exist" },
    });
    const legacyLimit = vi.fn().mockResolvedValue({
      data: [{
        id: INQUIRY_ID,
        workspace_id: WORKSPACE_ID,
        full_name: "María Gómez",
        email: "maria@example.com",
        message: publicInquiryMessage(),
        kind: "diagnostic",
        created_at: "2026-07-13T04:00:00.000Z",
      }],
      error: null,
    });
    const extendedEq = vi.fn(() => ({
      order: vi.fn(() => ({ limit: extendedLimit })),
    }));
    const legacyEq = vi.fn(() => ({
      order: vi.fn(() => ({ limit: legacyLimit })),
    }));
    const select = vi.fn((columns: string) => ({
      eq: columns.includes("preferred_contact") ? extendedEq : legacyEq,
    }));
    useClient({ from: vi.fn(() => ({ select })) });

    const result = await listCoachInquiries(WORKSPACE_ID, 25);

    expect(extendedEq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(legacyEq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(result).toEqual([expect.objectContaining({
      id: INQUIRY_ID,
      workspaceId: WORKSPACE_ID,
      message: "",
      locale: "es",
      answers,
      attribution,
      status: "new",
      priority: "normal",
      source: "instagram",
      submissionId: SUBMISSION_ID,
    })]);
  });

  it("does not run the legacy query for an operational read error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const limit = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });
    const workspaceEq = vi.fn(() => ({ order: vi.fn(() => ({ limit })) }));
    const select = vi.fn(() => ({ eq: workspaceEq }));
    useClient({ from: vi.fn(() => ({ select })) });

    await expect(listCoachInquiries(WORKSPACE_ID)).resolves.toEqual([]);

    expect(select).toHaveBeenCalledOnce();
    expect(workspaceEq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(consoleError).toHaveBeenCalledWith("Unable to load coach inquiries", "permission denied");
    consoleError.mockRestore();
  });

  it("never creates a workspace-wide query for an empty or zero workspace id", async () => {
    await expect(listCoachInquiries("")).resolves.toEqual([]);
    await expect(listCoachInquiries("00000000-0000-0000-0000-000000000000")).resolves.toEqual([]);
    expect(mocks.createServiceSupabaseClient).not.toHaveBeenCalled();
  });
});

describe("updateCoachInquiry", () => {
  beforeEach(() => {
    mocks.createServiceSupabaseClient.mockReset();
  });

  it("requires both workspace_id and inquiry id before updating the CRM fields", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: INQUIRY_ID }, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const firstIdEq = vi.fn(() => ({ select }));
    const firstWorkspaceEq = vi.fn(() => ({ eq: firstIdEq }));
    const firstContactIs = vi.fn().mockResolvedValue({ data: null, error: null });
    const secondIdEq = vi.fn(() => ({ is: firstContactIs }));
    const secondWorkspaceEq = vi.fn(() => ({ eq: secondIdEq }));
    const update = vi.fn()
      .mockImplementationOnce(() => ({ eq: firstWorkspaceEq }))
      .mockImplementationOnce(() => ({ eq: secondWorkspaceEq }));
    const from = vi.fn(() => ({ update }));
    useClient({ from });

    await expect(updateCoachInquiry({
      workspaceId: WORKSPACE_ID,
      inquiryId: INQUIRY_ID,
      status: "contacted",
      priority: "high",
      nextActionAt: "2026-07-15T16:00:00.000Z",
      qualificationNotes: " Llamar mañana ",
    })).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledWith("coach_inquiries");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      status: "contacted",
      priority: "high",
      next_action_at: "2026-07-15T16:00:00.000Z",
      qualification_notes: "Llamar mañana",
      updated_at: expect.any(String),
    }));
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty("contacted_at");
    expect(update.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ contacted_at: expect.any(String) }));
    expect(firstWorkspaceEq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(firstIdEq).toHaveBeenCalledWith("id", INQUIRY_ID);
    expect(secondWorkspaceEq).toHaveBeenCalledWith("workspace_id", WORKSPACE_ID);
    expect(secondIdEq).toHaveBeenCalledWith("id", INQUIRY_ID);
    expect(firstContactIs).toHaveBeenCalledWith("contacted_at", null);
    expect(select).toHaveBeenCalledWith("id");
  });

  it("does not mutate anything when the workspace id is missing", async () => {
    await expect(updateCoachInquiry({
      workspaceId: "",
      inquiryId: INQUIRY_ID,
      status: "new",
      priority: "normal",
    })).rejects.toThrow("Falta la consulta.");
    expect(mocks.createServiceSupabaseClient).not.toHaveBeenCalled();
  });
});
