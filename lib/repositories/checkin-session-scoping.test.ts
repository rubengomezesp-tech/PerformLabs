import { beforeEach, describe, expect, it, vi } from "vitest";

// Regresión H5 (plan aula de clientes): en un workspace con VARIOS miembros, el
// check-in debe caer en el perfil de la SESIÓN autenticada, jamás en "el primer
// perfil del workspace". Se mockea el contexto de sesión y se captura el insert.

const getMemberContextMock = vi.fn();
vi.mock("@/lib/auth/member-access", () => ({
  getMemberContext: (...args: unknown[]) => getMemberContextMock(...args),
}));

const insertedRows: Array<Record<string, unknown>> = [];
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabaseClient: () => ({
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        if (table === "customer_checkins") insertedRows.push(row);
        return {
          select: () => ({
            single: async () => ({ data: { id: "checkin-nuevo" }, error: null }),
          }),
        };
      },
    }),
    storage: { from: () => ({ upload: async () => ({ error: null }) }) },
  }),
}));

import { createMemberCheckin, parseCheckinPhotoAngle } from "./checkin-management";

function baseInput(workspaceId: string) {
  return {
    workspaceId,
    weightKg: "80",
    bodyFatPercent: "",
    waistCm: "",
    chestCm: "",
    hipCm: "",
    energy: "normal",
    sleepQuality: "correcto",
    digestion: "normal",
    trainingAdherence: "85",
    nutritionAdherence: "90",
    notes: "",
    photosAvailable: false,
  };
}

describe("createMemberCheckin — scoping por sesión (regresión H5)", () => {
  beforeEach(() => {
    insertedRows.length = 0;
    getMemberContextMock.mockReset();
  });

  it("dos miembros del mismo workspace: cada check-in cae en SU perfil de sesión", async () => {
    getMemberContextMock.mockResolvedValueOnce({ workspaceId: "ws-1", memberProfileId: "miembro-A" });
    const first = await createMemberCheckin(baseInput("ws-1"));
    getMemberContextMock.mockResolvedValueOnce({ workspaceId: "ws-1", memberProfileId: "miembro-B" });
    const second = await createMemberCheckin(baseInput("ws-1"));

    expect(first.memberProfileId).toBe("miembro-A");
    expect(second.memberProfileId).toBe("miembro-B");
    expect(insertedRows[0].member_profile_id).toBe("miembro-A");
    expect(insertedRows[1].member_profile_id).toBe("miembro-B");
  });

  it("contexto de otro workspace: rechaza (guard cross-tenant)", async () => {
    getMemberContextMock.mockResolvedValueOnce({ workspaceId: "ws-OTRO", memberProfileId: "miembro-X" });
    await expect(createMemberCheckin(baseInput("ws-1"))).rejects.toThrow();
    expect(insertedRows).toHaveLength(0);
  });

  it("sin sesión: rechaza en vez de adivinar un perfil", async () => {
    getMemberContextMock.mockResolvedValueOnce(null);
    await expect(createMemberCheckin(baseInput("ws-1"))).rejects.toThrow();
    expect(insertedRows).toHaveLength(0);
  });
});

describe("parseCheckinPhotoAngle — ángulo codificado en el filename", () => {
  it("extrae el ángulo de rutas nuevas", () => {
    expect(parseCheckinPhotoAngle("ws/m/1753290000-frontal-0.jpg")).toBe("frontal");
    expect(parseCheckinPhotoAngle("ws/m/1753290000-lateral-1.png")).toBe("lateral");
    expect(parseCheckinPhotoAngle("ws/m/1753290000-espalda-2.webp")).toBe("espalda");
  });

  it("fotos legacy sin etiqueta devuelven null (fallback del comparador)", () => {
    expect(parseCheckinPhotoAngle("ws/m/1750000000-0.jpg")).toBeNull();
  });
});
