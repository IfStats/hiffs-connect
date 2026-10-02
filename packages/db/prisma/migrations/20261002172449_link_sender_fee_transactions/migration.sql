/*
  Warnings:

  - A unique constraint covering the columns `[senderRegistrationId,type]` on the table `WalletTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "senderRegistrationId" TEXT;

-- CreateIndex
CREATE INDEX "WalletTransaction_senderRegistrationId_idx" ON "WalletTransaction"("senderRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_senderRegistrationId_type_key" ON "WalletTransaction"("senderRegistrationId", "type");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_senderRegistrationId_fkey" FOREIGN KEY ("senderRegistrationId") REFERENCES "SenderRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
