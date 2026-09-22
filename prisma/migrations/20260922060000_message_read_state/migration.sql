-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "scanCount" INTEGER NOT NULL DEFAULT 0;

