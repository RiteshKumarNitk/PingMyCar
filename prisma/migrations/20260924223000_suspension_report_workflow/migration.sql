-- AlterEnum
-- Additive: report moderation lifecycle.
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- AlterTable
-- Additive: suspension marker. Null = active. Suspension blocks owner
-- operations server-side; it never deletes data.
ALTER TABLE "User" ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "assignedAdminId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
