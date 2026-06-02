import { afterEach, describe, expect, it } from "vitest";
import { clampFeePercent, getStripeEnv } from "./env";

describe("clampFeePercent", () => {
  it("keeps a valid 0–100 percentage", () => {
    expect(clampFeePercent(25)).toBe(25);
    expect(clampFeePercent(0)).toBe(0);
    expect(clampFeePercent(100)).toBe(100);
  });

  it("clamps out-of-range values into 0..100", () => {
    expect(clampFeePercent(250)).toBe(100);
    expect(clampFeePercent(-5)).toBe(0);
  });

  it("falls back to 25 for non-finite input", () => {
    expect(clampFeePercent(NaN)).toBe(25);
    expect(clampFeePercent(Infinity)).toBe(25);
  });
});

describe("getStripeEnv applicationFeePercent", () => {
  const KEY = "STRIPE_APPLICATION_FEE_PERCENT";
  const original = process.env[KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it("defaults to 25 when unset or non-numeric", () => {
    delete process.env[KEY];
    expect(getStripeEnv().applicationFeePercent).toBe(25);
    process.env[KEY] = "abc";
    expect(getStripeEnv().applicationFeePercent).toBe(25);
  });

  it("clamps out-of-range values into 0..100", () => {
    process.env[KEY] = "250";
    expect(getStripeEnv().applicationFeePercent).toBe(100);
    process.env[KEY] = "-5";
    expect(getStripeEnv().applicationFeePercent).toBe(0);
    process.env[KEY] = "25";
    expect(getStripeEnv().applicationFeePercent).toBe(25);
  });
});
