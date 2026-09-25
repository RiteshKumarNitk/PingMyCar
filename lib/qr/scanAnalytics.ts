import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { STICKER_VARIANTS, type StickerVariant } from "@/lib/qr/sticker";

/**
 * Per-sticker-variant scan analytics.
 *
 * Every sticker's QR encodes the visitor URL with ?s=<variant>. The public
 * vehicle page validates that tag and records the scan — an atomic jsonb
 * increment, best-effort like the scan counter itself (analytics must never
 * break a parking-lot visit).
 */

const VARIANT_IDS = new Set<string>(STICKER_VARIANTS.map((v) => v.id));

/** Parse the ?s= tag; null when absent or not a known variant id. */
export function parseVariantScanParam(value: string | null | undefined): StickerVariant | null {
  if (!value || !VARIANT_IDS.has(value)) return null;
  return value as StickerVariant;
}

/**
 * Record one scan of a specific sticker variant. Fire-and-forget: callers
 * should not await this on the visitor's critical path.
 *
 * Atomic single-statement increment (jsonb_set + CASE) — a read-modify-write
 * here would lose increments when several visitors scan concurrently, and
 * this mirrors the atomic scanCount increment beside it.
 */
export async function recordVariantScan(vehicleId: string, variant: StickerVariant): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Vehicle"
    SET "variantScanCounts" = jsonb_set(
      COALESCE("variantScanCounts", '{}'::jsonb),
      ARRAY[${variant}]::text[],
      to_jsonb(
        CASE
          WHEN jsonb_typeof(COALESCE("variantScanCounts", '{}'::jsonb) -> ${variant}) = 'number'
          THEN (COALESCE("variantScanCounts", '{}'::jsonb) ->> ${variant})::int + 1
          ELSE 1
        END
      )
    )
    WHERE "id" = ${vehicleId}
  `;
}

/** Typed per-variant counts for dashboards — always includes all five variants. */
export function variantScanCounts(
  raw: Prisma.JsonValue | null,
): Record<StickerVariant, number> {
  const obj = (raw ?? {}) as Prisma.JsonObject;
  return Object.fromEntries(
    STICKER_VARIANTS.map((v) => [v.id, typeof obj[v.id] === "number" ? (obj[v.id] as number) : 0])
  ) as Record<StickerVariant, number>;
}
