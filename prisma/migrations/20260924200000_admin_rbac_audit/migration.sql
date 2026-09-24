-- AlterEnum
-- Additive: creates the AdminRole enum used by User.adminRole.
CREATE TYPE "AdminRole" AS ENUM ('USER', 'SUPPORT', 'MODERATOR', 'OPERATIONS', 'ANALYST', 'ADMIN', 'SUPER_ADMIN');

-- AlterEnum
-- Additive: creates the audit severity/result enums used by AuditLog.
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE', 'DENIED');

-- AlterTable
-- Additive: every existing user keeps their role (defaults to USER).
ALTER TABLE "User" ADD COLUMN     "adminRole" "AdminRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "actorId" TEXT,
    "actorType" TEXT NOT NULL,

    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL,
    "result" "AuditResult" NOT NULL,

    "resourceType" TEXT,
    "resourceId" TEXT,

    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,

    "reason" TEXT,

    -- Structured, non-sensitive context only. Never secrets, tokens, or PII.
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX "AuditLog_result_idx" ON "AuditLog"("result");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
