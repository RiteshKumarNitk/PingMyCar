-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "color" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_vehicleId_updatedAt_idx" ON "Conversation"("vehicleId", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_vehicleId_status_idx" ON "Conversation"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "Message_conversationId_senderType_readAt_idx" ON "Message"("conversationId", "senderType", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

