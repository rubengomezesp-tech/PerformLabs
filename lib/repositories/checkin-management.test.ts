import { describe, expect, it } from "vitest";
import { buildCheckinSummary, getMemberOwnProgress, type ManagedCheckin } from "./checkin-management";

function checkin(submittedAt: string, values: ManagedCheckin["values"], photoPaths: string[] = []): ManagedCheckin {
  return {
    id: `c-${submittedAt}`,
    memberProfileId: "m1",
    memberName: "Cliente",
    status: "submitted",
    resultsStatus: "pending_review",
    photosAvailable: photoPaths.length > 0,
    photoPaths,
    submittedAt,
    reviewedAt: "",
    values,
  };
}

describe("buildCheckinSummary", () => {
  it("returns the 5 tracked measurements with null current for no check-ins", () => {
    const s = buildCheckinSummary([]);
    expect(s.total).toBe(0);
    expect(s.latest).toBeNull();
    expect(s.measurements).toHaveLength(5);
    expect(s.measurements.every((m) => m.current === null)).toBe(true);
  });

  it("takes current from the newest check-in and delta vs the previous one", () => {
    // newest-first input, like listManagedCheckins returns
    const s = buildCheckinSummary([
      checkin("2026-03-01", { weightKg: 80 }),
      checkin("2026-02-01", { weightKg: 82 }),
      checkin("2026-01-01", { weightKg: 85 }),
    ]);
    const weight = s.measurements.find((m) => m.key === "weightKg")!;
    expect(weight.current).toBe(80);
    expect(weight.delta).toBe(-2); // 80 - 82
    expect(weight.trend.map((p) => p.value)).toEqual([85, 82, 80]); // oldest-first for charting
    expect(s.weightTrend.map((p) => p.weightKg)).toEqual([85, 82, 80]);
  });

  it("skips check-ins missing a measurement when building that series", () => {
    const s = buildCheckinSummary([
      checkin("2026-03-01", { waistCm: 78 }), // no weight in the newest
      checkin("2026-02-01", { weightKg: 82 }),
    ]);
    const weight = s.measurements.find((m) => m.key === "weightKg")!;
    expect(weight.current).toBe(82);
    expect(weight.delta).toBeNull(); // only one weight reading
  });
});

describe("getMemberOwnProgress (member-scoping guard)", () => {
  it("returns empty progress without a member id — never a workspace-wide read", async () => {
    const s = await getMemberOwnProgress("ws-1", "");
    expect(s.total).toBe(0);
    expect(s.photoUrls).toEqual([]);
    expect(s.photosTakenAt).toBeNull();
    expect(s.measurements).toHaveLength(5);
  });
});
