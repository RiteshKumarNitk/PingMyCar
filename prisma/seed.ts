import "dotenv/config";
import { prisma } from "../lib/db";
import { generatePublicToken, generateVisitorToken, hashVisitorToken } from "../lib/security/tokens";

const DEMO_MESSAGES = [
  { senderType: "VISITOR" as const, body: "Your headlights are still on." },
  { senderType: "OWNER" as const, body: "Thanks for letting me know — on my way!" },
];

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
        registrationNumber: "RJ14XX1234",
        publicToken: generatePublicToken(),
        profile: { create: {} },
      },
      include: { profile: true },
    });
  } else if (!vehicle.profile) {
    await prisma.vehicleProfile.create({ data: { vehicleId: vehicle.id } });
  }

  // Two demo conversations so the dashboard inbox and overview aren't empty.
  // One read (older), one unread (fresh).
  const existingConversations = await prisma.conversation.count({
    where: { vehicleId: vehicle.id },
  });

  if (existingConversations === 0) {
    const readAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.conversation.create({
      data: {
        vehicleId: vehicle.id,
        visitorTokenHash: hashVisitorToken(generateVisitorToken()),
        reason: "DAMAGE",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        messages: {
          create: [
            {
              senderType: "VISITOR",
              reason: "DAMAGE",
              body: "Someone may have hit your vehicle while parking. There's a small scrape on the rear bumper.",
              createdAt: readAt,
              readAt,
            },
            {
              senderType: "OWNER",
              body: "Thanks for the heads-up, I'll check it out this evening.",
              createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
            },
          ],
        },
      },
    });

    await prisma.conversation.create({
      data: {
        vehicleId: vehicle.id,
        visitorTokenHash: hashVisitorToken(generateVisitorToken()),
        reason: "LIGHTS_ON",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        messages: {
          create: [
            {
              senderType: "VISITOR",
              reason: "LIGHTS_ON",
              body: "Your headlights are still on!",
            },
          ],
        },
      },
    });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  console.log(`QR page: ${base}/v/${vehicle.publicToken}`);
  console.log(`Owner login: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
