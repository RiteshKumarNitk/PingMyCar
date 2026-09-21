import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateVehicleProfileSchema } from "@/lib/validation/vehicleProfile";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
    include: { profile: true },
  });
  if (!vehicle?.profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ profile: vehicle.profile });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, ownerId: session.user.id },
    include: { profile: true },
  });
  if (!vehicle?.profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateVehicleProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.vehicleProfile.update({
    where: { vehicleId: id },
    data: parsed.data,
  });

  return NextResponse.json({ profile });
}
