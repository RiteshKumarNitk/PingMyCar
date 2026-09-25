"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/auth";
import { roleHasPermission, type Permission } from "@/lib/admin/permissions";
import { auditContext, writeAudit } from "@/lib/admin/audit";

/**
 * Audited admin mutations. Every action: server-side session → fresh DB role
 * → permission check → mutation → audit row. Admin pages call these as
 * server actions; the permission check is never left to the page alone.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

async function guard(permission: Permission): Promise<{ admin: NonNullable<Awaited<ReturnType<typeof getAdminSession>>> } | { error: string }> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Unauthorized" };
  if (!roleHasPermission(admin.role, permission)) return { error: "Forbidden" };
  return { admin };
}

const SUPER_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

async function audit(input: {
  adminId: string;
  action: string;
  category: Parameters<typeof writeAudit>[0]["category"];
  resourceType: string;
  resourceId: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  result?: "SUCCESS" | "FAILURE" | "DENIED";
  reason?: string | null;
  metadata?: Record<string, string | number>;
}) {
  await writeAudit({
    action: input.action,
    category: input.category,
    actorType: "ADMIN",
    actorId: input.adminId,
    severity: input.severity ?? "WARNING",
    result: input.result ?? "SUCCESS",
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    reason: input.reason ?? null,
    metadata: input.metadata ?? null,
    context: await auditContext(),
  });
}

/* ------------------------------------------------------------------ users */

export async function setUserSuspended(
  userId: string,
  suspend: boolean,
  reason: string
): Promise<ActionResult> {
  if (reason.trim().length < 4) return { ok: false, error: "A reason is required." };
  const g = await guard("USER_SUSPEND");
  if ("error" in g) return { ok: false, error: g.error };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };

  await prisma.user.update({
    where: { id: userId },
    data: { suspendedAt: suspend ? new Date() : null },
  });

  await audit({
    adminId: g.admin.user.id,
    action: suspend ? "USER_SUSPENDED" : "USER_REACTIVATED",
    category: "ADMIN",
    resourceType: "USER",
    resourceId: userId,
    reason,
    metadata: { targetActorId: userId },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function changeUserRole(
  userId: string,
  newRole: "USER" | "SUPPORT" | "MODERATOR" | "OPERATIONS" | "ANALYST" | "ADMIN" | "SUPER_ADMIN",
  reason: string
): Promise<ActionResult> {
  if (reason.trim().length < 4) return { ok: false, error: "A reason is required." };
  const g = await guard("ADMIN_USER_MANAGE"); // SUPER_ADMIN-only by design
  if ("error" in g) return { ok: false, error: g.error };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (target.adminRole === newRole) return { ok: false, error: "User already has that role." };

  // Safeguard: never leave the platform with zero super admins.
  if ((SUPER_ADMIN_ROLES as readonly string[]).includes(target.adminRole)) {
    const remaining = await prisma.user.count({
      where: { adminRole: { in: [...SUPER_ADMIN_ROLES] }, id: { not: userId } },
    });
    if (remaining === 0) {
      return { ok: false, error: "Cannot demote the last admin/super-admin account." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { adminRole: newRole } });

  await audit({
    adminId: g.admin.user.id,
    action: "ADMIN_ROLE_CHANGED",
    category: "ADMIN",
    resourceType: "USER",
    resourceId: userId,
    reason,
    metadata: { oldRole: target.adminRole, newRole, targetActorId: userId },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/admin-users");
  return { ok: true };
}

/* --------------------------------------------------------------- vehicles */

export async function setQrActive(
  vehicleId: string,
  active: boolean,
  reason: string
): Promise<ActionResult> {
  if (reason.trim().length < 4) return { ok: false, error: "A reason is required." };
  const g = await guard("QR_MANAGE");
  if ("error" in g) return { ok: false, error: g.error };

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return { ok: false, error: "Vehicle not found." };

  await prisma.vehicle.update({ where: { id: vehicleId }, data: { qrActive: active } });

  await audit({
    adminId: g.admin.user.id,
    action: active ? "QR_ACTIVATED" : "QR_DEACTIVATED",
    category: "QR",
    resourceType: "VEHICLE",
    resourceId: vehicleId,
    reason,
    metadata: { actorRole: g.admin.role },
  });

  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/users/${vehicle.ownerId}`);
  return { ok: true };
}

/* ---------------------------------------------------------------- reports */

export async function updateReportStatus(
  reportId: string,
  status: "NEW" | "INVESTIGATING" | "RESOLVED" | "DISMISSED",
  notes: string
): Promise<ActionResult> {
  if (notes.trim().length < 4) return { ok: false, error: "Notes are required." };
  const g = await guard("REPORT_MANAGE");
  if ("error" in g) return { ok: false, error: g.error };

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return { ok: false, error: "Report not found." };

  await prisma.report.update({
    where: { id: reportId },
    data: { status, adminNotes: notes, assignedAdminId: g.admin.user.id },
  });

  await audit({
    adminId: g.admin.user.id,
    action: "MESSAGE_MODERATED",
    category: "REPORT",
    resourceType: "REPORT",
    resourceId: reportId,
    reason: notes,
    metadata: { toStatus: status },
  });

  revalidatePath("/admin/reports");
  return { ok: true };
}

/* ------------------------------------------------- message content access */

export async function readMessageContent(
  conversationId: string,
  reason: string
): Promise<ActionResult> {
  if (reason.trim().length < 4) return { ok: false, error: "A reason is required." };
  const g = await guard("MESSAGE_READ_CONTENT");
  if ("error" in g) return { ok: false, error: g.error };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, messages: { select: { id: true }, take: 1 } },
  });
  if (!conversation) return { ok: false, error: "Conversation not found." };

  await audit({
    adminId: g.admin.user.id,
    action: "ADMIN_VIEWED_MESSAGE_CONTENT",
    category: "MESSAGE",
    resourceType: "CONVERSATION",
    resourceId: conversationId,
    severity: "WARNING",
    reason,
  });

  return { ok: true };
}
