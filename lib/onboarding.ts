import { prisma } from "@/lib/db";
import { hasRealName } from "@/lib/auth/identity";

export { hasRealName };

export async function needsOnboarding(user: { id: string; name: string; phoneNumber?: string | null }): Promise<boolean> {
  if (!hasRealName(user.name, user.phoneNumber)) return true;
  const vehicleCount = await prisma.vehicle.count({ where: { ownerId: user.id } });
  return vehicleCount === 0;
}
