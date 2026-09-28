import { test, expect } from "@playwright/test";
import { rateLimit } from "@/lib/security/rate-limit";

const REDIS_ENV = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"];
const realFetch = globalThis.fetch;
let savedEnv: Record<string, string | undefined>;

/** Minimal in-memory stand-in for Upstash's /pipeline REST endpoint. */
function mockUpstash(opts: { fail?: boolean } = {}) {
  const store = new Map<string, number>();
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    if (opts.fail) throw new Error("upstash down");
    const [[, key]] = JSON.parse(String(init.body)) as string[][];
    store.set(key, (store.get(key) ?? 0) + 1);
    return new Response(JSON.stringify([{ result: store.get(key) }, { result: 1 }, { result: 60_000 }]));
  }) as typeof fetch;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  return store;
}

async function hit(key: string, times: number) {
  const results = [];
  for (let i = 0; i < times; i++) results.push(await rateLimit({ key, limit: 5, windowMs: 60_000 }));
  return results;
}

test.describe("rateLimit", () => {
  test.beforeEach(() => {
    savedEnv = Object.fromEntries(REDIS_ENV.map((k) => [k, process.env[k]]));
    for (const k of REDIS_ENV) delete process.env[k];
  });
  test.afterEach(() => {
    globalThis.fetch = realFetch;
    for (const k of REDIS_ENV) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  test("without Redis: memory limiter enforces the limit and reports degraded", async () => {
    const results = await hit(`mem-${Math.random()}`, 6);
    expect(results.map((r) => r.ok)).toEqual([true, true, true, true, true, false]);
    expect(results.every((r) => r.degraded)).toBe(true);
  });

  test("with Upstash: shared counter enforces the limit, not degraded", async () => {
    const store = mockUpstash();
    const key = `redis-${Math.random()}`;
    const results = await hit(key, 6);
    expect(results.map((r) => r.ok)).toEqual([true, true, true, true, true, false]);
    expect(results.every((r) => !r.degraded)).toBe(true);
    expect(store.get(`ratelimit:${key}`)).toBe(6);
  });

  test("Upstash outage never blocks messaging: falls back, marked degraded", async () => {
    mockUpstash({ fail: true });
    const [result] = await hit(`down-${Math.random()}`, 1);
    expect(result.ok).toBe(true);
    expect(result.degraded).toBe(true);
  });
});
