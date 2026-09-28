import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * Test database access for E2E/integration suites.
 *
 * Tests create users and sessions directly in the database, so they must
 * never run against a real database. E2E_DATABASE_URL is required and must
 * point at localhost — .env's DATABASE_URL (production) is never used here.
 */
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "";
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export function isLocalDatabaseUrl(url: string): boolean {
  return /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
}

export function assertLocalTestDatabase(): void {
  if (!isLocalDatabaseUrl(E2E_DATABASE_URL)) {
    throw new Error(
      "E2E_DATABASE_URL must be set to a localhost Postgres database. Refusing to run tests against any other database."
    );
  }
}

export const testDb = new PrismaClient({
  datasourceUrl: isLocalDatabaseUrl(E2E_DATABASE_URL) ? E2E_DATABASE_URL : "postgresql://refused@localhost:1/refused",
});

/** Cascade-deletes a test user and everything they own (vehicles, conversations, ...). */
export async function deleteUserById(userId: string | undefined) {
  if (userId) await testDb.user.deleteMany({ where: { id: userId } });
}
