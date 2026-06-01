import { describe, expect, it } from "vitest";
import { normalizeWorkspaceReference } from "./workspaces";

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
