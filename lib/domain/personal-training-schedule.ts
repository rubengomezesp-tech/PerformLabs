export const PERSONAL_TRAINING_STATUSES = [
  "scheduled",
  "completed",
  "cancelled_on_time",
  "cancelled_late",
  "no_show",
] as const;

export type PersonalTrainingStatus = (typeof PERSONAL_TRAINING_STATUSES)[number];

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function timeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

/** Converts an HTML datetime-local value in a named IANA zone into UTC. */
export function localDateTimeToUtc(value: string, timeZone: string): string {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match || !isValidTimeZone(timeZone)) throw new Error("Invalid local date, time, or timezone");
  const [, year, month, day, hour, minute] = match;
  const wallClockUtc = Date.UTC(+year!, +month! - 1, +day!, +hour!, +minute!);

  // Two passes handle the DST offset on both sides of a transition without a
  // runtime Temporal dependency. Invalid/non-existent wall times are rejected.
  let instant = wallClockUtc;
  for (let pass = 0; pass < 2; pass += 1) {
    const zoned = timeZoneParts(new Date(instant), timeZone);
    const representedAsUtc = Date.UTC(
      Number(zoned.year),
      Number(zoned.month) - 1,
      Number(zoned.day),
      Number(zoned.hour),
      Number(zoned.minute),
      Number(zoned.second),
    );
    instant += wallClockUtc - representedAsUtc;
  }

  const resolved = timeZoneParts(new Date(instant), timeZone);
  const resolvedValue = `${resolved.year}-${resolved.month}-${resolved.day}T${resolved.hour}:${resolved.minute}`;
  if (resolvedValue !== value) throw new Error("This local time does not exist in the selected timezone");
  return new Date(instant).toISOString();
}

export function utcToLocalDateTime(value: Date | string, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()) || !isValidTimeZone(timeZone)) return "";
  const parts = timeZoneParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function sessionDurationEnd(startLocal: string, minutes: number, timeZone: string): string {
  const startUtc = new Date(localDateTimeToUtc(startLocal, timeZone));
  return new Date(startUtc.getTime() + minutes * 60_000).toISOString();
}

export function isCreditConsumingStatus(status: PersonalTrainingStatus): boolean {
  return status === "completed" || status === "cancelled_late" || status === "no_show";
}
