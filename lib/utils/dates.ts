export const DAY_MS = 86_400_000;

/**
 * ISO timestamp for `days` before `from` (default now). For the common
 * "active since the last N days" cutoffs. Callers that need a YYYY-MM-DD slice
 * it themselves. NOTE: day-difference helpers are intentionally NOT centralised
 * here — the repositories use different rounding/null semantics (floor vs round,
 * 0 vs null) on purpose, so each keeps its own.
 */
export function daysAgoIso(days: number, from: number = Date.now()): string {
  return new Date(from - days * DAY_MS).toISOString();
}

/** ISO timestamp for `days` after `from` (default now). */
export function daysFromNowIso(days: number, from: number = Date.now()): string {
  return new Date(from + days * DAY_MS).toISOString();
}
