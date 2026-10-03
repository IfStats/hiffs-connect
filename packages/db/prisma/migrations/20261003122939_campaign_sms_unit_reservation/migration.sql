/*
  Warnings:

  - A unique constraint covering the columns `[campaignId,type]` on the table `SmsUnitTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "SmsUnitTransactionType" ADD VALUE 'CAMPAIGN_RESERVATION';

-- AlterTable
ALTER TABLE "SmsUnitTransaction" ADD COLUMN     "campaignId" TEXT;

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_campaignId_idx" ON "SmsUnitTransaction"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsUnitTransaction_campaignId_type_key" ON "SmsUnitTransaction"("campaignId", "type");

-- AddForeignKey
ALTER TABLE "SmsUnitTransaction" ADD CONSTRAINT "SmsUnitTransaction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
