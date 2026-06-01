// Canonical UUID (v1–v5) guard, extracted from ~20 duplicated copies across the
// repositories. One of those copies (nutrition-tracking) had a malformed regex
// that rejected every valid UUID; this is the correct, single source of truth.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value?: string | null): value is string {
  return !!value && UUID_RE.test(value);
}
