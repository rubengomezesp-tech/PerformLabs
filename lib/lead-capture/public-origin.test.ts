import { describe, expect, it } from "vitest";
import { coachInquiryCorsHeaders, isAllowedCoachInquiryOrigin } from "./public-origin";

describe("isAllowedCoachInquiryOrigin", () => {
  it.each([
    "https://rubengomezcoaching.com",
    "https://www.rubengomezcoaching.com",
  ])("allows the canonical production origin %s", (origin) => {
    expect(isAllowedCoachInquiryOrigin(origin, "production")).toBe(true);
  });

  it.each([
    "http://localhost:3000",
    "https://localhost:4174",
    "http://127.0.0.1:5173",
    "http://[::1]:4174",
  ])("allows local development origin %s outside production", (origin) => {
    expect(isAllowedCoachInquiryOrigin(origin, "development")).toBe(true);
    expect(isAllowedCoachInquiryOrigin(origin, "production")).toBe(false);
  });

  it.each([
    null,
    "not-a-url",
    "http://rubengomezcoaching.com",
    "https://rubengomezcoaching.com:444",
    "https://rubengomezcoaching.com/form",
    "https://rubengomezcoaching.com.evil.example",
    "https://evil-rubengomezcoaching.com",
    "https://rubengomezcoaching.com@evil.example",
    "javascript://rubengomezcoaching.com",
    "https://localhost.evil.example",
  ])("rejects untrusted or malformed origin %s", (origin) => {
    expect(isAllowedCoachInquiryOrigin(origin, "production")).toBe(false);
  });
});

describe("coachInquiryCorsHeaders", () => {
  it("reflects only the already-approved origin and locks the public contract to JSON POST", () => {
    expect(coachInquiryCorsHeaders("https://rubengomezcoaching.com")).toEqual({
      "Access-Control-Allow-Origin": "https://rubengomezcoaching.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
      Vary: "Origin",
    });
  });
});
