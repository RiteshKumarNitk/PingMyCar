import { prisma } from "@/lib/db";
import { deleteAllUserObjects } from "@/lib/storage/s3";

/**
 * Owner account deletion.
 *
 * Personal data is removed; only what moderation needs survives:
 *
 * - Always removed: sessions, the Google account link (so the same Google
 *   login later creates a brand-new, empty account), every device/FCM token,
 *   notifications, uploaded photos, and every vehicle + its QR record,
 *   profile, conversations, messages and closed reports.
 * - Kept only while a report is still open (NEW / INVESTIGATING): that
 *   conversation, its messages and the report, so moderators can finish the
 *   review. The conversation is BLOCKED (no further visitor messages), its
 *   vehicle is turned off and wiped of details, and the account row is kept
 *   only as an anonymized, suspended shell ("Deleted user", no email/photo/
 *   phone) that no one can sign in to.
 *
 * With no open reports the account row itself is deleted (cascading to all
 * of the above). Audit entries written by this user keep their action but
 * lose the link to the account (actorId → null).
 *
 * Printed QR stickers: a deleted vehicle's token no longer resolves (the
 * public page 404s); a kept vehicle is inactive (qrActive=false), which the
 * public page shows as "not active" with no owner details. Tokens are never
 * reassigned.
 */

export const OPEN_REPORT_STATUSES = ["NEW", "INVESTIGATING"] as const;

export type DeletionPlan = {
  /** Hard-delete the user row (no open reports anywhere). */
  hardDelete: boolean;
  /** Vehicles deleted outright (with everything under them). */
  deleteVehicleIds: string[];
  /** Vehicles kept (inactive, wiped) because they hold open-report conversations. */
  keepVehicleIds: string[];
  /** Conversations kept for moderation. */
  keepConversationIds: string[];
};

/** Pure planning step — which rows go and which stay. */
export function planAccountDeletion(
  vehicles: { id: string; conversations: { id: string; openReports: number }[] }[]
): DeletionPlan {
  const keepConversationIds: string[] = [];
  const keepVehicleIds: string[] = [];
  const deleteVehicleIds: string[] = [];
  for (const v of vehicles) {
    const held = v.conversations.filter((c) => c.openReports > 0).map((c) => c.id);
    if (held.length > 0) {
      keepVehicleIds.push(v.id);
      keepConversationIds.push(...held);
    } else {
      deleteVehicleIds.push(v.id);
    }
  }
  return { hardDelete: keepConversationIds.length === 0, deleteVehicleIds, keepVehicleIds, keepConversationIds };
}

export type DeletionResult = DeletionPlan & { vehiclesDeleted: number; photosDeleted: number };

export class AccountDeletionRefused extends Error {}

export async function deleteOwnerAccount(userId: string): Promise<DeletionResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, adminRole: true } });
  if (!user) throw new AccountDeletionRefused("Account not found");
  // Staff accounts carry admin permissions and audit history; they must be
  // demoted by another admin before the person can delete the account.
  if (user.adminRole !== "USER") {
    throw new AccountDeletionRefused("Admin accounts can't be deleted from the app. Ask another admin to remove your admin role first.");
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      conversations: {
        select: {
          id: true,
          _count: { select: { reports: { where: { status: { in: [...OPEN_REPORT_STATUSES] } } } } },
        },
      },
    },
  });
  const plan = planAccountDeletion(
    vehicles.map((v) => ({ id: v.id, conversations: v.conversations.map((c) => ({ id: c.id, openReports: c._count.reports })) }))
  );

  await prisma.$transaction(async (tx) => {
    if (plan.hardDelete) {
      // Cascades: sessions, accounts, devices, notifications, vehicles →
      // profiles, conversations → messages, reports.
      await tx.user.delete({ where: { id: userId } });
      return;
    }

    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.device.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.vehicle.deleteMany({ where: { id: { in: plan.deleteVehicleIds }, ownerId: userId } });

    // Kept vehicles: only the reported conversations survive.
    await tx.conversation.deleteMany({
      where: { vehicleId: { in: plan.keepVehicleIds }, id: { notIn: plan.keepConversationIds } },
    });
    await tx.conversation.updateMany({ where: { id: { in: plan.keepConversationIds } }, data: { status: "BLOCKED" } });
    await tx.vehicle.updateMany({
      where: { id: { in: plan.keepVehicleIds }, ownerId: userId },
      data: { qrActive: false, name: "Deleted vehicle", registrationNumber: null, photoUrl: null, color: null, type: null },
    });
    await tx.vehicleProfile.updateMany({
      where: { vehicleId: { in: plan.keepVehicleIds } },
      data: {
        allowMessages: false,
        showVehicleName: false,
        showVehicleType: false,
        showVehiclePhoto: false,
        showRegistrationNumber: false,
        showOwnerName: false,
        showOwnerPhoto: false,
        showPreferredName: false,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Deleted user",
        email: `deleted-${userId}@deleted.invalid`,
        emailVerified: false,
        image: null,
        phoneNumber: null,
        phoneNumberVerified: false,
        preferredName: null,
        suspendedAt: new Date(),
      },
    });
  });

  // Photos go after the database commit; a storage hiccup never leaves a
  // half-deleted account, and is logged for manual cleanup.
  let photosDeleted = 0;
  try {
    photosDeleted = await deleteAllUserObjects(userId);
  } catch (err) {
    console.error("[account] photo cleanup failed:", err instanceof Error ? err.message : err);
  }

  return { ...plan, vehiclesDeleted: plan.deleteVehicleIds.length, photosDeleted };
}
