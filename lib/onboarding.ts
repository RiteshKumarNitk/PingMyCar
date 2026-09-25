import { prisma } from "@/lib/db";
import { hasRealName } from "@/lib/auth/identity";
import type { AdminRole } from "@prisma/client";

export { hasRealName };

export function isStaffRole(role: AdminRole | null | undefined): boolean {
  return Boolean(role && role !== "USER");
}

export async function needsOnboarding(user: {
  id: string;
  name: string;
  phoneNumber?: string | null;
}): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { adminRole: true },
  });
  if (isStaffRole(row?.adminRole)) return false;
  if (!hasRealName(user.name, user.phoneNumber)) return true;
  const vehicleCount = await prisma.vehicle.count({ where: { ownerId: user.id } });
  return vehicleCount === 0;
}

export async function postLoginPath(userId: string): Promise<string> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { adminRole: true, name: true, phoneNumber: true },
  });
  if (!row) return "/login";
  if (isStaffRole(row.adminRole)) return "/admin";
  if (await needsOnboarding({ id: userId, name: row.name, phoneNumber: row.phoneNumber })) {
    return "/onboarding";
  }
  return "/dashboard";
}
