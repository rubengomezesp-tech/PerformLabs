import { describe, expect, it } from "vitest";
import {
  isCreditConsumingStatus,
  localDateTimeToUtc,
  sessionDurationEnd,
  utcToLocalDateTime,
} from "./personal-training-schedule";

describe("personal training schedule dates", () => {
  it("converts Madrid wall time to UTC and back", () => {
    const utc = localDateTimeToUtc("2026-07-15T18:00", "Europe/Madrid");
    expect(utc).toBe("2026-07-15T16:00:00.000Z");
    expect(utcToLocalDateTime(utc, "Europe/Madrid")).toBe("2026-07-15T18:00");
  });

  it("converts Miami wall time using daylight saving offset", () => {
    expect(localDateTimeToUtc("2026-07-15T18:00", "America/New_York"))
      .toBe("2026-07-15T22:00:00.000Z");
  });

  it("creates a duration from the real instant", () => {
    expect(sessionDurationEnd("2026-07-15T18:00", 60, "Europe/Madrid"))
      .toBe("2026-07-15T17:00:00.000Z");
  });

  it("classifies only resolutions that consume a credit", () => {
    expect(isCreditConsumingStatus("completed")).toBe(true);
    expect(isCreditConsumingStatus("cancelled_late")).toBe(true);
    expect(isCreditConsumingStatus("no_show")).toBe(true);
    expect(isCreditConsumingStatus("cancelled_on_time")).toBe(false);
    expect(isCreditConsumingStatus("scheduled")).toBe(false);
  });
});
