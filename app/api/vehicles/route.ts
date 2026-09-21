import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generatePublicToken } from "@/lib/security/tokens";
import { createVehicleSchema } from "@/lib/validation/vehicle";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ vehicles });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, type, registrationNumber } = parsed.data;

  let publicToken = generatePublicToken();
  for (let attempt = 0; attempt < 5; attempt++) {
    const collision = await prisma.vehicle.findUnique({ where: { publicToken } });
    if (!collision) break;
    publicToken = generatePublicToken();
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId: session.user.id,
      name,
      type,
      registrationNumber,
      publicToken,
      profile: { create: {} },
    },
  });

  return NextResponse.json({ vehicle }, { status: 201 });
}
