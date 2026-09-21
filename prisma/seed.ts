import "dotenv/config";
import { prisma } from "../lib/db";
import { generatePublicToken } from "../lib/security/tokens";

async function main() {
  const email = "demo@pingmycar.test";
  const password = "demopass123";
  const { auth } = await import("../lib/auth");

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? (await auth.api.signInEmail({ body: { email, password } })).user
    : (await auth.api.signUpEmail({ body: { email, password, name: "Demo Owner" } })).user;

  let vehicle = await prisma.vehicle.findFirst({
    where: { ownerId: user.id },
    include: { profile: true },
  });

  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        ownerId: user.id,
        type: "CAR",
        name: "Honda City",
        publicToken: generatePublicToken(),
        profile: { create: {} },
      },
      include: { profile: true },
    });
  } else if (!vehicle.profile) {
    await prisma.vehicleProfile.create({ data: { vehicleId: vehicle.id } });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  console.log(`QR page (not live until Phase 8): ${base}/v/${vehicle.publicToken}`);
  console.log(`Owner login (Phase 3): ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
