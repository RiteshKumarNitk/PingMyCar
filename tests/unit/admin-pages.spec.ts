import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { adminAccess } from "@/lib/admin/permissions";
import { adminVehicleWhere, parseAdminVehicleFilters } from "@/lib/admin/vehicles";

const ALL_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "MODERATOR", "SUPPORT", "ANALYST", "USER"] as const;

test.describe("admin page access (role read from the database)", () => {
  test("Admin Users (ADMIN_USER_MANAGE): SUPER_ADMIN only", () => {
    const allowed = ALL_ROLES.filter((r) => adminAccess(r, "ADMIN_USER_MANAGE") === "ok");
    expect(allowed).toEqual(["SUPER_ADMIN"]);
  });

  test("global Vehicles (VEHICLE_READ): every staff role that works with vehicles", () => {
    const allowed = ALL_ROLES.filter((r) => adminAccess(r, "VEHICLE_READ") === "ok");
    expect(allowed).toEqual(["SUPER_ADMIN", "ADMIN", "OPERATIONS", "MODERATOR", "SUPPORT"]);
  });

  test("a normal owner is forbidden and a visitor is unauthenticated", () => {
    expect(adminAccess("USER", "VEHICLE_READ")).toBe("forbidden");
    expect(adminAccess("USER", "ADMIN_USER_MANAGE")).toBe("forbidden");
    expect(adminAccess(null, "VEHICLE_READ")).toBe("unauthenticated");
    expect(adminAccess(null, "ADMIN_USER_MANAGE")).toBe("unauthenticated");
  });
});

test.describe("admin vehicle list filters", () => {
  test("no filters → every vehicle of every owner", () => {
    expect(adminVehicleWhere(parseAdminVehicleFilters({}))).toEqual({});
  });

  test("ownerId / role in the URL are ignored — they can't scope or elevate", () => {
    const f = parseAdminVehicleFilters({ ownerId: "someone-else", role: "SUPER_ADMIN", userId: "x" });
    expect(f).toEqual({ page: 1, q: undefined, qr: undefined, type: undefined });
    expect(JSON.stringify(adminVehicleWhere(f))).not.toContain("ownerId");
  });

  test("search covers vehicle name, plate, owner name and owner email", () => {
    const where = adminVehicleWhere(parseAdminVehicleFilters({ q: "  riya " }));
    const contains = { contains: "riya", mode: "insensitive" };
    expect(where).toEqual({
      AND: [{ OR: [{ name: contains }, { registrationNumber: contains }, { owner: { name: contains } }, { owner: { email: contains } }] }],
    });
  });

  test("type and QR filters accept only known values", () => {
    expect(parseAdminVehicleFilters({ type: "car", qr: "inactive", page: "3" })).toEqual({ page: 3, q: undefined, qr: "inactive", type: "CAR" });
    expect(parseAdminVehicleFilters({ type: "SPACESHIP", qr: "maybe", page: "-4" })).toEqual({ page: 1, q: undefined, qr: undefined, type: undefined });
  });
});

/** All .tsx files under a directory. */
function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? tsxFiles(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

test("admin server pages pass bound server actions, never inline closures", () => {
  // An inline `(x) => serverAction(...)` created in a Server Component can't
  // be serialized to a Client Component — the page crashes at render. This
  // is what broke /admin/admin-users and /admin/vehicles.
  const offenders = tsxFiles("app/admin").filter((f) => {
    const src = readFileSync(f, "utf8");
    return !src.startsWith('"use client"') && /action=\{\s*\(/.test(src);
  });
  expect(offenders).toEqual([]);
});

test.describe("frontend URL", () => {
  test("demo QRs use the configured frontend (NEXT_PUBLIC_APP_URL)", async () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://ping-my-car.vercel.app/";
    try {
      const { demoVehicleUrl, publicVehicleUrl } = await import("@/lib/security/tokens");
      expect(demoVehicleUrl()).toBe("https://ping-my-car.vercel.app/v/EXAMPLE1");
      expect(publicVehicleUrl("ABCD2345")).toBe("https://ping-my-car.vercel.app/v/ABCD2345");
      process.env.NEXT_PUBLIC_APP_URL = "https://ownerping.example";
      expect(demoVehicleUrl()).toBe("https://ownerping.example/v/EXAMPLE1");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });

  test("no website source hardcodes the old pingmycar.app domain", () => {
    const offenders = [...tsxFiles("app"), ...tsxFiles("components")].filter((f) => readFileSync(f, "utf8").includes("pingmycar.app"));
    expect(offenders).toEqual([]);
  });
});
