import { prisma } from "@/lib/db";

/**
 * Suspension gate for owner-performed operations (vehicle CRUD, replies,
 * device registration, profile updates). A suspended owner's data stays
 * intact; they just can't act on the platform. Visitors can still reach the
 * vehicle page — the suspension is between the platform and the owner.
 *
 * Returns a ready-to-return 403 Response when the session user is suspended.
 */
export async function suspendedOwnerGuard(userId: string): Promise<Response | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedAt: true, adminRole: true },
  });
  // Staff roles are never suspension-blocked (they don't own vehicles anyway).
  if (!user || user.suspendedAt === null || user.adminRole !== "USER") return null;
  return Response.json(
    { error: "Account suspended. Contact support." },
    { status: 403 }
  );
}
