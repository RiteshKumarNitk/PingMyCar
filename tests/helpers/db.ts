import "dotenv/config";
import { PrismaClient } from "@prisma/client";

export const testDb = new PrismaClient();

/** Cascade-deletes the user and everything owned by them (vehicles, conversations, ...). */
export async function deleteUserByPhone(phoneNumber: string) {
  await testDb.user.deleteMany({ where: { phoneNumber } });
}
