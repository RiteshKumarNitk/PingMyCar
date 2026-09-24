import type { AdminRole } from "@prisma/client";

/**
 * Single source of truth for admin permissions and the role→permission map.
 *
 * Least privilege: a role has exactly what it needs and nothing more. The map
 * below is the ONLY place role capabilities are defined — add a permission
 * here and every guard, nav filter, and API route picks it up.
 */
export const PERMISSIONS = [
  // Users
  "USER_READ",
  "USER_SUSPEND",
  "USER_ROLE_MANAGE",

  // Vehicles + QR
  "VEHICLE_READ",
  "VEHICLE_MANAGE",
  "QR_MANAGE",

  // Messages: metadata is visible to any admin with MESSAGE_READ_METADATA;
  // content requires the separate MESSAGE_READ_CONTENT (audited on use).
  "MESSAGE_READ_METADATA",
  "MESSAGE_READ_CONTENT",
  "MESSAGE_MODERATE",

  // Reports
  "REPORT_READ",
  "REPORT_MANAGE",

  // Stickers + orders
  "STICKER_READ",
  "STICKER_MANAGE",
  "ORDER_READ",
  "ORDER_MANAGE",

  // Cross-cutting
  "ANALYTICS_READ",
  "AUDIT_LOG_READ",
  "SECURITY_READ",
  "ADMIN_USER_MANAGE",
  "SYSTEM_SETTINGS_MANAGE",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role → permissions. ORDER: USER < SUPPORT < MODERATOR < OPERATIONS <
 * ANALYST < ADMIN < SUPER_ADMIN. SUPER_ADMIN is not listed — it implicitly
 * holds every permission (see permissionsForRole), so role changes that
 * introduce new permissions never need a SUPER_ADMIN map edit.
 */
export const ROLE_PERMISSIONS: Partial<Record<Exclude<AdminRole, "SUPER_ADMIN">, readonly Permission[]>> = {
  // USER: platform customer — no admin permissions by design (empty map entry
  // omitted; permissionsForRole returns [] for anything unmapped).
  SUPPORT: [
    "USER_READ",
    "VEHICLE_READ",
    "STICKER_READ",
    "ORDER_READ",
    "REPORT_READ",
    "MESSAGE_READ_METADATA",
    "ANALYTICS_READ",
  ],

  // Moderator: message/report triage + protected content access (audited).
  MODERATOR: [
    "USER_READ",
    "VEHICLE_READ",
    "MESSAGE_READ_METADATA",
    "MESSAGE_READ_CONTENT",
    "MESSAGE_MODERATE",
    "REPORT_READ",
    "REPORT_MANAGE",
    "ANALYTICS_READ",
  ],

  // Operations: vehicle/QR/sticker/order lifecycle management.
  OPERATIONS: [
    "USER_READ",
    "VEHICLE_READ",
    "VEHICLE_MANAGE",
    "QR_MANAGE",
    "STICKER_READ",
    "STICKER_MANAGE",
    "ORDER_READ",
    "ORDER_MANAGE",
    "ANALYTICS_READ",
    "AUDIT_LOG_READ",
  ],

  // Analyst: aggregate visibility only — no moderation, no user actions.
  ANALYST: ["ANALYTICS_READ", "AUDIT_LOG_READ", "SECURITY_READ"],

  // Admin: broad platform management; still cannot manage other admins,
  // change system settings, or read message content.
  ADMIN: [
    "USER_READ",
    "USER_SUSPEND",
    "VEHICLE_READ",
    "VEHICLE_MANAGE",
    "QR_MANAGE",
    "MESSAGE_READ_METADATA",
    "MESSAGE_MODERATE",
    "REPORT_READ",
    "REPORT_MANAGE",
    "STICKER_READ",
    "STICKER_MANAGE",
    "ORDER_READ",
    "ORDER_MANAGE",
    "ANALYTICS_READ",
    "AUDIT_LOG_READ",
    "SECURITY_READ",
  ],
};

/** True when the role holds the permission (SUPER_ADMIN holds everything). */
export function roleHasPermission(role: AdminRole, permission: Permission): boolean {
  if (role === "SUPER_ADMIN") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** All permissions for a role (SUPER_ADMIN → every entry in PERMISSIONS). */
export function permissionsForRole(role: AdminRole): readonly Permission[] {
  if (role === "SUPER_ADMIN") return PERMISSIONS;
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Distinct roles a user may be assigned, for role-management UIs. */
export const ASSIGNABLE_ROLES: readonly AdminRole[] = [
  "USER",
  "SUPPORT",
  "MODERATOR",
  "OPERATIONS",
  "ANALYST",
  "ADMIN",
  "SUPER_ADMIN",
];
