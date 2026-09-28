-- Conversation retention: owners can keep a conversation; unkept ones are
-- auto-deleted 5 days after last activity by the daily purge cron.
ALTER TABLE "Conversation" ADD COLUMN "keptAt" TIMESTAMP(3);

CREATE INDEX "Conversation_keptAt_updatedAt_idx" ON "Conversation"("keptAt", "updatedAt");
