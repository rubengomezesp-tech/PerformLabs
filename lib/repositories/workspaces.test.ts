import { describe, expect, it } from "vitest";
import {
  findWorkspaceDomainCollision,
  normalizeWorkspaceReference,
  resolveWorkspaceDomains,
  workspaceDomainWriteError,
} from "./workspaces";

describe("normalizeWorkspaceReference", () => {
  it("normalises valid slugs and domains (strips protocol/www/port, lowercases)", () => {
    expect(normalizeWorkspaceReference("rubengomez")).toBe("rubengomez");
    expect(normalizeWorkspaceReference("Coach.Example.COM")).toBe("coach.example.com");
    expect(normalizeWorkspaceReference("https://www.coach.example.com/")).toBe("coach.example.com");
    expect(normalizeWorkspaceReference("coach.example.com:3000")).toBe("coach.example.com");
    expect(normalizeWorkspaceReference("00000000-0000-0000-0000-000000000000")).toBe(
      "00000000-0000-0000-0000-000000000000",
    );
  });

  it("treats localhost and empty input as 'no reference'", () => {
    expect(normalizeWorkspaceReference("localhost")).toBe("");
    expect(normalizeWorkspaceReference("127.0.0.1")).toBe("");
    expect(normalizeWorkspaceReference("")).toBe("");
    expect(normalizeWorkspaceReference(null)).toBe("");
    expect(normalizeWorkspaceReference(undefined)).toBe("");
  });

  // Commas and parentheses are PostgREST .or() syntax. A crafted Host header or
  // workspace cookie must not be able to inject extra OR conditions — anything
  // outside the slug/domain/uuid charset resolves to "" (default brand).
  it("rejects PostgREST .or() injection attempts", () => {
    expect(normalizeWorkspaceReference("x,id.eq.00000000-0000-0000-0000-000000000000")).toBe("");
    expect(normalizeWorkspaceReference("a,b")).toBe("");
    expect(normalizeWorkspaceReference("slug,public_domain.eq.evil.com")).toBe("");
    expect(normalizeWorkspaceReference("or(id.eq.x)")).toBe("");
    expect(normalizeWorkspaceReference("a b")).toBe("");
    expect(normalizeWorkspaceReference("a'b")).toBe("");
  });
});

describe("resolveWorkspaceDomains", () => {
  it("mantiene la web pública y usa un host separado para la app", () => {
    expect(resolveWorkspaceDomains("https://www.rubengomezcoaching.com/", "MIEMBROS.RubenGomezCoaching.com")).toEqual({
      publicDomain: "rubengomezcoaching.com",
      memberDomain: "miembros.rubengomezcoaching.com",
    });
  });

  it("deriva un subdominio de miembros si no se proporciona uno", () => {
    expect(resolveWorkspaceDomains("rubengomezcoaching.com", "")).toEqual({
      publicDomain: "rubengomezcoaching.com",
      memberDomain: "miembros.rubengomezcoaching.com",
    });
  });

  it("impide registrar la propia web pública como app", () => {
    expect(() => resolveWorkspaceDomains("rubengomezcoaching.com", "rubengomezcoaching.com")).toThrow(
      "subdominio distinto",
    );
  });
});

describe("workspace domain registry", () => {
  const rows = [
    { workspace_id: "workspace-a", domain: "rubengomezcoaching.com" },
    { workspace_id: "workspace-b", domain: "app.othercoach.com" },
  ];

  it("detecta una colisión aunque el host tenga otro rol en el workspace existente", () => {
    expect(findWorkspaceDomainCollision(["APP.OTHERCOACH.COM"], rows, "workspace-a"))
      .toBe("app.othercoach.com");
  });

  it("permite conservar dominios ya reclamados por el mismo workspace", () => {
    expect(findWorkspaceDomainCollision(["rubengomezcoaching.com"], rows, "workspace-a")).toBeNull();
  });

  it("convierte la carrera de unicidad de Postgres en un mensaje accionable", () => {
    expect(workspaceDomainWriteError(
      { code: "23505", message: "Workspace domain is already assigned to another workspace" },
      "No se pudo guardar",
    ).message).toContain("ya está asignado a otra marca");
  });
});
