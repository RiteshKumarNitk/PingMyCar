import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateVehicleSchema } from "@/lib/validation/vehicle";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, ownerId: session.user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ vehicle });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.vehicle.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ vehicle });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.vehicle.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vehicle.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
