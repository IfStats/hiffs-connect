-- CreateEnum
CREATE TYPE "SmsUnitTransactionType" AS ENUM ('ADMIN_CREDIT', 'ADMIN_DEBIT', 'MESSAGE_DEBIT', 'REFUND', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "smsUnits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SmsUnitTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "messageId" TEXT,
    "performedByUserId" TEXT,
    "type" "SmsUnitTransactionType" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "units" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsUnitTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_walletId_idx" ON "SmsUnitTransaction"("walletId");

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_messageId_idx" ON "SmsUnitTransaction"("messageId");

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_performedByUserId_idx" ON "SmsUnitTransaction"("performedByUserId");

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_type_idx" ON "SmsUnitTransaction"("type");

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_status_idx" ON "SmsUnitTransaction"("status");

-- CreateIndex
CREATE INDEX "SmsUnitTransaction_createdAt_idx" ON "SmsUnitTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "SmsUnitTransaction" ADD CONSTRAINT "SmsUnitTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsUnitTransaction" ADD CONSTRAINT "SmsUnitTransaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsUnitTransaction" ADD CONSTRAINT "SmsUnitTransaction_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
