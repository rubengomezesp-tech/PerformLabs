import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "./client";

const SECRET = "whsec_test_secret";

/** Builds a Stripe-style signature header for the given payload + timestamp. */
function sign(payload: string, secret: string, timestamp: number): string {
  const v1 = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe("verifyStripeSignature", () => {
  const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

  it("accepts a valid, fresh signature", () => {
    const header = sign(payload, SECRET, nowSeconds());
    expect(verifyStripeSignature(payload, header, SECRET)).toBe(true);
  });

  it("rejects a signature made with the wrong secret", () => {
    const header = sign(payload, "whsec_wrong", nowSeconds());
    expect(verifyStripeSignature(payload, header, SECRET)).toBe(false);
  });

  it("rejects when the payload was tampered with after signing", () => {
    const header = sign(payload, SECRET, nowSeconds());
    expect(verifyStripeSignature(`${payload} `, header, SECRET)).toBe(false);
  });

  it("rejects a missing or empty signature header", () => {
    expect(verifyStripeSignature(payload, null, SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, "", SECRET)).toBe(false);
  });

  it("rejects when the signing secret is missing", () => {
    const header = sign(payload, SECRET, nowSeconds());
    expect(verifyStripeSignature(payload, header, "")).toBe(false);
  });

  it("rejects a malformed header without t or v1", () => {
    expect(verifyStripeSignature(payload, "v1=abc", SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${nowSeconds()}`, SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, "garbage", SECRET)).toBe(false);
  });

  it("rejects a stale timestamp outside the 5-minute tolerance", () => {
    const stale = nowSeconds() - 600;
    expect(verifyStripeSignature(payload, sign(payload, SECRET, stale), SECRET)).toBe(false);
  });

  it("rejects a far-future timestamp outside tolerance", () => {
    const future = nowSeconds() + 600;
    expect(verifyStripeSignature(payload, sign(payload, SECRET, future), SECRET)).toBe(false);
  });

  it("accepts a timestamp at the edge of the tolerance window", () => {
    const edge = nowSeconds() - 290;
    expect(verifyStripeSignature(payload, sign(payload, SECRET, edge), SECRET)).toBe(true);
  });
});
