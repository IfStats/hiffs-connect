-- DropIndex
DROP INDEX "User_phone_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationReminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_emailVerified_createdAt_idx" ON "User"("emailVerified", "createdAt");
