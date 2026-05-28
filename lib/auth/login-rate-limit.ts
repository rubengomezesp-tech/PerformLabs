export type LoginRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type LoginAttemptRecord = {
  count: number;
  resetAt: number;
  blockedUntil: number;
};

const windowMs = 15 * 60 * 1000;
const blockMs = 15 * 60 * 1000;
const maxAttempts = 5;
const attempts = new Map<string, LoginAttemptRecord>();

function cleanExpired(now: number) {
  for (const [key, record] of attempts.entries()) {
    if (record.resetAt <= now && record.blockedUntil <= now) {
      attempts.delete(key);
    }
  }
}

function getRecord(key: string, now: number) {
  cleanExpired(now);
  const existing = attempts.get(key);
  if (existing && existing.resetAt > now) return existing;

  const record = {
    count: 0,
    resetAt: now + windowMs,
    blockedUntil: 0,
  };
  attempts.set(key, record);
  return record;
}

export function checkLoginRateLimit(key: string, now = Date.now()): LoginRateLimitResult {
  const record = getRecord(key, now);

  if (record.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
    retryAfterSeconds: 0,
  };
}

export function recordFailedLogin(key: string, now = Date.now()): LoginRateLimitResult {
  const record = getRecord(key, now);
  record.count += 1;

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockMs;
  }

  return checkLoginRateLimit(key, now);
}

export function clearLoginRateLimit(key: string) {
  attempts.delete(key);
}

export function resetLoginRateLimitForTests() {
  attempts.clear();
}
