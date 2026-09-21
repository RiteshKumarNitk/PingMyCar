import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Never log or store the raw IP (per ARCHITECTURE.md). Only the hash is used,
 * as a rate-limit bucket key.
 */
export function hashedIp(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(raw).digest("hex");
}
