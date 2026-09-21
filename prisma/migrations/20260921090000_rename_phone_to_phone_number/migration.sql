-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "phoneNumberVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- RenameIndex
ALTER INDEX "Vehicle_publicQrToken_key" RENAME TO "Vehicle_publicToken_key";
