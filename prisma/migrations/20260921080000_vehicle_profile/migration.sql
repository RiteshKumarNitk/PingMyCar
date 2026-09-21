-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'BIKE', 'SCOOTER', 'TRUCK', 'VAN', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactReason" AS ENUM ('LIGHTS_ON', 'MOVE_VEHICLE', 'DOOR_OPEN', 'VEHICLE_ISSUE', 'DAMAGE', 'SECURITY', 'URGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "preferredName" TEXT;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AlterTable Vehicle
ALTER TABLE "Vehicle" RENAME COLUMN "nickname" TO "name";
ALTER TABLE "Vehicle" RENAME COLUMN "publicQrToken" TO "publicToken";
ALTER TABLE "Vehicle" ADD COLUMN "type" "VehicleType";
ALTER TABLE "Vehicle" ADD COLUMN "photoUrl" TEXT;

-- Conversation.reason: text -> enum
UPDATE "Conversation" SET "reason" = 'LIGHTS_ON' WHERE "reason" IN ('lights_on', 'LIGHTS_ON');
UPDATE "Conversation" SET "reason" = 'MOVE_VEHICLE' WHERE "reason" IN ('move_vehicle', 'MOVE_VEHICLE');
UPDATE "Conversation" SET "reason" = 'DOOR_OPEN' WHERE "reason" IN ('door_open', 'DOOR_OPEN');
UPDATE "Conversation" SET "reason" = 'VEHICLE_ISSUE' WHERE "reason" IN ('vehicle_issue', 'VEHICLE_ISSUE');
UPDATE "Conversation" SET "reason" = 'DAMAGE' WHERE "reason" IN ('damage', 'DAMAGE');
UPDATE "Conversation" SET "reason" = 'SECURITY' WHERE "reason" IN ('security', 'SECURITY');
UPDATE "Conversation" SET "reason" = 'URGENT' WHERE "reason" IN ('urgent', 'URGENT');
UPDATE "Conversation" SET "reason" = 'OTHER' WHERE "reason" NOT IN (
  'LIGHTS_ON', 'MOVE_VEHICLE', 'DOOR_OPEN', 'VEHICLE_ISSUE', 'DAMAGE', 'SECURITY', 'URGENT', 'OTHER'
);

ALTER TABLE "Conversation" ALTER COLUMN "reason" TYPE "ContactReason" USING ("reason"::"ContactReason");

DROP INDEX IF EXISTS "Conversation_vehicleId_idx";
CREATE INDEX "Conversation_vehicleId_createdAt_idx" ON "Conversation"("vehicleId", "createdAt");

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN "reason" "ContactReason";

-- CreateTable VehicleProfile
CREATE TABLE "VehicleProfile" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "showVehicleName" BOOLEAN NOT NULL DEFAULT true,
    "showVehicleType" BOOLEAN NOT NULL DEFAULT true,
    "showVehiclePhoto" BOOLEAN NOT NULL DEFAULT true,
    "showRegistrationNumber" BOOLEAN NOT NULL DEFAULT false,
    "showOwnerName" BOOLEAN NOT NULL DEFAULT false,
    "showOwnerPhoto" BOOLEAN NOT NULL DEFAULT false,
    "showPreferredName" BOOLEAN NOT NULL DEFAULT false,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "allowParkingAlerts" BOOLEAN NOT NULL DEFAULT true,
    "allowVehicleIssues" BOOLEAN NOT NULL DEFAULT true,
    "allowDamageReports" BOOLEAN NOT NULL DEFAULT true,
    "allowEmergencyAlerts" BOOLEAN NOT NULL DEFAULT true,
    "allowCallRequest" BOOLEAN NOT NULL DEFAULT false,
    "allowWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleProfile_vehicleId_key" ON "VehicleProfile"("vehicleId");

ALTER TABLE "VehicleProfile" ADD CONSTRAINT "VehicleProfile_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "VehicleProfile" ("id", "vehicleId")
SELECT gen_random_uuid()::text, "id" FROM "Vehicle"
WHERE NOT EXISTS (
  SELECT 1 FROM "VehicleProfile" p WHERE p."vehicleId" = "Vehicle"."id"
);

-- CreateTable Device
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Device_fcmToken_key" ON "Device"("fcmToken");
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
