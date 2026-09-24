import { test, expect } from "@playwright/test";
import type { AdminRole } from "@prisma/client";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
  permissionsForRole,
} from "@/lib/admin/permissions";
import { sanitizeMetadataForTest } from "@/lib/admin/audit";

const ALL_ROLES: AdminRole[] = [
  "USER",
  "SUPPORT",
  "MODERATOR",
  "OPERATIONS",
  "ANALYST",
  "ADMIN",
  "SUPER_ADMIN",
];

test.describe("RBAC role→permission map", () => {
  test("SUPER_ADMIN implicitly holds every permission", () => {
    for (const p of PERMISSIONS) {
      expect(roleHasPermission("SUPER_ADMIN", p)).toBe(true);
    }
    expect(permissionsForRole("SUPER_ADMIN")).toEqual(PERMISSIONS);
  });

  test("USER holds no admin permissions", () => {
    for (const p of PERMISSIONS) {
      expect(roleHasPermission("USER", p)).toBe(false);
    }
    expect(permissionsForRole("USER")).toEqual([]);
  });

  test("every role has a map entry (except USER/SUPER_ADMIN by design)", () => {
    const withEntries = ALL_ROLES.filter((r) => r !== "USER" && r !== "SUPER_ADMIN");
    for (const role of withEntries) {
      expect(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]).toBeDefined();
    }
  });

  test("least privilege: ANALYST cannot suspend users or manage vehicles", () => {
    expect(roleHasPermission("ANALYST", "USER_SUSPEND")).toBe(false);
    expect(roleHasPermission("ANALYST", "VEHICLE_MANAGE")).toBe(false);
    expect(roleHasPermission("ANALYST", "MESSAGE_READ_CONTENT")).toBe(false);
  });

  test("least privilege: ADMIN cannot manage other admins or read message content", () => {
    expect(roleHasPermission("ADMIN", "ADMIN_USER_MANAGE")).toBe(false);
    expect(roleHasPermission("ADMIN", "SYSTEM_SETTINGS_MANAGE")).toBe(false);
    expect(roleHasPermission("ADMIN", "MESSAGE_READ_CONTENT")).toBe(false);
  });

  test("only MODERATOR (and SUPER_ADMIN) can read message content", () => {
    const withContent = ALL_ROLES.filter((r) => roleHasPermission(r, "MESSAGE_READ_CONTENT"));
    expect(withContent).toEqual(["MODERATOR", "SUPER_ADMIN"]);
  });

  test("only SUPER_ADMIN can manage admin users and system settings", () => {
    const withAdminManage = ALL_ROLES.filter((r) => roleHasPermission(r, "ADMIN_USER_MANAGE"));
    const withSettings = ALL_ROLES.filter((r) => roleHasPermission(r, "SYSTEM_SETTINGS_MANAGE"));
    expect(withAdminManage).toEqual(["SUPER_ADMIN"]);
    expect(withSettings).toEqual(["SUPER_ADMIN"]);
  });

  test("roles that can manage can also read (no manage-without-read)", () => {
    for (const role of ALL_ROLES) {
      if (roleHasPermission(role, "VEHICLE_MANAGE")) {
        expect(roleHasPermission(role, "VEHICLE_READ")).toBe(true);
      }
      if (roleHasPermission(role, "MESSAGE_MODERATE")) {
        expect(roleHasPermission(role, "MESSAGE_READ_METADATA")).toBe(true);
      }
    }
  });
});

test.describe("audit metadata sanitizer", () => {
  test("allows whitelisted scalar keys", () => {
    const out = sanitizeMetadataForTest({
      count: 5,
      filter: "role:ADMIN",
      oldRole: "USER",
      newRole: "ADMIN",
    });
    expect(out).toEqual({ count: 5, filter: "role:ADMIN", oldRole: "USER", newRole: "ADMIN" });
  });

  test("drops non-whitelisted keys (potential secrets/PII)", () => {
    const out = sanitizeMetadataForTest({
      password: "hunter2",
      token: "ghp_abc123",
      email: "victim@example.com",
      body: "private message text",
      DATABASE_URL: "postgres://...",
      count: 3,
    });
    expect(out).toEqual({ count: 3 });
  });

  test("drops non-scalar values and oversized strings", () => {
    const out = sanitizeMetadataForTest({
      count: { nested: "object" },
      filter: "x".repeat(201),
      reasonCategory: "abuse",
    });
    expect(out).toEqual({ reasonCategory: "abuse" });
  });

  test("returns undefined when nothing survives", () => {
    expect(sanitizeMetadataForTest({ secret: "s3cret" })).toBeUndefined();
    expect(sanitizeMetadataForTest(null)).toBeUndefined();
    expect(sanitizeMetadataForTest(undefined)).toBeUndefined();
  });
});
