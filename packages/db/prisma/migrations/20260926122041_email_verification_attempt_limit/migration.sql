-- AlterTable
ALTER TABLE "BusinessInvitation" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmailVerificationToken" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0;
