/*
  Warnings:

  - The values [PENDING_ACTIVATION] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `activationCodeExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `activationCodeHash` on the `User` table. All the data in the column will be lost.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
ALTER TABLE "public"."User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "AccountStatus_new" USING ("status"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activationCodeExpiresAt",
DROP COLUMN "activationCodeHash",
ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "mustChangePassword" SET DEFAULT true;

-- CreateIndex
CREATE INDEX "XpLog_userId_createdAt_idx" ON "XpLog"("userId", "createdAt");
