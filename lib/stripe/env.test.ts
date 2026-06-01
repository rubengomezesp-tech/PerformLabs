import { afterEach, describe, expect, it } from "vitest";
import { getStripeEnv } from "./env";

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
