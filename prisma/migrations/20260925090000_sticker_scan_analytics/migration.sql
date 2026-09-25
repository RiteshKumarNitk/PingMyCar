-- Per-sticker-variant scan analytics.
ALTER TABLE "Vehicle" ADD COLUMN "variantScanCounts" JSONB;
ALTER TABLE "Vehicle" ADD COLUMN "lastScanAt" TIMESTAMP(3);
