import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  roleHasPermission,
  type Permission,
} from "@/lib/admin/permissions";
import { auditContext, writeAudit } from "@/lib/admin/audit";
import type { AdminRole, User } from "@prisma/client";

/**
 * Server-side admin authorization.
 *
 * The role ALWAYS comes from the database row for the authenticated session
 * user — never from a cookie, query param, or client payload. Every guard
 * call re-reads it, so a role revoked mid-session takes effect immediately.
 */

export type AdminSession = {
  user: Pick<User, "id" | "name" | "email" | "adminRole">;
  role: AdminRole;
};

/** Session user or null — does not redirect, for API callers. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, adminRole: true },
  });
  if (!user) return null;

  return { user, role: user.adminRole };
}

async function logDenied(opts: {
  userId: string | null;
  permission: Permission;
  path: string;
}): Promise<void> {
  await writeAudit({
    action: "AUTHZ_FAILURE",
    category: "SECURITY",
    actorType: opts.userId ? "USER" : "PUBLIC",
    actorId: opts.userId,
    severity: "WARNING",
    result: "DENIED",
    resourceType: "ADMIN_ROUTE",
    resourceId: opts.path,
    metadata: { filter: opts.permission },
    context: await auditContext(),
  });
}

/**
 * Page guard: redirects unauthenticated users to login, and authenticated
 * users without the permission to a 403 page. Use in /admin server components.
 */
export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const admin = await getAdminSession();
  if (!admin) redirect("/login");

  if (!roleHasPermission(admin.role, permission)) {
    await logDenied({ userId: admin.user.id, permission, path: "/admin" });
    redirect("/admin/forbidden");
  }
  return admin;
}

/**
 * API guard: returns either the admin session or a ready-to-return 403
 * Response. Pattern: `const r = requirePermissionApi(...); if (r) return r;`
 */
export async function requirePermissionApi(
  permission: Permission
): Promise<{ admin: AdminSession } | Response> {
  const admin = await getAdminSession();
  const path = "/admin/api";

  if (!admin) {
    await logDenied({ userId: null, permission, path });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!roleHasPermission(admin.role, permission)) {
    await logDenied({ userId: admin.user.id, permission, path });
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return { admin };
}
