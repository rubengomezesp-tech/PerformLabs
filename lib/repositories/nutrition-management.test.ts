import { describe, expect, it } from "vitest";
import { parseRatio } from "./nutrition-management";

describe("parseRatio (A6 — explicit percentage)", () => {
  it("reads a 0–100 percentage as a 0–1 fraction", () => {
    expect(parseRatio("35")).toBeCloseTo(0.35);
    expect(parseRatio("0")).toBe(0);
    expect(parseRatio("100")).toBe(1);
  });

  it("reads '1' as 1%, not 100% (the bug the old `> 1` heuristic had)", () => {
    expect(parseRatio("1")).toBeCloseTo(0.01);
  });

  it("returns null for non-numeric or out-of-range input so the caller skips it", () => {
    expect(parseRatio("")).toBeNull();
    expect(parseRatio("abc")).toBeNull();
    expect(parseRatio("-5")).toBeNull();
    expect(parseRatio("150")).toBeNull();
  });
});
