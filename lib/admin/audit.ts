import { headers } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Central audit write helper.
 *
 * Everything is best-effort: an audit failure must never break the user-facing
 * request, so callers never await a thrown error — failures are logged server-
 * side only.
 *
 * Secret hygiene (enforced here, not left to callers):
 * - no tokens, passwords, cookies, auth codes, or connection strings
 * - visitor/QR tokens are stored only as SHA-256 hashes when callers need to
 *   reference them
 * - metadata passes through a key allowlist
 */

export type AuditActorType = "USER" | "ADMIN" | "PUBLIC" | "SYSTEM";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type AuditResult = "SUCCESS" | "FAILURE" | "DENIED";
export type AuditCategory =
  | "AUTH"
  | "USER"
  | "VEHICLE"
  | "QR"
  | "MESSAGE"
  | "REPORT"
  | "ADMIN"
  | "SECURITY"
  | "SYSTEM";

export type AuditInput = {
  action: string;
  category: AuditCategory;
  actorType: AuditActorType;
  /** Authenticated user id; null for visitors and system events. */
  actorId?: string | null;
  severity?: AuditSeverity;
  result?: AuditResult;
  resourceType?: string | null;
  resourceId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Already-extracted request context (see auditContext). */
  context?: { ipAddressHash?: string | null; userAgent?: string | null; requestId?: string | null };
};

/** Keys allowed into AuditLog.metadata — anything else is dropped. */
const METADATA_KEYS = new Set([
  "count",
  "page",
  "pageSize",
  "filter",
  "action",
  "oldRole",
  "newRole",
  "entityType",
  "fromStatus",
  "toStatus",
  "exportType",
  "reasonCategory",
  "actorRole",
  "targetActorId",
]);

/**
 * Pass through only whitelisted, bounded scalar metadata. Exported for unit
 * tests; production code goes through writeAudit.
 */
export function sanitizeMetadataForTest(
  input: Record<string, unknown> | null | undefined
): Record<string, string | number> | undefined {
  return sanitizeMetadata(input);
}

function sanitizeMetadata(input: Record<string, unknown> | null | undefined): Record<string, string | number> | undefined {
  if (!input) return undefined;
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!METADATA_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length <= 200) out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Never store a raw token — hash it so audit entries stay unexploitable. */
export function auditTokenRef(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 24);
}

/** Non-reversible IP reference for audit rows (never the raw address). */
export function auditIpHash(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256").update(ip).digest("hex");
}

export type AuditContext = {
  ipAddressHash: string | null;
  userAgent: string | null;
  requestId: string;
};

/**
 * Extract per-request audit context inside a server action / route handler.
 * Safe to call outside a request scope (e.g. seed scripts) — returns nulls.
 */
export async function auditContext(): Promise<AuditContext> {
  const requestId = randomUUID();
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    return {
      ipAddressHash: auditIpHash(ip),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      requestId,
    };
  } catch {
    // No request scope (cron, seed, tests).
    return { ipAddressHash: null, userAgent: null, requestId };
  }
}

/**
 * Write one audit event. Fire-and-forget by design — callers should not await
 * it in the request path unless they need ordering guarantees.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorType: input.actorType,
        action: input.action,
        category: input.category,
        severity: input.severity ?? "INFO",
        result: input.result ?? "SUCCESS",
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        reason: input.reason ?? null,
        metadata: sanitizeMetadata(input.metadata),
        // Privacy: the column stores a SHA-256 hash, never the raw address.
        ipAddress: input.context?.ipAddressHash ?? null,
        userAgent: input.context?.userAgent ?? null,
        requestId: input.context?.requestId ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write event", input.action, error);
  }
}
