import { describe, expect, it } from "vitest";
import { publicCoachContactSchema } from "@/lib/lead-capture/public-coach-contact";

const validContact = {
  slug: "rg-coach",
  kind: "coaching" as const,
  fullName: "Test Client",
  email: "CLIENT@EXAMPLE.COM",
  message: "Quiero ganar fuerza.",
  website: "",
  submissionId: "b83a0058-ed49-4a2e-8188-4cbb40cf1293",
};

describe("public coach contact validation", () => {
  it("normalizes a bounded valid submission", () => {
    const parsed = publicCoachContactSchema.parse(validContact);
    expect(parsed.email).toBe("client@example.com");
    expect(parsed.slug).toBe("rg-coach");
  });

  it("accepts the bot trap so the action can discard it indistinguishably", () => {
    expect(publicCoachContactSchema.safeParse({ ...validContact, website: "spam.example" }).success).toBe(true);
  });

  it.each([
    { field: "slug", value: "../other" },
    { field: "fullName", value: "Bad\nName" },
    { field: "email", value: "not-an-email" },
    { field: "message", value: "x".repeat(2_001) },
    { field: "submissionId", value: "not-a-uuid" },
  ])("rejects invalid $field input", ({ field, value }) => {
    expect(publicCoachContactSchema.safeParse({ ...validContact, [field]: value }).success).toBe(false);
  });
});
