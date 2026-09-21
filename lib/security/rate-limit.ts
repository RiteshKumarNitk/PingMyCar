/**
 * In-process rate limiter for a single Next.js instance.
 * Wired in Phase 13. Not used for multi-instance deploys (that would need Redis).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(options.key, { count: 1, resetAt });
    return { ok: true, remaining: options.limit - 1, resetAt };
  }

  if (existing.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function visitorMessageLimit() {
  const limit = Number(process.env.RATE_LIMIT_VISITOR_PER_MINUTE ?? 5);
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);
  return { limit, windowMs: 60_000, maxChars };
}
