import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/admin/audit";
import type { AdminRole } from "@prisma/client";

/**
 * Secure super-admin bootstrap.
 *
 * INITIAL_SUPER_ADMIN_EMAIL (server-only env var) names the Google account
 * that may elevate itself to SUPER_ADMIN on first login. The grant happens
 * server-side after session authentication — never from client-supplied
 * data — and is audited.
 *
 * Hardening notes:
 * - The grant runs at most once per email (the audit event is the marker).
 * - The env var is not read into any client bundle (no NEXT_PUBLIC_ prefix).
 * - Once elevated, remove the env var; future logins keep the stored role.
 */

const BOOTSTRAP_ACTION = "ADMIN_ROLE_CHANGED";

/**
 * @param user identity of the authenticated user (id + email only — the
 *   current role is always read from the database here so the audit row
 *   records the user's true current role, never a caller-supplied guess).
 */
export async function bootstrapSuperAdmin(user: {
  id: string;
  email: string;
}): Promise<{ elevated: boolean; role: AdminRole }> {
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { adminRole: true },
    });
    return { elevated: false, role: current?.adminRole ?? "USER" };
  }

  const normalized = user.email.trim().toLowerCase();
  if (normalized !== email) {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { adminRole: true },
    });
    return { elevated: false, role: current?.adminRole ?? "USER" };
  }

  // Read the DB role so the audit row always records the true pre-grant role.
  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { adminRole: true },
  });
  if (!current) return { elevated: false, role: "USER" };

  // Never downgrade an existing higher role; SUPER_ADMIN is already final.
  if (current.adminRole === "SUPER_ADMIN") {
    return { elevated: false, role: current.adminRole };
  }

  // Idempotence marker: if this account was already bootstrapped, do not
  // write again.
  const alreadyBootstrapped = await prisma.auditLog.findFirst({
    where: {
      action: BOOTSTRAP_ACTION,
      actorId: user.id,
      metadata: { path: ["reasonCategory"], equals: "bootstrap" },
    },
    select: { id: true },
  });
  if (alreadyBootstrapped) {
    return { elevated: false, role: current.adminRole };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { adminRole: "SUPER_ADMIN" },
  });

  await writeAudit({
    action: BOOTSTRAP_ACTION,
    category: "ADMIN",
    actorType: "ADMIN",
    actorId: user.id,
    severity: "WARNING",
    result: "SUCCESS",
    resourceType: "USER",
    resourceId: user.id,
    // True DB role captured before the update — never a caller-supplied guess.
    metadata: { oldRole: current.adminRole, newRole: "SUPER_ADMIN", reasonCategory: "bootstrap" },
  });

  return { elevated: true, role: "SUPER_ADMIN" };
}
