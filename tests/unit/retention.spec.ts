import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { autoDeleteAt, RETENTION_DAYS } from "@/lib/conversations/retention";
import { GET as purgeCron } from "@/app/api/cron/purge-conversations/route";

test.describe("conversation retention", () => {
  test("unkept conversation auto-deletes RETENTION_DAYS after last activity", () => {
    expect(RETENTION_DAYS).toBe(5);
    const updatedAt = new Date("2026-09-28T10:00:00Z");
    expect(autoDeleteAt({ keptAt: null, updatedAt })?.toISOString()).toBe("2026-10-03T10:00:00.000Z");
  });

  test("kept conversation never auto-deletes", () => {
    expect(autoDeleteAt({ keptAt: new Date(), updatedAt: new Date(0) })).toBeNull();
  });
});

test.describe("purge cron auth", () => {
  const saved = process.env.CRON_SECRET;
  test.afterEach(() => {
    if (saved === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = saved;
  });

  const call = (auth?: string) =>
    purgeCron(
      new NextRequest("https://example.test/api/cron/purge-conversations", {
        headers: auth ? { authorization: auth } : {},
      })
    );

  test("refuses to run when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer undefined")).status).toBe(401);
    expect((await call()).status).toBe(401);
  });

  test("rejects a wrong or missing bearer token", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
  });
});
