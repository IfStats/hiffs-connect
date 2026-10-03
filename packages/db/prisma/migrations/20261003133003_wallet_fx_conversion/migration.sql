-- CreateEnum
CREATE TYPE "FxConversionStatus" AS ENUM ('QUOTED', 'CONFIRMED', 'COMPLETED', 'EXPIRED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WalletFxConversion" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "fromCurrency" VARCHAR(3) NOT NULL,
    "toCurrency" VARCHAR(3) NOT NULL,
    "sourceAmount" DECIMAL(18,6) NOT NULL,
    "targetAmount" DECIMAL(18,6) NOT NULL,
    "marketRate" DECIMAL(18,8) NOT NULL,
    "appliedRate" DECIMAL(18,8) NOT NULL,
    "feeAmount" DECIMAL(18,6),
    "feeCurrency" VARCHAR(3),
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" "FxConversionStatus" NOT NULL DEFAULT 'QUOTED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "performedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "walletTransactionId" TEXT,

    CONSTRAINT "WalletFxConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletFxConversion_walletId_idx" ON "WalletFxConversion"("walletId");

-- CreateIndex
CREATE INDEX "WalletFxConversion_status_idx" ON "WalletFxConversion"("status");

-- CreateIndex
CREATE INDEX "WalletFxConversion_expiresAt_idx" ON "WalletFxConversion"("expiresAt");

-- CreateIndex
CREATE INDEX "WalletFxConversion_createdAt_idx" ON "WalletFxConversion"("createdAt");

-- CreateIndex
CREATE INDEX "WalletFxConversion_performedByUserId_idx" ON "WalletFxConversion"("performedByUserId");

-- AddForeignKey
ALTER TABLE "WalletFxConversion" ADD CONSTRAINT "WalletFxConversion_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletFxConversion" ADD CONSTRAINT "WalletFxConversion_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletFxConversion" ADD CONSTRAINT "WalletFxConversion_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
