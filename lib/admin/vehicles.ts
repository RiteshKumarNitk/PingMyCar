import type { Prisma, VehicleType } from "@prisma/client";

/**
 * Admin global vehicle list — filters.
 *
 * Every vehicle across all owners; the admin's own id plays no part. Only the
 * allow-listed params below are read — anything else in the URL (e.g.
 * `ownerId`, `role`) is ignored, so a query string can't narrow the view to
 * another scope or grant anything. Authorization happens before this, from
 * the session's database role (requirePermission("VEHICLE_READ")).
 */

export const VEHICLE_TYPES: readonly VehicleType[] = ["CAR", "BIKE", "SCOOTER", "TRUCK", "VAN", "OTHER"];

export type AdminVehicleFilters = {
  page: number;
  /** Matches vehicle name, registration number, owner name or owner email. */
  q?: string;
  qr?: "active" | "inactive";
  type?: VehicleType;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseAdminVehicleFilters(params: RawParams): AdminVehicleFilters {
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);
  const q = first(params.q)?.trim().slice(0, 100) || undefined;
  const qrRaw = first(params.qr);
  const qr = qrRaw === "active" || qrRaw === "inactive" ? qrRaw : undefined;
  const typeRaw = first(params.type)?.toUpperCase();
  const type = VEHICLE_TYPES.find((t) => t === typeRaw);
  return { page, q, qr, type };
}

export function adminVehicleWhere(f: AdminVehicleFilters): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [];
  if (f.qr) and.push({ qrActive: f.qr === "active" });
  if (f.type) and.push({ type: f.type });
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { name: contains },
        { registrationNumber: contains },
        { owner: { name: contains } },
        { owner: { email: contains } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

/** Query string for links that keep the current filters. */
export function adminVehicleQuery(f: AdminVehicleFilters, overrides: Partial<AdminVehicleFilters> = {}): string {
  const merged = { ...f, ...overrides };
  const qs = new URLSearchParams();
  if (merged.q) qs.set("q", merged.q);
  if (merged.qr) qs.set("qr", merged.qr);
  if (merged.type) qs.set("type", merged.type);
  if (merged.page > 1) qs.set("page", String(merged.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
