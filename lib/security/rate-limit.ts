/**
 * Fixed-window rate limiter.
 *
 * On Vercel every request can land on a different serverless instance, so an
 * in-process Map barely limits anything. When Upstash Redis is configured
 * (Vercel's Upstash integration sets KV_REST_API_URL/KV_REST_API_TOKEN; plain
 * Upstash uses UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN) the counter is
 * shared across all instances via Upstash's REST API — no extra dependency.
 *
 * Without Redis (local dev), or if Redis errors, it falls back to the
 * in-process limiter so visitors are never blocked by an outage.
 */

type Bucket = { count: number; resetAt: number };
type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };
type RateLimitOptions = { key: string; limit: number; windowMs: number };

const buckets = new Map<string, Bucket>();

function memoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    // Drop expired buckets opportunistically so the Map can't grow unbounded.
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
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

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

let warnedNoRedis = false;

async function redisRateLimit(
  redis: { url: string; token: string },
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const key = `ratelimit:${options.key}`;
  const res = await fetch(`${redis.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" },
    // INCR the window counter; start the window's TTL only on its first hit.
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(options.windowMs), "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(1500),
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);

  const [incr, , pttl] = (await res.json()) as Array<{ result?: number; error?: string }>;
  if (typeof incr?.result !== "number") throw new Error(incr?.error ?? "Bad Upstash response");

  const count = incr.result;
  const ttl = typeof pttl?.result === "number" && pttl.result > 0 ? pttl.result : options.windowMs;
  return {
    ok: count <= options.limit,
    remaining: Math.max(0, options.limit - count),
    resetAt: Date.now() + ttl,
  };
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = redisConfig();
  if (!redis) {
    if (process.env.VERCEL && !warnedNoRedis) {
      warnedNoRedis = true;
      console.warn("[rate-limit] No Upstash Redis configured — using per-instance memory limiter, which is ineffective on Vercel.");
    }
    return memoryRateLimit(options);
  }

  try {
    return await redisRateLimit(redis, options);
  } catch (err) {
    console.error("[rate-limit] Upstash unavailable, falling back to memory limiter:", err instanceof Error ? err.message : err);
    return memoryRateLimit(options);
  }
}

export function visitorMessageLimit() {
  const limit = Number(process.env.RATE_LIMIT_VISITOR_PER_MINUTE ?? 5);
  const maxChars = Number(process.env.MESSAGE_MAX_CHARS ?? 500);
  return { limit, windowMs: 60_000, maxChars };
}
