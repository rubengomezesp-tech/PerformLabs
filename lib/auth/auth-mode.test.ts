import { describe, expect, it } from "vitest";
import { isConsoleAuthRequired } from "./auth-mode";

describe("auth-mode", () => {
  it("keeps local development open by default", () => {
    expect(isConsoleAuthRequired({ NODE_ENV: "development" })).toBe(false);
  });

  it("requires auth by default in production-like runtimes", () => {
    expect(isConsoleAuthRequired({ NODE_ENV: "production" })).toBe(true);
    expect(isConsoleAuthRequired({ NODE_ENV: "development", VERCEL: "1" })).toBe(true);
  });

  it("does not allow an explicit false flag to open production", () => {
    expect(isConsoleAuthRequired({ NODE_ENV: "production", COACHOS_AUTH_REQUIRED: "false" })).toBe(true);
    expect(isConsoleAuthRequired({ NODE_ENV: "development", VERCEL: "1", COACHOS_AUTH_REQUIRED: "false" })).toBe(true);
  });

  it("allows local auth enforcement when requested", () => {
    expect(isConsoleAuthRequired({ NODE_ENV: "development", COACHOS_AUTH_REQUIRED: "true" })).toBe(true);
  });

  it("requires auth when NODE_ENV is unset or non-dev (no accidental open deploy)", () => {
    expect(isConsoleAuthRequired({})).toBe(true);
    expect(isConsoleAuthRequired({ NODE_ENV: "staging" })).toBe(true);
    expect(isConsoleAuthRequired({ NODE_ENV: "" })).toBe(true);
  });
});
